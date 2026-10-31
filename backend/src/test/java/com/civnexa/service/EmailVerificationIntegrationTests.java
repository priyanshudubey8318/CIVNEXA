package com.civnexa.service;

import com.civnexa.dto.AccountDecisionRequest;
import com.civnexa.dto.LoginRequest;
import com.civnexa.dto.RegisterRequest;
import com.civnexa.dto.ResendVerificationRequest;
import com.civnexa.dto.UserResponse;
import com.civnexa.dto.VerifyEmailRequest;
import com.civnexa.entity.EmailVerification;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.DepartmentRepository;
import com.civnexa.repository.EmailVerificationRepository;
import com.civnexa.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class EmailVerificationIntegrationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailVerificationRepository emailVerificationRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AuditService auditService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                departmentRepository,
                passwordEncoder,
                emailVerificationRepository,
                emailService,
                auditService
        );
        authService.setOtpHmacSecret("civnexa_test_isolated_otp_hmac_secret_key_at_least_256_bits_for_testing");
        authService.setJwtSecret("civnexa_test_isolated_secret_key_at_least_256_bits_long_for_test_environment_2026");
    }

    @Test
    @DisplayName("Student registration creates PENDING_VERIFICATION user and dispatches 6-digit OTP challenge")
    void testRegistrationCreatesVerificationChallenge() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Maya Lin");
        req.setEmail("maya.lin@institution.edu");
        req.setPassword("SecurePass2026!");
        req.setRollNumber("ROLL-VERIF-001");

        UserResponse res = authService.registerStudent(req);
        assertThat(res.getStatus()).isEqualTo(AuthService.STATUS_PENDING_VERIFICATION);

        EmailVerification verification = emailVerificationRepository
                .findTopByEmailOrderByCreatedAtDesc("maya.lin@institution.edu")
                .orElse(null);

        assertThat(verification).isNotNull();
        assertThat(verification.getAttempts()).isEqualTo(0);
        assertThat(verification.getMaxAttempts()).isEqualTo(5);
        assertThat(verification.getExpiresAt()).isAfter(Instant.now());
        assertThat(verification.getVerifiedAt()).isNull();
    }

    @Test
    @DisplayName("Email verification succeeds with correct OTP and transitions user to PENDING_APPROVAL")
    void testSuccessfulEmailVerification() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Julian Vance");
        req.setEmail("julian.vance@institution.edu");
        req.setPassword("SecurePass2026!");
        req.setRollNumber("ROLL-VERIF-002");

        authService.registerStudent(req);

        // Manually create a known OTP for test determinism
        String testOtp = "123456";
        String testHash = authService.computeOtpHmac(testOtp, "julian.vance@institution.edu");

        EmailVerification customVerif = new EmailVerification(
                "julian.vance@institution.edu",
                testHash,
                Instant.now().plus(10, ChronoUnit.MINUTES),
                Instant.now().plus(60, ChronoUnit.SECONDS)
        );
        emailVerificationRepository.saveAndFlush(customVerif);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest("julian.vance@institution.edu", testOtp);
        UserResponse response = authService.verifyEmail(verifyReq);

        assertThat(response.getStatus()).isEqualTo(AuthService.STATUS_PENDING_APPROVAL);

        User updatedUser = userRepository.findByEmailIgnoreCase("julian.vance@institution.edu").orElseThrow();
        assertThat(updatedUser.getStatus()).isEqualTo(AuthService.STATUS_PENDING_APPROVAL);
    }

    @Test
    @DisplayName("Email verification fails on incorrect OTP and increments attempt count")
    void testIncorrectOtpIncrementsAttempts() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Zara Taylor");
        req.setEmail("zara.taylor@institution.edu");
        req.setPassword("SecurePass2026!");
        req.setRollNumber("ROLL-VERIF-003");

        authService.registerStudent(req);

        VerifyEmailRequest badReq = new VerifyEmailRequest("zara.taylor@institution.edu", "999999");

        assertThatThrownBy(() -> authService.verifyEmail(badReq))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiEx.getMessage()).contains("Invalid verification code");
                });

        EmailVerification verification = emailVerificationRepository
                .findTopByEmailOrderByCreatedAtDesc("zara.taylor@institution.edu")
                .orElseThrow();
        assertThat(verification.getAttempts()).isEqualTo(1);
    }

    @Test
    @DisplayName("Resend verification throttles requests during 60-second cooldown window")
    void testResendThrottlingDuringCooldown() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Devon Scott");
        req.setEmail("devon.scott@institution.edu");
        req.setPassword("SecurePass2026!");
        req.setRollNumber("ROLL-VERIF-004");

        authService.registerStudent(req);

        ResendVerificationRequest resendReq = new ResendVerificationRequest("devon.scott@institution.edu");

        // First immediate resend attempt should be blocked by 60s cooldown
        assertThatThrownBy(() -> authService.resendVerification(resendReq))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                    assertThat(apiEx.getMessage()).contains("Please wait");
                });
    }

    @Test
    @DisplayName("Admin approval transitions PENDING_APPROVAL user to ACTIVE, enabling login")
    void testAdminApprovalLifecycle() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Elena Rostova");
        req.setEmail("elena.rostova@institution.edu");
        req.setPassword("SecurePass2026!");
        req.setRollNumber("ROLL-VERIF-005");

        authService.registerStudent(req);

        User user = userRepository.findByEmailIgnoreCase("elena.rostova@institution.edu").orElseThrow();
        user.setStatus(AuthService.STATUS_PENDING_APPROVAL);
        userRepository.saveAndFlush(user);

        // Before approval: login must fail
        LoginRequest loginReq = new LoginRequest("elena.rostova@institution.edu", "SecurePass2026!");
        assertThatThrownBy(() -> authService.verifyUserCredentials(loginReq))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));

        // Admin approves registration
        User adminUser = new User();
        adminUser.setUserReference("ADM-TEST-001");
        adminUser.setName("Admin Tester");
        adminUser.setRole(RoleType.SUPER_ADMIN);

        UserResponse approvedResponse = authService.approveRegistration(user.getId(), adminUser);
        assertThat(approvedResponse.getStatus()).isEqualTo(AuthService.STATUS_ACTIVE);

        // After approval: login succeeds
        User loggedInUser = authService.verifyUserCredentials(loginReq);
        assertThat(loggedInUser.getStatus()).isEqualTo(AuthService.STATUS_ACTIVE);
    }

    @Test
    @DisplayName("Admin rejection transitions user to INACTIVE")
    void testAdminRejectionLifecycle() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Marcus Kane");
        req.setEmail("marcus.kane@institution.edu");
        req.setPassword("SecurePass2026!");
        req.setRollNumber("ROLL-VERIF-006");

        authService.registerStudent(req);
        User user = userRepository.findByEmailIgnoreCase("marcus.kane@institution.edu").orElseThrow();

        AccountDecisionRequest decision = new AccountDecisionRequest("Enrollment not verified by registrar");
        UserResponse rejectedResponse = authService.rejectRegistration(user.getId(), decision, null);

        assertThat(rejectedResponse.getStatus()).isEqualTo(AuthService.STATUS_INACTIVE);

        LoginRequest loginReq = new LoginRequest("marcus.kane@institution.edu", "SecurePass2026!");
        assertThatThrownBy(() -> authService.verifyUserCredentials(loginReq))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Email verification rejects expired OTP code")
    void testExpiredOtpRejection() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Tara Bell");
        req.setEmail("tara.bell@institution.edu");
        req.setPassword("SecurePass2026!");
        req.setRollNumber("ROLL-VERIF-007");

        authService.registerStudent(req);

        String testOtp = "654321";
        String testHash = authService.computeOtpHmac(testOtp, "tara.bell@institution.edu");

        // Expired in past
        EmailVerification expired = new EmailVerification(
                "tara.bell@institution.edu",
                testHash,
                Instant.now().minus(5, ChronoUnit.MINUTES),
                Instant.now().minus(10, ChronoUnit.MINUTES)
        );
        emailVerificationRepository.saveAndFlush(expired);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest("tara.bell@institution.edu", testOtp);
        assertThatThrownBy(() -> authService.verifyEmail(verifyReq))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiEx.getMessage()).contains("expired");
                });
    }

    @Test
    @DisplayName("Email verification rejects reused OTP token")
    void testReusedOtpRejection() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Leo Chen");
        req.setEmail("leo.chen@institution.edu");
        req.setPassword("SecurePass2026!");
        req.setRollNumber("ROLL-VERIF-008");

        authService.registerStudent(req);

        String testOtp = "112233";
        String testHash = authService.computeOtpHmac(testOtp, "leo.chen@institution.edu");

        EmailVerification alreadyUsed = new EmailVerification(
                "leo.chen@institution.edu",
                testHash,
                Instant.now().plus(10, ChronoUnit.MINUTES),
                Instant.now().plus(60, ChronoUnit.SECONDS)
        );
        alreadyUsed.setVerifiedAt(Instant.now());
        emailVerificationRepository.saveAndFlush(alreadyUsed);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest("leo.chen@institution.edu", testOtp);
        assertThatThrownBy(() -> authService.verifyEmail(verifyReq))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiEx.getMessage()).contains("already been used");
                });
    }

    @Test
    @DisplayName("Email verification enforces 5-attempt maximum lockout threshold")
    void testMaxAttemptsLockout() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Siddharth Rao");
        req.setEmail("siddharth.rao@institution.edu");
        req.setPassword("SecurePass2026!");
        req.setRollNumber("ROLL-VERIF-009");

        authService.registerStudent(req);

        String testOtp = "778899";
        String testHash = authService.computeOtpHmac(testOtp, "siddharth.rao@institution.edu");

        EmailVerification maxedOut = new EmailVerification(
                "siddharth.rao@institution.edu",
                testHash,
                Instant.now().plus(10, ChronoUnit.MINUTES),
                Instant.now().plus(60, ChronoUnit.SECONDS)
        );
        maxedOut.setAttempts(5);
        emailVerificationRepository.saveAndFlush(maxedOut);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest("siddharth.rao@institution.edu", testOtp);
        assertThatThrownBy(() -> authService.verifyEmail(verifyReq))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                    assertThat(apiEx.getMessage()).contains("Maximum verification attempts exceeded");
                });
    }

    @Test
    @DisplayName("HMAC secret missing or insufficient length throws IllegalStateException")
    void testMissingOrWeakHmacSecretFails() {
        AuthService brokenService = new AuthService(
                userRepository,
                departmentRepository,
                passwordEncoder,
                emailVerificationRepository,
                emailService,
                auditService
        );
        brokenService.setOtpHmacSecret("too-short");

        assertThatThrownBy(() -> brokenService.computeOtpHmac("123456", "test@civnexa.edu"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CIVNEXA_OTP_HMAC_SECRET");
    }

    @Test
    @DisplayName("HMAC secret matching JWT signing secret is rejected as security violation")
    void testHmacSecretMatchesJwtSecretViolation() {
        AuthService violatedService = new AuthService(
                userRepository,
                departmentRepository,
                passwordEncoder,
                emailVerificationRepository,
                emailService,
                auditService
        );
        String sharedKey = "shared_key_value_that_is_at_least_32_characters_long_for_security";
        violatedService.setOtpHmacSecret(sharedKey);
        violatedService.setJwtSecret(sharedKey);

        assertThatThrownBy(() -> violatedService.computeOtpHmac("123456", "test@civnexa.edu"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("must not share the same secret");
    }
}
