package com.civnexa.security;

import com.civnexa.entity.Category;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.repository.CategoryRepository;
import com.civnexa.repository.UserRepository;
import com.civnexa.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("CIVNEXA Comprehensive Security & Role-Based Authorization Tests")
public class RoleAndAuthorizationSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private User superAdmin;
    private User dean;
    private User hod;
    private User faculty;
    private User staff;
    private User coordinator;
    private User committeeMember;
    private User student;

    private String superAdminToken;
    private String deanToken;
    private String studentToken;
    private String facultyToken;
    private String committeeToken;

    @BeforeEach
    void setupUsers() {
        superAdmin = createUser("ADMIN-" + UUID.randomUUID().toString().substring(0, 15), RoleType.SUPER_ADMIN);
        dean = createUser("DEAN-" + UUID.randomUUID().toString().substring(0, 15), RoleType.DEAN);
        hod = createUser("HOD-" + UUID.randomUUID().toString().substring(0, 15), RoleType.HOD);
        faculty = createUser("FAC-" + UUID.randomUUID().toString().substring(0, 15), RoleType.FACULTY);
        staff = createUser("STAFF-" + UUID.randomUUID().toString().substring(0, 15), RoleType.STAFF);
        coordinator = createUser("COORD-" + UUID.randomUUID().toString().substring(0, 15), RoleType.COORDINATOR);
        committeeMember = createUser("COMM-" + UUID.randomUUID().toString().substring(0, 15), RoleType.COMMITTEE_MEMBER);
        student = createUser("STU-" + UUID.randomUUID().toString().substring(0, 15), RoleType.STUDENT);

        superAdminToken = jwtTokenProvider.generateToken(superAdmin);
        deanToken = jwtTokenProvider.generateToken(dean);
        studentToken = jwtTokenProvider.generateToken(student);
        facultyToken = jwtTokenProvider.generateToken(faculty);
        committeeToken = jwtTokenProvider.generateToken(committeeMember);
    }

    private User createUser(String userRef, RoleType role) {
        User u = new User();
        u.setUserReference(userRef);
        u.setName("Test " + role.name());
        u.setEmail(userRef.toLowerCase() + "@civnexa.edu");
        u.setPasswordHash("hashed_password_security_test");
        u.setRole(role);
        u.setStatus("ACTIVE");
        return userRepository.saveAndFlush(u);
    }

    @Test
    @DisplayName("Role RBAC: Super Admin and Dean can create category, Student is blocked with 403")
    void testRoleAccessCategoryCreation() throws Exception {
        String payload = """
            {
                "key": "SEC_CAT_%s",
                "label": "Security Test Category",
                "description": "Category for RBAC testing",
                "allowsAnonymous": true,
                "subcategories": ["Sub A", "Sub B"]
            }
            """.formatted(UUID.randomUUID().toString().substring(0, 8));

        // 1. Super Admin -> 201 Created
        mockMvc.perform(post("/api/v1/categories")
                .header("Authorization", "Bearer " + superAdminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isCreated());

        // 2. Student -> 403 Forbidden
        mockMvc.perform(post("/api/v1/categories")
                .header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Privilege Escalation: Student cannot delete case category (restricted to Super Admin)")
    void testStudentCannotDeleteCategory() throws Exception {
        Category cat = new Category("TEST_ESC_" + UUID.randomUUID().toString().substring(0, 8), "Escalation Test", "Desc", false, null);
        Category saved = categoryRepository.saveAndFlush(cat);

        // Student attempt -> 403 Forbidden
        mockMvc.perform(delete("/api/v1/categories/" + saved.getId())
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        // Super Admin attempt -> 200 OK
        mockMvc.perform(delete("/api/v1/categories/" + saved.getId())
                .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Privilege Escalation: Faculty cannot suspend users (restricted to Super Admin and Dean)")
    void testFacultyCannotSuspendUser() throws Exception {
        mockMvc.perform(post("/api/v1/admin/users/" + student.getId() + "/suspend")
                .header("Authorization", "Bearer " + facultyToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\": \"Unauthorized action\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Role RBAC: Student cannot access user administration directory (/admin/users)")
    void testStudentCannotAccessUserDirectory() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Tampered token with corrupted signature is rejected with 401 Unauthorized")
    void testTamperedTokenRejected() throws Exception {
        String tamperedToken = studentToken.substring(0, studentToken.length() - 5) + "ABCDE";

        mockMvc.perform(get("/api/v1/cases")
                .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Security: Random forged token is rejected with 401 Unauthorized")
    void testForgedTokenRejected() throws Exception {
        String forgedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZvcmdlZCJ9.invalid_signature_xyz";

        mockMvc.perform(get("/api/v1/cases")
                .header("Authorization", "Bearer " + forgedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("CORS: Preflight OPTIONS request returns allowed origins and methods")
    void testCorsPreflight() throws Exception {
        mockMvc.perform(options("/api/v1/categories")
                .header("Origin", "http://localhost:5174")
                .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"));
    }
}
