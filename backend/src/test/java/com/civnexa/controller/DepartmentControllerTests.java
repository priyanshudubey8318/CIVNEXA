package com.civnexa.controller;

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

import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class DepartmentControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User superAdmin;
    private User student;
    private Department activeDept;
    private String adminToken;
    private String studentToken;

    @BeforeEach
    void setUp() {
        activeDept = new Department("TEST_CSE", "Computer Science", "Prof. Sharma", "cse@civnexa.edu", "CSE Dept");
        activeDept.setStatus("ACTIVE");
        activeDept.setCreatedAt(Instant.now());
        activeDept.setUpdatedAt(Instant.now());
        activeDept = departmentRepository.saveAndFlush(activeDept);

        superAdmin = new User();
        superAdmin.setUserReference("ADM-TEST-999");
        superAdmin.setName("Admin Tester");
        superAdmin.setEmail("admin.test@civnexa.edu");
        superAdmin.setPasswordHash(passwordEncoder.encode("SecureAdminP@ss2026"));
        superAdmin.setRole(RoleType.SUPER_ADMIN);
        superAdmin.setStatus("ACTIVE");
        superAdmin = userRepository.saveAndFlush(superAdmin);
        adminToken = jwtTokenProvider.generateToken(superAdmin);

        student = new User();
        student.setUserReference("STU-TEST-999");
        student.setName("Student Tester");
        student.setEmail("student.test@civnexa.edu");
        student.setPasswordHash(passwordEncoder.encode("SecureStudentP@ss2026"));
        student.setRole(RoleType.STUDENT);
        student.setStatus("ACTIVE");
        student = userRepository.saveAndFlush(student);
        studentToken = jwtTokenProvider.generateToken(student);
    }

    @Test
    @DisplayName("GET /departments is public and returns active departments")
    void testGetActiveDepartmentsPublic() throws Exception {
        mockMvc.perform(get("/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", not(empty())));
    }

    @Test
    @DisplayName("GET /departments/{id} returns department by ID")
    void testGetDepartmentById() throws Exception {
        mockMvc.perform(get("/departments/" + activeDept.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.code", is("TEST_CSE")))
                .andExpect(jsonPath("$.data.name", is("Computer Science")));
    }

    @Test
    @DisplayName("POST /departments allows SUPER_ADMIN to create a new department")
    void testCreateDepartmentAsAdmin() throws Exception {
        String json = "{\"code\":\"BIO\",\"name\":\"Biotechnology\",\"hodName\":\"Dr. Rao\",\"contactEmail\":\"bio@civnexa.edu\",\"description\":\"Biotech lab\"}";

        mockMvc.perform(post("/departments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.code", is("BIO")))
                .andExpect(jsonPath("$.data.name", is("Biotechnology")));
    }

    @Test
    @DisplayName("POST /departments rejects duplicate department code with 409 Conflict")
    void testCreateDepartmentDuplicateCodeReturns409() throws Exception {
        String json = "{\"code\":\"TEST_CSE\",\"name\":\"Duplicate CSE\",\"hodName\":\"Dr. X\",\"contactEmail\":\"x@civnexa.edu\"}";

        mockMvc.perform(post("/departments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /departments denies STUDENT role with 403 Forbidden")
    void testCreateDepartmentAsStudentForbidden() throws Exception {
        String json = "{\"code\":\"PHY\",\"name\":\"Physics\"}";

        mockMvc.perform(post("/departments")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /departments/{id} allows SUPER_ADMIN to update department details")
    void testUpdateDepartmentAsAdmin() throws Exception {
        String json = "{\"name\":\"Computer Science & AI\",\"hodName\":\"Prof. New HOD\"}";

        mockMvc.perform(put("/departments/" + activeDept.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Computer Science & AI")))
                .andExpect(jsonPath("$.data.hodName", is("Prof. New HOD")));
    }

    @Test
    @DisplayName("DELETE /departments/{id} allows SUPER_ADMIN to soft-deactivate department")
    void testDeleteDepartmentAsAdmin() throws Exception {
        mockMvc.perform(delete("/departments/" + activeDept.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("deactivated successfully")));

        Department deactivated = departmentRepository.findById(activeDept.getId()).orElseThrow();
        assertEquals("INACTIVE", deactivated.getStatus());
    }
}
