package com.civnexa.service;

import com.civnexa.dto.LoginRequest;
import com.civnexa.dto.RegisterRequest;
import com.civnexa.dto.UserResponse;
import com.civnexa.entity.Department;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.DepartmentRepository;
import com.civnexa.repository.UserRepository;
import com.civnexa.security.PasswordValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Year;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    // Standard generic message for all external authentication failures
    public static final String GENERIC_AUTH_FAILURE_MESSAGE = "Invalid email or password";

    // Standard user account lifecycle statuses
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_PENDING_VERIFICATION = "PENDING_VERIFICATION";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_SUSPENDED = "SUSPENDED";

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    // Dynamically generated dummy hash guaranteeing exact work factor parity with the configured PasswordEncoder
    private final String dummyHash;

    public AuthService(UserRepository userRepository,
                       DepartmentRepository departmentRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        // Generate dummy hash using the configured encoder to match rounds and format identically
        this.dummyHash = passwordEncoder.encode("CivnexaTimingMitigationDummyPassword2026!");
    }

    /**
     * Registers a student through the public registration interface.
     * Enforces that public self-registration can ONLY create STUDENT accounts.
     * Employs pre-persistence bounded retries for collision-free user references.
     * Newly registered accounts are assigned PENDING_VERIFICATION by default.
     *
     * @param request The student registration payload
     * @return UserResponse containing safe user details without credentials
     */
    @Transactional
    public UserResponse registerStudent(RegisterRequest request) {
        if (request == null) {
            throw new ApiException("Registration request cannot be null", HttpStatus.BAD_REQUEST);
        }

        // 1. Validate mandatory input fields
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ApiException("Name is required", HttpStatus.BAD_REQUEST);
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new ApiException("Email is required", HttpStatus.BAD_REQUEST);
        }

        // 2. Validate password complexity policy (including strict 72 UTF-8 byte BCrypt limit)
        PasswordValidator.validate(request.getPassword());

        // 3. Enforce public registration role restriction: STUDENT only
        if (request.getRole() != null && request.getRole() != RoleType.STUDENT) {
            log.warn("Blocked public self-registration attempt with privileged/non-student role: {}", request.getRole());
            throw new ApiException("Public self-registration is exclusively restricted to student accounts. " +
                    "Faculty, staff, and administrative roles must be provisioned through institutional administration.",
                    HttpStatus.BAD_REQUEST);
        }

        // 4. Normalize and pre-check email uniqueness (case-insensitive)
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException("Email address is already registered", HttpStatus.CONFLICT);
        }

        // 5. Pre-check roll number uniqueness if provided
        String rollNumber = null;
        if (request.getRollNumber() != null && !request.getRollNumber().trim().isEmpty()) {
            rollNumber = request.getRollNumber().trim();
            if (userRepository.existsByRollNumber(rollNumber)) {
                throw new ApiException("Roll number is already registered", HttpStatus.CONFLICT);
            }
        }

        // 6. Validate department reference if provided
        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ApiException("Department not found with ID: " + request.getDepartmentId(),
                            HttpStatus.BAD_REQUEST));
        }

        // 7. Hash password using configured BCryptPasswordEncoder (safe: length verified <= 72 bytes)
        String passwordHash = passwordEncoder.encode(request.getPassword());

        // 8. Generate unique user reference with bounded pre-persistence collision retries
        String userReference = generateUniqueUserReference("STU");

        // 9. Construct User entity template with default PENDING_VERIFICATION status
        User user = new User();
        user.setUserReference(userReference);
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordHash);
        user.setRole(RoleType.STUDENT);
        user.setDepartment(department);
        user.setStatus(STATUS_PENDING_VERIFICATION);
        user.setRollNumber(rollNumber);
        user.setEnrollmentNumber(request.getEnrollmentNumber() != null ? request.getEnrollmentNumber().trim() : null);
        user.setCourse(request.getCourse() != null ? request.getCourse().trim() : null);
        user.setSemester(request.getSemester() != null ? request.getSemester().trim() : null);
        user.setSection(request.getSection() != null ? request.getSection().trim() : null);

        // 10. Persist entity, disambiguating any concurrent constraint collisions
        try {
            User savedUser = userRepository.saveAndFlush(user);
            log.info("Student registered successfully with status {}: userRef={}, email={}",
                    STATUS_PENDING_VERIFICATION, userReference, maskEmail(normalizedEmail));
            return UserResponse.fromEntity(savedUser);
        } catch (DataIntegrityViolationException ex) {
            String msg = (ex.getMessage() + (ex.getCause() != null ? " " + ex.getCause().getMessage() : "")).toLowerCase();
            log.warn("Database constraint collision during registration for email={}: {}", maskEmail(normalizedEmail), msg);

            if (msg.contains("idx_user_ref") || msg.contains("user_reference")) {
                throw new ApiException("Institutional user reference collision occurred. Please retry registration.", HttpStatus.CONFLICT);
            } else if (msg.contains("idx_user_email") || msg.contains("email")) {
                throw new ApiException("Email address is already registered", HttpStatus.CONFLICT);
            } else if (msg.contains("idx_user_roll") || msg.contains("roll_number") || msg.contains("roll")) {
                throw new ApiException("Roll number is already registered", HttpStatus.CONFLICT);
            }
            throw new ApiException("A registration conflict occurred with existing user records", HttpStatus.CONFLICT);
        }
    }

    /**
     * Verifies user credentials for login without generating tokens (used in BE-1.3-B).
     *
     * @param request Login credentials (email and password)
     * @return Safe UserResponse if credentials are valid and account is active
     */
    @Transactional(readOnly = true)
    public UserResponse verifyCredentials(LoginRequest request) {
        User user = verifyUserCredentials(request);
        return UserResponse.fromEntity(user);
    }

    /**
     * Verifies login credentials and returns the active User entity.
     * All authentication failures return a uniform generic message ("Invalid email or password")
     * with HTTP 401 Unauthorized to prevent account enumeration, status exposure, or timing discrepancies.
     *
     * @param request Login credentials (email and password)
     * @return User entity if credentials match and account is active
     */
    @Transactional(readOnly = true)
    public User verifyUserCredentials(LoginRequest request) {
        if (request == null) {
            throw new ApiException("Login request cannot be null", HttpStatus.BAD_REQUEST);
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new ApiException("Email is required", HttpStatus.BAD_REQUEST);
        }
        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new ApiException("Password is required", HttpStatus.BAD_REQUEST);
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Safe defense against over-limit passwords during login: reject without crashing or truncation
        byte[] passwordBytes = request.getPassword().getBytes(StandardCharsets.UTF_8);
        if (passwordBytes.length > PasswordValidator.MAX_UTF8_BYTES) {
            log.debug("Authentication failed: password input exceeds maximum length for user [{}]", maskEmail(normalizedEmail));
            passwordEncoder.matches("dummy", dummyHash);
            throw new ApiException(GENERIC_AUTH_FAILURE_MESSAGE, HttpStatus.UNAUTHORIZED);
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        // Timing-discrepancy mitigation when account does not exist
        if (userOpt.isEmpty()) {
            log.debug("Authentication failed: account not found for user [{}]", maskEmail(normalizedEmail));
            passwordEncoder.matches(request.getPassword(), dummyHash);
            throw new ApiException(GENERIC_AUTH_FAILURE_MESSAGE, HttpStatus.UNAUTHORIZED);
        }

        User user = userOpt.get();

        // Perform BCrypt password verification unconditionally across all account statuses
        // (ACTIVE, PENDING_VERIFICATION, INACTIVE, SUSPENDED all undergo BCrypt password verification)
        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        boolean isActive = STATUS_ACTIVE.equalsIgnoreCase(user.getStatus());

        if (!passwordMatches || !isActive) {
            log.debug("Authentication failed for user [{}]", maskEmail(normalizedEmail));
            throw new ApiException(GENERIC_AUTH_FAILURE_MESSAGE, HttpStatus.UNAUTHORIZED);
        }

        log.debug("Credentials successfully verified for userRef={}", user.getUserReference());
        return user;
    }

    /**
     * Generates a unique user reference with format: PREFIX-YEAR-RANDOM5 (e.g. STU-2026-10492).
     * Retries up to 10 times in memory before persistence to mitigate collision with existing records.
     * Note: Pre-insert checks mitigate collision likelihood under normal operation but cannot eliminate
     * simultaneous insertion races; the database UNIQUE constraint (idx_user_ref) acts as the final
     * authority and triggers a safe conflict response if a concurrent race occurs.
     *
     * @param prefix Institutional prefix (e.g. "STU")
     * @return Generated user reference candidate
     */
    public String generateUniqueUserReference(String prefix) {
        int currentYear = Year.now().getValue();
        for (int i = 0; i < 10; i++) {
            int randomVal = ThreadLocalRandom.current().nextInt(10000, 100000);
            String candidate = prefix + "-" + currentYear + "-" + randomVal;
            if (!userRepository.existsByUserReference(candidate)) {
                return candidate;
            }
            log.warn("User reference collision on candidate {}; retrying generation (attempt {}/10)...",
                    candidate, i + 1);
        }
        // Fallback with millisecond precision if random collisions occur
        return prefix + "-" + currentYear + "-" + (System.currentTimeMillis() % 10000000L);
    }

    /**
     * Masks an email address for privacy-compliant diagnostic logging.
     * e.g., "alex.mercer@institution.edu" -> "a***r@institution.edu"
     * "al@institution.edu" -> "a***@institution.edu"
     *
     * @param email The raw email address to mask
     * @return Privacy-masked representation
     */
    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "[EMPTY]";
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "[INVALID_EMAIL]";
        }
        String local = email.substring(0, atIndex);
        String domain = email.substring(atIndex + 1);

        String maskedLocal;
        if (local.length() <= 2) {
            maskedLocal = local.charAt(0) + "***";
        } else {
            maskedLocal = local.charAt(0) + "***" + local.charAt(local.length() - 1);
        }
        return maskedLocal + "@" + domain;
    }
}
