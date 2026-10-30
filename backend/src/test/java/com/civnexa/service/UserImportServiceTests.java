package com.civnexa.service;

import com.civnexa.dto.ImportResultResponse;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.repository.DepartmentRepository;
import com.civnexa.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class UserImportServiceTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private ObjectMapper objectMapper;

    private UserImportService userImportService;

    @BeforeEach
    void setUp() {
        userImportService = new UserImportService(
                userRepository,
                departmentRepository,
                passwordEncoder,
                authService,
                auditService,
                objectMapper
        );
    }

    @Test
    @DisplayName("Bulk import successfully imports valid users from CSV")
    void testCsvBulkImport() {
        String csvContent = "name,email,roll_number,role,course\n" +
                "Alice Smith,alice.smith@institution.edu,ROLL-CSV-001,STUDENT,B.Tech CSE\n" +
                "Bob Jones,bob.jones@institution.edu,ROLL-CSV-002,STUDENT,B.Tech IT\n" +
                "Dr. John Doe,john.doe@institution.edu,,FACULTY,\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "students.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        User adminActor = new User();
        adminActor.setUserReference("ADM-ROOT-001");
        adminActor.setName("Platform Admin");
        adminActor.setRole(RoleType.SUPER_ADMIN);

        ImportResultResponse res = userImportService.importUsers(file, adminActor);

        assertThat(res.getTotalRows()).isEqualTo(3);
        assertThat(res.getSuccessCount()).isEqualTo(3);
        assertThat(res.getFailureCount()).isEqualTo(0);
        assertThat(res.getFileChecksum()).isNotNull();

        User alice = userRepository.findByEmailIgnoreCase("alice.smith@institution.edu").orElse(null);
        assertThat(alice).isNotNull();
        assertThat(alice.getStatus()).isEqualTo(AuthService.STATUS_ACTIVE);
        assertThat(alice.getRole()).isEqualTo(RoleType.STUDENT);

        User drJohn = userRepository.findByEmailIgnoreCase("john.doe@institution.edu").orElse(null);
        assertThat(drJohn).isNotNull();
        assertThat(drJohn.getRole()).isEqualTo(RoleType.FACULTY);
        assertThat(drJohn.getUserReference()).startsWith("FAC-");
    }

    @Test
    @DisplayName("Bulk import records failure for invalid email or duplicate row")
    void testCsvBulkImportWithValidationErrors() {
        String csvContent = "name,email,roll_number,role\n" +
                "Valid User,valid.user@institution.edu,ROLL-CSV-010,STUDENT\n" +
                "No Email Person,,ROLL-CSV-011,STUDENT\n" +
                "Bad Email Person,not-an-email,ROLL-CSV-012,STUDENT\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "data.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        ImportResultResponse res = userImportService.importUsers(file, null);

        assertThat(res.getTotalRows()).isEqualTo(3);
        assertThat(res.getSuccessCount()).isEqualTo(1);
        assertThat(res.getFailureCount()).isEqualTo(2);
        assertThat(res.getErrors()).hasSize(2);
    }

    @Test
    @DisplayName("Bulk import successfully parses JSON input")
    void testJsonBulkImport() {
        String jsonContent = "[\n" +
                "  {\"name\": \"Kavita Rao\", \"email\": \"kavita.rao@institution.edu\", \"role\": \"COORDINATOR\"},\n" +
                "  {\"name\": \"Suresh Patel\", \"email\": \"suresh.patel@institution.edu\", \"role\": \"STAFF\"}\n" +
                "]";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.json",
                "application/json",
                jsonContent.getBytes(StandardCharsets.UTF_8)
        );

        ImportResultResponse res = userImportService.importUsers(file, null);

        assertThat(res.getTotalRows()).isEqualTo(2);
        assertThat(res.getSuccessCount()).isEqualTo(2);
        assertThat(res.getFailureCount()).isEqualTo(0);

        User kavita = userRepository.findByEmailIgnoreCase("kavita.rao@institution.edu").orElse(null);
        assertThat(kavita).isNotNull();
        assertThat(kavita.getRole()).isEqualTo(RoleType.COORDINATOR);
    }
}
