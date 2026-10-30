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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import org.mockito.Mockito;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AuthServiceIntegrationTests {

    private static final String GENERIC_AUTH_ERROR = "Invalid email or password";

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Department savedDepartment;

    @BeforeEach
    void setUp() {
        savedDepartment = departmentRepository.save(new Department("CSE", "Computer Science & Engineering"));
    }

    /**
     * Helper to provision an explicitly configured test user in the database.
     */
    private User provisionTestUser(String userRef, String name, String email, String password, RoleType role, String status) {
        User user = new User(userRef, name, email, passwordEncoder.encode(password), role);
        user.setStatus(status);
        user.setDepartment(savedDepartment);
        return userRepository.saveAndFlush(user);
    }

    @Test
    @DisplayName("Password hashing produces compliant BCrypt hash and matches correctly")
    void testPasswordHashingAndMatching() {
        String rawPassword = "SecurePass@2026!";
        String encoded = passwordEncoder.encode(rawPassword);

        assertNotNull(encoded);
        assertTrue(encoded.startsWith("$2a$") || encoded.startsWith("$2b$"));
        assertEquals(60, encoded.length());
        assertTrue(passwordEncoder.matches(rawPassword, encoded));
        assertFalse(passwordEncoder.matches("WrongPassword@999", encoded));
        assertNotEquals(rawPassword, encoded);
    }

    @Test
    @DisplayName("Successful student registration creates account with PENDING_VERIFICATION status")
    void testSuccessfulStudentRegistrationCreatesPendingVerificationAccount() {
        RegisterRequest request = new RegisterRequest("Alice Smith", "alice.smith@institution.edu", "AlicePass@2026!");
        request.setRollNumber("2026-CS-001");
        request.setEnrollmentNumber("ENR-2026-001");
        request.setDepartmentId(savedDepartment.getId());
        request.setCourse("B.Tech CSE");
        request.setSemester("Semester 1");
        request.setSection("A");

        UserResponse response = authService.registerStudent(request);

        assertNotNull(response);
        assertNotNull(response.getId());
        assertNotNull(response.getUserReference());
        assertTrue(response.getUserReference().startsWith("STU-"));
        assertEquals("Alice Smith", response.getName());
        assertEquals("alice.smith@institution.edu", response.getEmail());
        assertEquals(RoleType.STUDENT, response.getRole());
        assertEquals("PENDING_VERIFICATION", response.getStatus());
        assertEquals(savedDepartment.getId(), response.getDepartmentId());
        assertEquals("CSE", response.getDepartmentCode());
        assertEquals("2026-CS-001", response.getRollNumber());
        assertNotNull(response.getCreatedAt());

        // Verify database entity directly
        Optional<User> persisted = userRepository.findById(response.getId());
        assertTrue(persisted.isPresent());
        User user = persisted.get();
        assertEquals(RoleType.STUDENT, user.getRole());
        assertEquals("PENDING_VERIFICATION", user.getStatus());
        assertTrue(passwordEncoder.matches("AlicePass@2026!", user.getPasswordHash()));
        assertFalse(user.getPasswordHash().contains("AlicePass@2026!"));
    }

    @Test
    @DisplayName("Newly self-registered student with PENDING_VERIFICATION cannot log in (401 generic error)")
    void testPendingVerificationAccountsCannotLogin() {
        RegisterRequest regReq = new RegisterRequest("Pending User", "pending@institution.edu", "PendingPass@2026!");
        UserResponse response = authService.registerStudent(regReq);
        assertEquals("PENDING_VERIFICATION", response.getStatus());

        LoginRequest loginReq = new LoginRequest("pending@institution.edu", "PendingPass@2026!");
        ApiException ex = assertThrows(ApiException.class, () -> authService.verifyCredentials(loginReq));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals(GENERIC_AUTH_ERROR, ex.getMessage());
    }

    @Test
    @DisplayName("Explicitly activated account can successfully log in with valid credentials")
    void testActiveAccountsWithValidPasswordCanLogin() {
        // Explicitly provision an ACTIVE student account
        provisionTestUser("STU-2026-ACT01", "Active Student", "active.stu@institution.edu", "ActivePass@2026!", RoleType.STUDENT, "ACTIVE");

        LoginRequest loginReq = new LoginRequest("active.stu@institution.edu", "ActivePass@2026!");
        UserResponse response = authService.verifyCredentials(loginReq);

        assertNotNull(response);
        assertEquals("active.stu@institution.edu", response.getEmail());
        assertEquals("Active Student", response.getName());
        assertEquals(RoleType.STUDENT, response.getRole());
        assertEquals("ACTIVE", response.getStatus());
    }

    @Test
    @DisplayName("INACTIVE accounts cannot log in and receive generic 401 response")
    void testInactiveAccountsCannotLogin() {
        provisionTestUser("STU-2026-INA01", "Inactive Student", "inactive@institution.edu", "InactivePass@2026!", RoleType.STUDENT, "INACTIVE");

        LoginRequest loginReq = new LoginRequest("inactive@institution.edu", "InactivePass@2026!");
        ApiException ex = assertThrows(ApiException.class, () -> authService.verifyCredentials(loginReq));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals(GENERIC_AUTH_ERROR, ex.getMessage());
    }

    @Test
    @DisplayName("SUSPENDED accounts cannot log in and receive generic 401 response")
    void testSuspendedAccountsCannotLogin() {
        provisionTestUser("STU-2026-SUS01", "Suspended Student", "suspended@institution.edu", "SuspendedPass@2026!", RoleType.STUDENT, "SUSPENDED");

        LoginRequest loginReq = new LoginRequest("suspended@institution.edu", "SuspendedPass@2026!");
        ApiException ex = assertThrows(ApiException.class, () -> authService.verifyCredentials(loginReq));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals(GENERIC_AUTH_ERROR, ex.getMessage());
    }

    @Test
    @DisplayName("All non-ACTIVE statuses (PENDING_VERIFICATION, INACTIVE, SUSPENDED) produce identical generic 401 response")
    void testAllNonActiveStatusesProduceIdenticalGenericResponse() {
        provisionTestUser("STU-2026-P01", "P Student", "p1@institution.edu", "Pass@2026!1", RoleType.STUDENT, "PENDING_VERIFICATION");
        provisionTestUser("STU-2026-I01", "I Student", "i1@institution.edu", "Pass@2026!1", RoleType.STUDENT, "INACTIVE");
        provisionTestUser("STU-2026-S01", "S Student", "s1@institution.edu", "Pass@2026!1", RoleType.STUDENT, "SUSPENDED");

        ApiException exP = assertThrows(ApiException.class, () ->
                authService.verifyCredentials(new LoginRequest("p1@institution.edu", "Pass@2026!1")));
        ApiException exI = assertThrows(ApiException.class, () ->
                authService.verifyCredentials(new LoginRequest("i1@institution.edu", "Pass@2026!1")));
        ApiException exS = assertThrows(ApiException.class, () ->
                authService.verifyCredentials(new LoginRequest("s1@institution.edu", "Pass@2026!1")));

        assertEquals(HttpStatus.UNAUTHORIZED, exP.getStatus());
        assertEquals(HttpStatus.UNAUTHORIZED, exI.getStatus());
        assertEquals(HttpStatus.UNAUTHORIZED, exS.getStatus());

        assertEquals(GENERIC_AUTH_ERROR, exP.getMessage());
        assertEquals(GENERIC_AUTH_ERROR, exI.getMessage());
        assertEquals(GENERIC_AUTH_ERROR, exS.getMessage());
    }

    @Test
    @DisplayName("Duplicate email registration is rejected with 409 Conflict")
    void testDuplicateEmailConflict() {
        RegisterRequest req1 = new RegisterRequest("Bob Jones", "bob.jones@institution.edu", "BobPass@2026!");
        authService.registerStudent(req1);

        RegisterRequest req2 = new RegisterRequest("Bob Duplicate", "BOB.JONES@INSTITUTION.EDU", "AnotherPass@2026!");
        ApiException ex = assertThrows(ApiException.class, () -> authService.registerStudent(req2));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertTrue(ex.getMessage().contains("Email address is already registered"));
    }

    @Test
    @DisplayName("Duplicate roll number registration is rejected with 409 Conflict")
    void testDuplicateRollNumberConflict() {
        RegisterRequest req1 = new RegisterRequest("Student One", "stu1@institution.edu", "Password@123!");
        req1.setRollNumber("ROLL-2026-99");
        authService.registerStudent(req1);

        RegisterRequest req2 = new RegisterRequest("Student Two", "stu2@institution.edu", "Password@123!");
        req2.setRollNumber("ROLL-2026-99");

        ApiException ex = assertThrows(ApiException.class, () -> authService.registerStudent(req2));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertTrue(ex.getMessage().contains("Roll number is already registered"));
    }

    @Test
    @DisplayName("Invalid department reference is rejected with 400 Bad Request")
    void testInvalidDepartmentReference() {
        RegisterRequest req = new RegisterRequest("Charlie Brown", "charlie@institution.edu", "Charlie@2026!");
        req.setDepartmentId(999999L);

        ApiException ex = assertThrows(ApiException.class, () -> authService.registerStudent(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Department not found"));
    }

    @Test
    @DisplayName("Public registration attempting non-student role is strictly rejected with 400 Bad Request")
    void testRejectionOfNonStudentRoleAssignments() {
        RoleType[] forbiddenRoles = {
                RoleType.FACULTY,
                RoleType.STAFF,
                RoleType.COORDINATOR,
                RoleType.COMMITTEE_MEMBER,
                RoleType.SUPER_ADMIN,
                RoleType.DEAN,
                RoleType.HOD
        };

        for (RoleType role : forbiddenRoles) {
            RegisterRequest req = new RegisterRequest("Intruder", "intruder_" + role.name() + "@institution.edu", "IntruderPass@2026!");
            req.setRole(role);

            ApiException ex = assertThrows(ApiException.class, () -> authService.registerStudent(req),
                    "Should reject public registration with role " + role);
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
            assertTrue(ex.getMessage().contains("restricted to student accounts"));
        }
    }

    @Test
    @DisplayName("Student registration with invalid password throws 400 Bad Request")
    void testRegistrationWithInvalidPasswordThrowsBadRequest() {
        RegisterRequest reqWeak = new RegisterRequest("Weak User", "weak@institution.edu", "weak");
        ApiException ex = assertThrows(ApiException.class, () -> authService.registerStudent(reqWeak));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Password must be at least 8 characters long"));
    }

    @Test
    @DisplayName("Login with null or blank credentials throws 400 Bad Request")
    void testLoginWithNullOrBlankCredentials() {
        ApiException exNullReq = assertThrows(ApiException.class, () -> authService.verifyCredentials(null));
        assertEquals(HttpStatus.BAD_REQUEST, exNullReq.getStatus());
        assertTrue(exNullReq.getMessage().contains("Login request cannot be null"));

        ApiException exNullEmail = assertThrows(ApiException.class, () -> authService.verifyCredentials(new LoginRequest(null, "Pass@2026!")));
        assertEquals(HttpStatus.BAD_REQUEST, exNullEmail.getStatus());
        assertTrue(exNullEmail.getMessage().contains("Email is required"));

        ApiException exBlankEmail = assertThrows(ApiException.class, () -> authService.verifyCredentials(new LoginRequest("   ", "Pass@2026!")));
        assertEquals(HttpStatus.BAD_REQUEST, exBlankEmail.getStatus());
        assertTrue(exBlankEmail.getMessage().contains("Email is required"));

        ApiException exNullPass = assertThrows(ApiException.class, () -> authService.verifyCredentials(new LoginRequest("user@institution.edu", null)));
        assertEquals(HttpStatus.BAD_REQUEST, exNullPass.getStatus());
        assertTrue(exNullPass.getMessage().contains("Password is required"));

        ApiException exEmptyPass = assertThrows(ApiException.class, () -> authService.verifyCredentials(new LoginRequest("user@institution.edu", "")));
        assertEquals(HttpStatus.BAD_REQUEST, exEmptyPass.getStatus());
        assertTrue(exEmptyPass.getMessage().contains("Password is required"));
    }

    @Test
    @DisplayName("Login with unknown email returns 401 Unauthorized with generic message")
    void testLoginWithUnknownEmail() {
        LoginRequest loginReq = new LoginRequest("unknown.user@institution.edu", "AnyPass@2026!");

        ApiException ex = assertThrows(ApiException.class, () -> authService.verifyCredentials(loginReq));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals(GENERIC_AUTH_ERROR, ex.getMessage());
    }

    @Test
    @DisplayName("Login with incorrect password returns 401 Unauthorized with generic message")
    void testLoginWithIncorrectPassword() {
        provisionTestUser("STU-2026-ACT02", "Emma Watson", "emma.w@institution.edu", "EmmaPass@2026!", RoleType.STUDENT, "ACTIVE");

        LoginRequest loginReq = new LoginRequest("emma.w@institution.edu", "WrongPassword@2026!");

        ApiException ex = assertThrows(ApiException.class, () -> authService.verifyCredentials(loginReq));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals(GENERIC_AUTH_ERROR, ex.getMessage());
    }

    @Test
    @DisplayName("Login safely handles passwords exceeding 72 UTF-8 bytes without crashing, returning generic 401")
    void testLoginWithOverLimitPasswordSafelyRejected() {
        provisionTestUser("STU-2026-ACT03", "Grace Hopper", "grace.h@institution.edu", "GracePass@2026!", RoleType.STUDENT, "ACTIVE");

        // Pass 120-byte string during login
        String overLimitPassword = "A1!" + "x".repeat(117);
        LoginRequest loginReq = new LoginRequest("grace.h@institution.edu", overLimitPassword);

        ApiException ex = assertThrows(ApiException.class, () -> authService.verifyCredentials(loginReq));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals(GENERIC_AUTH_ERROR, ex.getMessage());
    }

    @Test
    @DisplayName("Email privacy masking utility obscures local-part while preserving domain for diagnostics")
    void testEmailMaskingPrivacyUtility() {
        assertEquals("a***r@institution.edu", AuthService.maskEmail("alex.mercer@institution.edu"));
        assertEquals("j***e@domain.edu", AuthService.maskEmail("jane@domain.edu"));
        assertEquals("b***@domain.edu", AuthService.maskEmail("bo@domain.edu"));
        assertEquals("[EMPTY]", AuthService.maskEmail(null));
        assertEquals("[EMPTY]", AuthService.maskEmail("   "));
        assertEquals("[INVALID_EMAIL]", AuthService.maskEmail("invalid-email-format"));
    }

    @Test
    @DisplayName("Response DTOs never expose password hashes or sensitive internal fields")
    void testResponseDtoConfidentiality() {
        RegisterRequest regReq = new RegisterRequest("Helen Keller", "helen.k@institution.edu", "HelenPass@2026!");
        UserResponse response = authService.registerStudent(regReq);

        // Confirm toString on requests protect plaintext passwords
        LoginRequest loginReq = new LoginRequest("helen.k@institution.edu", "HelenPass@2026!");
        assertTrue(loginReq.toString().contains("[PROTECTED]"));
        assertFalse(loginReq.toString().contains("HelenPass@2026!"));

        assertTrue(regReq.toString().contains("[PROTECTED]"));
        assertFalse(regReq.toString().contains("HelenPass@2026!"));

        assertNotNull(response);
        assertEquals("helen.k@institution.edu", response.getEmail());
    }

    @Test
    @DisplayName("Unique user references are generated in compliant STU format with collision resilience")
    void testUniqueUserReferenceGeneration() {
        RegisterRequest r1 = new RegisterRequest("User A", "userA@institution.edu", "ValidPass@1!");
        RegisterRequest r2 = new RegisterRequest("User B", "userB@institution.edu", "ValidPass@1!");
        RegisterRequest r3 = new RegisterRequest("User C", "userC@institution.edu", "ValidPass@1!");

        UserResponse u1 = authService.registerStudent(r1);
        UserResponse u2 = authService.registerStudent(r2);
        UserResponse u3 = authService.registerStudent(r3);

        assertTrue(u1.getUserReference().startsWith("STU-"));
        assertTrue(u2.getUserReference().startsWith("STU-"));
        assertTrue(u3.getUserReference().startsWith("STU-"));

        assertTrue(u1.getUserReference().length() <= 30);
        assertTrue(u2.getUserReference().length() <= 30);
        assertTrue(u3.getUserReference().length() <= 30);

        assertNotEquals(u1.getUserReference(), u2.getUserReference());
        assertNotEquals(u2.getUserReference(), u3.getUserReference());
        assertNotEquals(u1.getUserReference(), u3.getUserReference());
    }

    @Test
    @DisplayName("BCrypt password verification is executed for PENDING, INACTIVE, and SUSPENDED accounts as well as ACTIVE accounts")
    void testBcryptVerificationExecutedAcrossAllAccountStatuses() {
        PasswordEncoder spiedEncoder = Mockito.spy(passwordEncoder);
        AuthService testAuthService = new AuthService(userRepository, departmentRepository, spiedEncoder);

        String pass = "VerifyPass@2026!";
        User pendingUser = provisionTestUser("STU-2026-BC01", "Pending Student", "bc_pending@institution.edu", pass, RoleType.STUDENT, "PENDING_VERIFICATION");
        User inactiveUser = provisionTestUser("STU-2026-BC02", "Inactive Student", "bc_inactive@institution.edu", pass, RoleType.STUDENT, "INACTIVE");
        User suspendedUser = provisionTestUser("STU-2026-BC03", "Suspended Student", "bc_suspended@institution.edu", pass, RoleType.STUDENT, "SUSPENDED");
        User activeUser = provisionTestUser("STU-2026-BC04", "Active Student", "bc_active@institution.edu", pass, RoleType.STUDENT, "ACTIVE");

        // 1. Pending account verification attempt
        assertThrows(ApiException.class, () -> testAuthService.verifyCredentials(new LoginRequest("bc_pending@institution.edu", pass)));
        Mockito.verify(spiedEncoder).matches(eq(pass), eq(pendingUser.getPasswordHash()));

        // 2. Inactive account verification attempt
        assertThrows(ApiException.class, () -> testAuthService.verifyCredentials(new LoginRequest("bc_inactive@institution.edu", pass)));
        Mockito.verify(spiedEncoder).matches(eq(pass), eq(inactiveUser.getPasswordHash()));

        // 3. Suspended account verification attempt
        assertThrows(ApiException.class, () -> testAuthService.verifyCredentials(new LoginRequest("bc_suspended@institution.edu", pass)));
        Mockito.verify(spiedEncoder).matches(eq(pass), eq(suspendedUser.getPasswordHash()));

        // 4. Active account verification attempt (succeeds)
        UserResponse activeResp = testAuthService.verifyCredentials(new LoginRequest("bc_active@institution.edu", pass));
        assertNotNull(activeResp);
        Mockito.verify(spiedEncoder).matches(eq(pass), eq(activeUser.getPasswordHash()));
    }

    @Test
    @DisplayName("Unknown accounts undergo dummy BCrypt verification to mitigate timing discrepancies")
    void testUnknownAccountUndergoesDummyBcryptVerification() {
        PasswordEncoder spiedEncoder = Mockito.spy(passwordEncoder);
        AuthService testAuthService = new AuthService(userRepository, departmentRepository, spiedEncoder);

        String pass = "AnyPassword@2026!";
        assertThrows(ApiException.class, () -> testAuthService.verifyCredentials(new LoginRequest("nonexistent.user@institution.edu", pass)));
        Mockito.verify(spiedEncoder).matches(eq(pass), anyString());
    }

    @Test
    @DisplayName("Over-limit passwords undergo dummy BCrypt verification without passing excessive input to BCrypt")
    void testOverLimitPasswordUndergoesDummyBcryptVerification() {
        PasswordEncoder spiedEncoder = Mockito.spy(passwordEncoder);
        AuthService testAuthService = new AuthService(userRepository, departmentRepository, spiedEncoder);

        String overLimitPass = "A1!" + "z".repeat(117);
        assertThrows(ApiException.class, () -> testAuthService.verifyCredentials(new LoginRequest("any@institution.edu", overLimitPass)));
        Mockito.verify(spiedEncoder).matches(eq("dummy"), anyString());
    }

    @Test
    @DisplayName("Simultaneous database user reference collision is caught by UNIQUE constraint and mapped to safe conflict response without transaction reuse")
    void testDatabaseUserReferenceCollisionProducesSafeConflictResponse() {
        // Pre-provision a user with reference STU-2026-COLLIDE
        provisionTestUser("STU-2026-COLLIDE", "Existing User", "existing.collide@institution.edu", "Pass@2026!1", RoleType.STUDENT, "ACTIVE");

        // Subclass AuthService to simulate an insertion race where generation yields the existing user reference
        AuthService collidingService = new AuthService(userRepository, departmentRepository, passwordEncoder) {
            @Override
            public String generateUniqueUserReference(String prefix) {
                return "STU-2026-COLLIDE";
            }
        };

        RegisterRequest req = new RegisterRequest("New Colliding Student", "new.collide@institution.edu", "ValidPass@2026!");
        req.setRollNumber("ROLL-COLLIDE-99");

        ApiException ex = assertThrows(ApiException.class, () -> collidingService.registerStudent(req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("Institutional user reference collision occurred. Please retry registration.", ex.getMessage());
    }

    @Test
    @DisplayName("User entity and database schema default status is fail-safe PENDING_VERIFICATION")
    void testFailSafeDefaultAccountStatus() {
        User defaultUser = new User();
        assertEquals("PENDING_VERIFICATION", defaultUser.getStatus());

        User paramUser = new User("STU-2026-DEF01", "Default User", "default.status@institution.edu", passwordEncoder.encode("Pass@2026!1"), RoleType.STUDENT);
        assertEquals("PENDING_VERIFICATION", paramUser.getStatus());

        paramUser.setDepartment(savedDepartment);
        User saved = userRepository.saveAndFlush(paramUser);
        assertEquals("PENDING_VERIFICATION", saved.getStatus());
    }
}
