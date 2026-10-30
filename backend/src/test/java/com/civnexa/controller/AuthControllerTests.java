package com.civnexa.controller;

import com.civnexa.dto.LoginRequest;
import com.civnexa.dto.RegisterRequest;
import com.civnexa.entity.Department;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.repository.DepartmentRepository;
import com.civnexa.repository.UserRepository;
import com.civnexa.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AuthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private AuthController authController;

    private User activeStudent;
    private User pendingStudent;
    private User suspendedStudent;
    private Department department;

    @BeforeEach
    void setUp() {
        authController.setPublicRegistrationEnabled(false);

        department = new Department();
        department.setCode("CSE");
        department.setName("Computer Science & Engineering");
        department = departmentRepository.saveAndFlush(department);

        activeStudent = new User();
        activeStudent.setUserReference("STU-2026-11111");
        activeStudent.setName("Aarav Mehta");
        activeStudent.setEmail("aarav.mehta@institution.edu");
        activeStudent.setPasswordHash(passwordEncoder.encode("ValidP@ssw0rd123!"));
        activeStudent.setRole(RoleType.STUDENT);
        activeStudent.setStatus("ACTIVE");
        activeStudent.setDepartment(department);
        activeStudent = userRepository.saveAndFlush(activeStudent);

        pendingStudent = new User();
        pendingStudent.setUserReference("STU-2026-22222");
        pendingStudent.setName("Priya Verma");
        pendingStudent.setEmail("priya.verma@institution.edu");
        pendingStudent.setPasswordHash(passwordEncoder.encode("ValidP@ssw0rd123!"));
        pendingStudent.setRole(RoleType.STUDENT);
        pendingStudent.setStatus("PENDING_VERIFICATION");
        pendingStudent = userRepository.saveAndFlush(pendingStudent);

        suspendedStudent = new User();
        suspendedStudent.setUserReference("STU-2026-33333");
        suspendedStudent.setName("Rohan Das");
        suspendedStudent.setEmail("rohan.das@institution.edu");
        suspendedStudent.setPasswordHash(passwordEncoder.encode("ValidP@ssw0rd123!"));
        suspendedStudent.setRole(RoleType.STUDENT);
        suspendedStudent.setStatus("SUSPENDED");
        suspendedStudent = userRepository.saveAndFlush(suspendedStudent);
    }

    @Test
    @DisplayName("POST /auth/login returns HTTP 200 with JWT access token for active user with valid credentials")
    void testSuccessfulLogin() throws Exception {
        String json = "{\"email\":\"aarav.mehta@institution.edu\",\"password\":\"ValidP@ssw0rd123!\"}";

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Authentication successful")))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.expiresInMs", is(900000)))
                .andExpect(jsonPath("$.data.user.email", is("aarav.mehta@institution.edu")))
                .andExpect(jsonPath("$.data.user.userReference", is("STU-2026-11111")))
                .andExpect(jsonPath("$.data.user.role", is("STUDENT")))
                .andExpect(jsonPath("$.data.user.status", is("ACTIVE")));
    }

    @Test
    @DisplayName("POST /auth/login returns HTTP 401 with generic error for incorrect password")
    void testLoginWithIncorrectPassword() throws Exception {
        String json = "{\"email\":\"aarav.mehta@institution.edu\",\"password\":\"WrongP@ssw0rd123!\"}";

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @DisplayName("POST /auth/login returns HTTP 401 with generic error for unknown email")
    void testLoginWithUnknownEmail() throws Exception {
        String json = "{\"email\":\"unknown.user@institution.edu\",\"password\":\"ValidP@ssw0rd123!\"}";

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("POST /auth/login returns HTTP 401 with generic error for PENDING_VERIFICATION account")
    void testLoginWithPendingVerificationAccount() throws Exception {
        String json = "{\"email\":\"priya.verma@institution.edu\",\"password\":\"ValidP@ssw0rd123!\"}";

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("POST /auth/login returns HTTP 401 with generic error for SUSPENDED account")
    void testLoginWithSuspendedAccount() throws Exception {
        String json = "{\"email\":\"rohan.das@institution.edu\",\"password\":\"ValidP@ssw0rd123!\"}";

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("POST /auth/login returns HTTP 400 when email or password is missing")
    void testLoginWithMissingFields() throws Exception {
        String jsonNoEmail = "{\"password\":\"ValidP@ssw0rd123!\"}";
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonNoEmail))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        String jsonNoPassword = "{\"email\":\"aarav.mehta@institution.edu\"}";
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonNoPassword))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /auth/register returns HTTP 403 Forbidden when public registration is disabled")
    void testRegisterWhenPublicRegistrationDisabled() throws Exception {
        authController.setPublicRegistrationEnabled(false);

        String json = "{\"name\":\"Kavya Nair\",\"email\":\"kavya.nair@institution.edu\",\"password\":\"Secur3P@ssword2026\",\"role\":\"STUDENT\"}";

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Public student registration is currently disabled")));
    }

    @Test
    @DisplayName("POST /auth/register returns HTTP 201 with PENDING_VERIFICATION status and no token when enabled")
    void testRegisterWhenPublicRegistrationEnabled() throws Exception {
        authController.setPublicRegistrationEnabled(true);

        String json = "{\"name\":\"Kavya Nair\",\"email\":\"kavya.nair@institution.edu\",\"password\":\"Secur3P@ssword2026\",\"role\":\"STUDENT\",\"departmentId\":"
                + department.getId() + "}";

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("kavya.nair@institution.edu")))
                .andExpect(jsonPath("$.data.name", is("Kavya Nair")))
                .andExpect(jsonPath("$.data.role", is("STUDENT")))
                .andExpect(jsonPath("$.data.status", is("PENDING_VERIFICATION")))
                .andExpect(jsonPath("$.data.accessToken").doesNotExist());

        assertTrue(userRepository.existsByEmailIgnoreCase("kavya.nair@institution.edu"));
    }

    @Test
    @DisplayName("POST /auth/register rejects privileged role registration attempts with HTTP 400")
    void testRegisterPrivilegedRoleRejected() throws Exception {
        authController.setPublicRegistrationEnabled(true);

        String json = "{\"name\":\"Malicious Dean\",\"email\":\"fake.dean@institution.edu\",\"password\":\"Secur3P@ssword2026\",\"role\":\"DEAN\"}";

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("exclusively restricted to student accounts")));
    }

    @Test
    @DisplayName("GET /auth/me returns HTTP 200 with current user profile for valid Bearer token")
    void testGetMeWithValidToken() throws Exception {
        String token = jwtTokenProvider.generateToken(activeStudent);

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("aarav.mehta@institution.edu")))
                .andExpect(jsonPath("$.data.userReference", is("STU-2026-11111")))
                .andExpect(jsonPath("$.data.role", is("STUDENT")))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));
    }

    @Test
    @DisplayName("GET /auth/me returns HTTP 401 Unauthorized when Authorization header is absent")
    void testGetMeWithoutToken() throws Exception {
        mockMvc.perform(get("/auth/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Unauthorized")));
    }

    @Test
    @DisplayName("GET /auth/me returns HTTP 401 Unauthorized for malformed Bearer token")
    void testGetMeWithMalformedToken() throws Exception {
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.string")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /auth/me returns HTTP 401 Unauthorized for expired Bearer token")
    void testGetMeWithExpiredToken() throws Exception {
        String expiredToken = jwtTokenProvider.generateTokenWithCustomExpiration(activeStudent, -5000L);

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + expiredToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /auth/me returns HTTP 401 when account status is transitioned to SUSPENDED in DB")
    void testGetMeWithSuspendedAccountToken() throws Exception {
        String token = jwtTokenProvider.generateToken(activeStudent);

        // Suspend the active user in the authoritative database
        activeStudent.setStatus("SUSPENDED");
        userRepository.saveAndFlush(activeStudent);

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Authoritative DB role: token originally generated as STUDENT reflects updated FACULTY role from DB on /auth/me")
    void testAuthoritativeDbRoleVerificationOnGetMe() throws Exception {
        // 1. Generate token while user is STUDENT
        String token = jwtTokenProvider.generateToken(activeStudent);

        // 2. Change role in database to FACULTY
        activeStudent.setRole(RoleType.FACULTY);
        userRepository.saveAndFlush(activeStudent);

        // 3. Send original token to /auth/me
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.role", is("FACULTY")));
    }

    @Test
    @DisplayName("CORS preflight: OPTIONS request from allowed frontend origin receives CORS headers and HTTP 200")
    void testCorsPreflightOptionsRequestAllowed() throws Exception {
        mockMvc.perform(options("/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Authorization,Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"))
                .andExpect(header().exists("Access-Control-Allow-Methods"));
    }

    @Test
    @DisplayName("CORS preflight: OPTIONS request from untrusted origin does not receive Access-Control-Allow-Origin")
    void testCorsDisallowedOriginRejected() throws Exception {
        mockMvc.perform(options("/auth/login")
                        .header("Origin", "http://malicious-external-site.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
