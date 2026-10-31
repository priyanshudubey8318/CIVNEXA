package com.civnexa.service;

import com.civnexa.dto.AccountDecisionRequest;
import com.civnexa.dto.LoginRequest;
import com.civnexa.dto.RegisterRequest;
import com.civnexa.dto.ResendVerificationRequest;
import com.civnexa.dto.UserResponse;
import com.civnexa.dto.VerifyEmailRequest;
import com.civnexa.entity.Department;
import com.civnexa.entity.EmailVerification;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.DepartmentRepository;
import com.civnexa.repository.EmailVerificationRepository;
import com.civnexa.repository.UserRepository;
import com.civnexa.security.PasswordValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // Standard generic message for all external authentication failures
    public static final String GENERIC_AUTH_FAILURE_MESSAGE = "Invalid email or password";

    // Standard user account lifecycle statuses
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_PENDING_VERIFICATION = "PENDING_VERIFICATION";
    public static final String STATUS_PENDING_APPROVAL = "PENDING_APPROVAL";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_SUSPENDED = "SUSPENDED";

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailService emailService;
    private final AuditService auditService;

    // Dynamically generated dummy hash guaranteeing exact work factor parity with the configured PasswordEncoder
    private final String dummyHash;

    @Value("${civnexa.otp.hmac-secret:civnexa_institutional_otp_hmac_secret_key_at_least_256_bits_for_sha256}")
    private String otpHmacSecret;

    @Value("${civnexa.jwt.secret:}")
    private String jwtSecret;

    @Autowired
    public AuthService(UserRepository userRepository,
                       DepartmentRepository departmentRepository,
                       PasswordEncoder passwordEncoder,
                       @Autowired(required = false) EmailVerificationRepository emailVerificationRepository,
                       @Autowired(required = false) EmailService emailService,
                       @Autowired(required = false) AuditService auditService) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailVerificationRepository = emailVerificationRepository;
        this.emailService = emailService;
        this.auditService = auditService;
        // Generate dummy hash using the configured encoder to match rounds and format identically
        this.dummyHash = passwordEncoder.encode("CivnexaTimingMitigationDummyPassword2026!");
    }

    /**
     * Backward-compatible constructor for unit tests.
     */
    public AuthService(UserRepository userRepository,
                       DepartmentRepository departmentRepository,
                       PasswordEncoder passwordEncoder) {
        this(userRepository, departmentRepository, passwordEncoder, null, null, null);
    }

    /**
     * Registers a student through the public registration interface.
     * Enforces that public self-registration can ONLY create STUDENT accounts.
     * Employs pre-persistence bounded retries for collision-free user references.
     * Newly registered accounts are assigned PENDING_VERIFICATION by default.
     * Generates a secure 6-digit OTP challenge for email verification.
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
        User savedUser;
        try {
            savedUser = userRepository.saveAndFlush(user);
            log.info("Student registered successfully with status {}: userRef={}, email={}",
                    STATUS_PENDING_VERIFICATION, userReference, maskEmail(normalizedEmail));
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

        // 11. Create and dispatch 6-digit email OTP verification challenge
        dispatchNewVerificationOtp(normalizedEmail);

        if (auditService != null) {
            auditService.recordEvent("USER_REGISTER", "USER", userReference, null,
                    "Student self-registered with pending verification");
        }

        return UserResponse.fromEntity(savedUser);
    }

    /**
     * Verifies the student's email using the 6-digit OTP code.
     * Transitions user from PENDING_VERIFICATION to PENDING_APPROVAL.
     *
     * @param request Verification payload containing email and 6-digit OTP
     * @return UserResponse updated with PENDING_APPROVAL status
     */
    @Transactional
    public UserResponse verifyEmail(VerifyEmailRequest request) {
        if (request == null) {
            throw new ApiException("Verification request cannot be null", HttpStatus.BAD_REQUEST);
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new ApiException("Email is required", HttpStatus.BAD_REQUEST);
        }
        if (request.getOtp() == null || !request.getOtp().trim().matches("^[0-9]{6}$")) {
            throw new ApiException("Verification code must be exactly 6 numeric digits", HttpStatus.BAD_REQUEST);
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ApiException("No account found with this email address", HttpStatus.NOT_FOUND));

        if (STATUS_PENDING_APPROVAL.equalsIgnoreCase(user.getStatus()) || STATUS_ACTIVE.equalsIgnoreCase(user.getStatus())) {
            throw new ApiException("Email has already been verified for this account", HttpStatus.CONFLICT);
        }

        if (!STATUS_PENDING_VERIFICATION.equalsIgnoreCase(user.getStatus())) {
            throw new ApiException("Account is not in a state awaiting email verification", HttpStatus.BAD_REQUEST);
        }

        if (emailVerificationRepository == null) {
            // Test mode fallback
            user.setStatus(STATUS_PENDING_APPROVAL);
            user = userRepository.saveAndFlush(user);
            return UserResponse.fromEntity(user);
        }

        EmailVerification verification = emailVerificationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new ApiException("No active verification code found for this email. Please request a new code.",
                        HttpStatus.BAD_REQUEST));

        if (verification.getVerifiedAt() != null) {
            throw new ApiException("This verification code has already been used", HttpStatus.CONFLICT);
        }

        if (Instant.now().isAfter(verification.getExpiresAt())) {
            throw new ApiException("Verification code has expired. Please request a new code.", HttpStatus.BAD_REQUEST);
        }

        if (verification.getAttempts() >= verification.getMaxAttempts()) {
            throw new ApiException("Maximum verification attempts exceeded. Please request a new verification code.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }

        // Record verification attempt
        verification.setAttempts(verification.getAttempts() + 1);
        emailVerificationRepository.saveAndFlush(verification);

        // Keyed HMAC-SHA256 constant-time comparison
        String computedHash = computeOtpHmac(request.getOtp().trim(), normalizedEmail);
        boolean matches = MessageDigest.isEqual(
                computedHash.getBytes(StandardCharsets.UTF_8),
                verification.getOtpHash().getBytes(StandardCharsets.UTF_8)
        );

        if (!matches) {
            int remaining = verification.getMaxAttempts() - verification.getAttempts();
            if (remaining <= 0) {
                throw new ApiException("Invalid verification code. Maximum attempts reached. Please request a new code.",
                        HttpStatus.BAD_REQUEST);
            }
            throw new ApiException("Invalid verification code. " + remaining + " attempts remaining.", HttpStatus.BAD_REQUEST);
        }

        // Verification successful
        verification.setVerifiedAt(Instant.now());
        emailVerificationRepository.saveAndFlush(verification);

        user.setStatus(STATUS_PENDING_APPROVAL);
        User updatedUser = userRepository.saveAndFlush(user);

        log.info("Email verified successfully for student userRef={}: transitioned to {}",
                user.getUserReference(), STATUS_PENDING_APPROVAL);

        if (auditService != null) {
            auditService.recordEvent("EMAIL_VERIFIED", "USER", user.getUserReference(), user,
                    "Student email verified; status transitioned to PENDING_APPROVAL");
        }

        return UserResponse.fromEntity(updatedUser);
    }

    /**
     * Resends a fresh 6-digit verification OTP challenge, respecting a 60-second cooldown window.
     *
     * @param request Resend payload with email
     */
    @Transactional
    public void resendVerification(ResendVerificationRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new ApiException("Email is required", HttpStatus.BAD_REQUEST);
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ApiException("No account found with this email address", HttpStatus.NOT_FOUND));

        if (!STATUS_PENDING_VERIFICATION.equalsIgnoreCase(user.getStatus())) {
            throw new ApiException("Account is not awaiting email verification", HttpStatus.BAD_REQUEST);
        }

        if (emailVerificationRepository != null) {
            Optional<EmailVerification> latestOpt = emailVerificationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail);
            if (latestOpt.isPresent()) {
                EmailVerification latest = latestOpt.get();
                if (Instant.now().isBefore(latest.getResendAvailableAt())) {
                    long secondsLeft = Duration.between(Instant.now(), latest.getResendAvailableAt()).getSeconds() + 1;
                    throw new ApiException("Please wait " + secondsLeft + " seconds before requesting a new code",
                            HttpStatus.TOO_MANY_REQUESTS);
                }
            }
        }

        dispatchNewVerificationOtp(normalizedEmail);
        log.info("Resent email verification challenge to email={}", maskEmail(normalizedEmail));
    }

    /**
     * Internal helper to generate and persist a fresh hashed OTP challenge and dispatch email.
     */
    private void dispatchNewVerificationOtp(String email) {
        String otp = generateOtp();
        String otpHash = computeOtpHmac(otp, email);

        Instant expiresAt = Instant.now().plus(10, ChronoUnit.MINUTES);
        Instant resendAvailableAt = Instant.now().plus(60, ChronoUnit.SECONDS);

        if (emailVerificationRepository != null) {
            EmailVerification verification = new EmailVerification(email, otpHash, expiresAt, resendAvailableAt);
            emailVerificationRepository.saveAndFlush(verification);
        }

        if (emailService != null) {
            emailService.sendVerificationOtp(email, otp);
        }
    }

    /**
     * Generates a cryptographically random 6-digit numeric OTP string.
     */
    public static String generateOtp() {
        int code = SECURE_RANDOM.nextInt(900000) + 100000;
        return String.valueOf(code);
    }

    /**
     * Computes keyed HMAC-SHA256 digest using configured CIVNEXA_OTP_HMAC_SECRET.
     * Enforces that the secret is distinct from the JWT secret and meets 256-bit strength.
     */
    public String computeOtpHmac(String otp, String email) {
        validateOtpHmacSecret();
        return computeOtpHmacWithSecret(otp, email, this.otpHmacSecret);
    }

    public static String computeOtpHmacWithSecret(String otp, String email, String secret) {
        if (secret == null || secret.trim().length() < 32) {
            throw new IllegalStateException("CIVNEXA_OTP_HMAC_SECRET is missing or does not meet the minimum 256-bit requirement.");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.trim().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            String payload = email.trim().toLowerCase() + ":" + otp.trim();
            byte[] hmacBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hmacBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("HMAC-SHA256 computation failed", e);
        }
    }

    public void validateOtpHmacSecret() {
        if (otpHmacSecret == null || otpHmacSecret.trim().length() < 32) {
            throw new IllegalStateException("CIVNEXA_OTP_HMAC_SECRET must be configured and at least 32 characters long.");
        }
        if (jwtSecret != null && !jwtSecret.trim().isEmpty() && otpHmacSecret.trim().equals(jwtSecret.trim())) {
            throw new IllegalStateException("Security Violation: CIVNEXA_OTP_HMAC_SECRET must not share the same secret as JWT token signing.");
        }
    }

    public String hashOtp(String otp, String email) {
        return computeOtpHmac(otp, email);
    }

    public void setOtpHmacSecret(String otpHmacSecret) {
        this.otpHmacSecret = otpHmacSecret;
    }

    public void setJwtSecret(String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    /**
     * Lists accounts pending institutional review (PENDING_APPROVAL status).
     */
    @Transactional(readOnly = true)
    public Page<UserResponse> getPendingRegistrations(Pageable pageable) {
        return userRepository.findByStatus(STATUS_PENDING_APPROVAL, pageable)
                .map(UserResponse::fromEntity);
    }

    /**
     * Approves a verified registration, transitioning the account to ACTIVE status.
     */
    @Transactional
    public UserResponse approveRegistration(Long userId, User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found with ID: " + userId, HttpStatus.NOT_FOUND));

        if (STATUS_ACTIVE.equalsIgnoreCase(user.getStatus())) {
            throw new ApiException("Account is already active", HttpStatus.BAD_REQUEST);
        }

        user.setStatus(STATUS_ACTIVE);
        User savedUser = userRepository.saveAndFlush(user);

        if (emailService != null) {
            emailService.sendAccountApprovedNotification(savedUser.getEmail(), savedUser.getName());
        }

        if (auditService != null) {
            auditService.recordEvent("USER_APPROVED", "USER", user.getUserReference(), actor,
                    "Institutional registration approved; account activated");
        }

        log.info("Account approved for userRef={} by actor={}", user.getUserReference(),
                actor != null ? actor.getUserReference() : "SYSTEM");

        return UserResponse.fromEntity(savedUser);
    }

    /**
     * Rejects an account registration, transitioning the account to INACTIVE status.
     */
    @Transactional
    public UserResponse rejectRegistration(Long userId, AccountDecisionRequest decision, User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found with ID: " + userId, HttpStatus.NOT_FOUND));

        String reason = decision != null ? decision.getReason() : "Roster verification could not be confirmed";

        user.setStatus(STATUS_INACTIVE);
        User savedUser = userRepository.saveAndFlush(user);

        if (emailService != null) {
            emailService.sendAccountRejectedNotification(savedUser.getEmail(), savedUser.getName(), reason);
        }

        if (auditService != null) {
            auditService.recordEvent("USER_REJECTED", "USER", user.getUserReference(), actor,
                    "Institutional registration rejected: " + reason);
        }

        log.info("Account rejected for userRef={} by actor={}: reason={}", user.getUserReference(),
                actor != null ? actor.getUserReference() : "SYSTEM", reason);

        return UserResponse.fromEntity(savedUser);
    }

    /**
     * Suspends an active user account.
     */
    @Transactional
    public UserResponse suspendUser(Long userId, AccountDecisionRequest decision, User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found with ID: " + userId, HttpStatus.NOT_FOUND));

        if (user.getRole() == RoleType.SUPER_ADMIN) {
            throw new ApiException("Super Administrator accounts cannot be suspended", HttpStatus.FORBIDDEN);
        }
        if (actor != null && user.getId().equals(actor.getId())) {
            throw new ApiException("Users cannot suspend their own account", HttpStatus.FORBIDDEN);
        }

        String reason = decision != null && decision.getReason() != null ? decision.getReason() : "Administrative action";

        user.setStatus(STATUS_SUSPENDED);
        User savedUser = userRepository.saveAndFlush(user);

        if (auditService != null) {
            auditService.recordEvent("USER_SUSPENDED", "USER", user.getUserReference(), actor,
                    "User account suspended: " + reason);
        }

        log.info("Account suspended for userRef={} by actor={}: reason={}", user.getUserReference(),
                actor != null ? actor.getUserReference() : "SYSTEM", reason);

        return UserResponse.fromEntity(savedUser);
    }

    /**
     * Activates or reinstates a suspended/inactive user account.
     */
    @Transactional
    public UserResponse activateUser(Long userId, User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found with ID: " + userId, HttpStatus.NOT_FOUND));

        user.setStatus(STATUS_ACTIVE);
        User savedUser = userRepository.saveAndFlush(user);

        if (auditService != null) {
            auditService.recordEvent("USER_ACTIVATED", "USER", user.getUserReference(), actor,
                    "User account activated/reinstated");
        }

        log.info("Account activated for userRef={} by actor={}", user.getUserReference(),
                actor != null ? actor.getUserReference() : "SYSTEM");

        return UserResponse.fromEntity(savedUser);
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
        // (ACTIVE, PENDING_VERIFICATION, PENDING_APPROVAL, INACTIVE, SUSPENDED all undergo BCrypt password verification)
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
