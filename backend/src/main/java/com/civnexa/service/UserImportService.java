package com.civnexa.service;

import com.civnexa.dto.ImportResultResponse;
import com.civnexa.dto.UserResponse;
import com.civnexa.entity.Department;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.DepartmentRepository;
import com.civnexa.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service
public class UserImportService {

    private static final Logger log = LoggerFactory.getLogger(UserImportService.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public UserImportService(UserRepository userRepository,
                             DepartmentRepository departmentRepository,
                             PasswordEncoder passwordEncoder,
                             AuthService authService,
                             AuditService auditService,
                             @org.springframework.lang.Nullable ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.auditService = auditService;
        this.objectMapper = (objectMapper != null) ? objectMapper : new ObjectMapper();
    }

    /**
     * Processes bulk user upload from CSV, XLSX, or JSON files.
     */
    @Transactional
    public ImportResultResponse importUsers(MultipartFile file, User actor) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("Uploaded file is empty or missing", HttpStatus.BAD_REQUEST);
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "import";
        String lowerFilename = originalFilename.toLowerCase();

        byte[] fileBytes;
        String checksum;
        try {
            fileBytes = file.getBytes();
            checksum = calculateSha256(fileBytes);
        } catch (Exception e) {
            throw new ApiException("Failed to read uploaded file: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }

        List<Map<String, String>> rows;
        try {
            if (lowerFilename.endsWith(".csv")) {
                rows = parseCsv(fileBytes);
            } else if (lowerFilename.endsWith(".xlsx") || lowerFilename.endsWith(".xls")) {
                rows = parseExcel(fileBytes);
            } else if (lowerFilename.endsWith(".json")) {
                rows = parseJson(fileBytes);
            } else {
                throw new ApiException("Unsupported file format. Please upload CSV (.csv), Excel (.xlsx), or JSON (.json)",
                        HttpStatus.BAD_REQUEST);
            }
        } catch (ApiException ae) {
            throw ae;
        } catch (Exception e) {
            log.error("Failed to parse file: {}", e.getMessage(), e);
            throw new ApiException("Error parsing import file: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }

        ImportResultResponse result = new ImportResultResponse(
                originalFilename,
                checksum,
                rows.size(),
                0,
                0
        );

        int rowNumber = 1;
        for (Map<String, String> row : rows) {
            rowNumber++;
            String name = getField(row, "name", "full_name", "student_name");
            String email = getField(row, "email", "email_address");
            String rollNumber = getField(row, "roll_number", "rollnumber", "roll_no", "roll");
            String enrollmentNumber = getField(row, "enrollment_number", "enrollment", "reg_no");
            String roleStr = getField(row, "role", "role_type", "user_role");
            String deptStr = getField(row, "department", "dept", "department_code");
            String course = getField(row, "course", "program");
            String semester = getField(row, "semester", "sem");
            String section = getField(row, "section", "sec");
            String password = getField(row, "password", "temp_password");

            String identifier = email != null && !email.isBlank() ? email : (rollNumber != null ? rollNumber : "Row #" + rowNumber);

            if (name == null || name.trim().isEmpty()) {
                result.getErrors().add(new ImportResultResponse.RowError(rowNumber, identifier, "Name is required"));
                result.setFailureCount(result.getFailureCount() + 1);
                continue;
            }

            if (email == null || email.trim().isEmpty() || !email.contains("@")) {
                result.getErrors().add(new ImportResultResponse.RowError(rowNumber, identifier, "Valid institutional email is required"));
                result.setFailureCount(result.getFailureCount() + 1);
                continue;
            }

            String normalizedEmail = email.trim().toLowerCase();
            if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                result.getErrors().add(new ImportResultResponse.RowError(rowNumber, identifier, "Email is already registered"));
                result.setFailureCount(result.getFailureCount() + 1);
                continue;
            }

            if (rollNumber != null && !rollNumber.trim().isEmpty() && userRepository.existsByRollNumber(rollNumber.trim())) {
                result.getErrors().add(new ImportResultResponse.RowError(rowNumber, identifier, "Roll number is already registered"));
                result.setFailureCount(result.getFailureCount() + 1);
                continue;
            }

            RoleType role = RoleType.STUDENT;
            if (roleStr != null && !roleStr.isBlank()) {
                try {
                    role = RoleType.valueOf(roleStr.trim().toUpperCase());
                } catch (IllegalArgumentException e) {
                    result.getErrors().add(new ImportResultResponse.RowError(rowNumber, identifier, "Invalid role specified: " + roleStr));
                    result.setFailureCount(result.getFailureCount() + 1);
                    continue;
                }
            }

            Department department = null;
            if (deptStr != null && !deptStr.isBlank()) {
                department = departmentRepository.findByCode(deptStr.trim().toUpperCase()).orElse(null);
                if (department == null) {
                    department = departmentRepository.findByName(deptStr.trim()).orElse(null);
                }
            }

            String userPrefix;
            switch (role) {
                case FACULTY -> userPrefix = "FAC";
                case STAFF -> userPrefix = "STF";
                case HOD -> userPrefix = "HOD";
                case DEAN -> userPrefix = "DEN";
                case COORDINATOR -> userPrefix = "CRD";
                case COMMITTEE_MEMBER -> userPrefix = "CMT";
                case SUPER_ADMIN -> userPrefix = "ADM";
                default -> userPrefix = "STU";
            }

            String userReference = authService.generateUniqueUserReference(userPrefix);
            String rawPassword = (password != null && !password.isBlank()) ? password.trim() : "CivnexaWelcome2026!";
            String passwordHash = passwordEncoder.encode(rawPassword);

            User user = new User();
            user.setUserReference(userReference);
            user.setName(name.trim());
            user.setEmail(normalizedEmail);
            user.setPasswordHash(passwordHash);
            user.setRole(role);
            user.setDepartment(department);
            user.setStatus(AuthService.STATUS_ACTIVE); // Pre-approved by administrative bulk import
            user.setRollNumber(rollNumber != null && !rollNumber.isBlank() ? rollNumber.trim() : null);
            user.setEnrollmentNumber(enrollmentNumber != null && !enrollmentNumber.isBlank() ? enrollmentNumber.trim() : null);
            user.setCourse(course != null && !course.isBlank() ? course.trim() : null);
            user.setSemester(semester != null && !semester.isBlank() ? semester.trim() : null);
            user.setSection(section != null && !section.isBlank() ? section.trim() : null);

            try {
                User saved = userRepository.saveAndFlush(user);
                result.getImportedUsers().add(UserResponse.fromEntity(saved));
                result.setSuccessCount(result.getSuccessCount() + 1);
            } catch (Exception ex) {
                result.getErrors().add(new ImportResultResponse.RowError(rowNumber, identifier, "Database save error: " + ex.getMessage()));
                result.setFailureCount(result.getFailureCount() + 1);
            }
        }

        if (auditService != null) {
            auditService.recordEvent(
                    "BULK_USER_IMPORT",
                    "IMPORT_BATCH",
                    checksum.substring(0, 16),
                    actor,
                    String.format("Imported file %s (%d success, %d failure)", originalFilename, result.getSuccessCount(), result.getFailureCount())
            );
        }

        log.info("Bulk user import processed for {}: {} success, {} failures",
                originalFilename, result.getSuccessCount(), result.getFailureCount());

        return result;
    }

    private List<Map<String, String>> parseCsv(byte[] bytes) throws Exception {
        List<Map<String, String>> list = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new java.io.ByteArrayInputStream(bytes), StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build().parse(reader)) {
            for (CSVRecord record : parser) {
                Map<String, String> row = new HashMap<>();
                for (String header : parser.getHeaderNames()) {
                    row.put(header.toLowerCase().replace(" ", "_"), record.get(header));
                }
                list.add(row);
            }
        }
        return list;
    }

    private List<Map<String, String>> parseExcel(byte[] bytes) throws Exception {
        List<Map<String, String>> list = new ArrayList<>();
        try (InputStream is = new java.io.ByteArrayInputStream(bytes);
             Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                return list;
            }

            Row headerRow = rowIterator.next();
            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) {
                headers.add(getCellValueAsString(cell).trim().toLowerCase().replace(" ", "_"));
            }

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                Map<String, String> rowMap = new HashMap<>();
                boolean hasContent = false;
                for (int i = 0; i < headers.size(); i++) {
                    Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    String val = cell != null ? getCellValueAsString(cell) : "";
                    if (!val.isBlank()) {
                        hasContent = true;
                    }
                    rowMap.put(headers.get(i), val);
                }
                if (hasContent) {
                    list.add(rowMap);
                }
            }
        }
        return list;
    }

    private List<Map<String, String>> parseJson(byte[] bytes) throws Exception {
        List<Map<String, Object>> rawList = objectMapper.readValue(bytes, new TypeReference<>() {});
        List<Map<String, String>> list = new ArrayList<>();
        for (Map<String, Object> map : rawList) {
            Map<String, String> row = new HashMap<>();
            for (Map.Entry<String, Object> e : map.entrySet()) {
                row.put(e.getKey().toLowerCase().replace(" ", "_"), e.getValue() != null ? e.getValue().toString() : "");
            }
            list.add(row);
        }
        return list;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getDateCellValue().toString();
                }
                double val = cell.getNumericCellValue();
                if (val == (long) val) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private String getField(Map<String, String> map, String... keys) {
        for (String k : keys) {
            if (map.containsKey(k) && map.get(k) != null && !map.get(k).isBlank()) {
                return map.get(k).trim();
            }
        }
        return null;
    }

    private String calculateSha256(byte[] data) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(data);
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }
}
