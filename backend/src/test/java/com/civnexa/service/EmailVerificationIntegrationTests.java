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
        String testHash = AuthService.hashOtp(testOtp, "julian.vance@institution.edu");

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
}
