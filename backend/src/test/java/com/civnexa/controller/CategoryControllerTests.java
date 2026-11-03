package com.civnexa.controller;

import com.civnexa.dto.CategoryDTO;
import com.civnexa.entity.Category;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.repository.CategoryRepository;
import com.civnexa.security.jwt.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CategoryControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private com.civnexa.repository.UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String superAdminToken;
    private String deanToken;
    private String studentToken;

    @BeforeEach
    public void setup() {
        User admin = userRepository.findByEmailIgnoreCase("catadmin@institution.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("ADM-CAT-001");
            u.setName("Super Admin");
            u.setEmail("catadmin@institution.edu");
            u.setPasswordHash("$2a$10$dummyHashAdmin");
            u.setRole(RoleType.SUPER_ADMIN);
            u.setStatus("ACTIVE");
            return userRepository.saveAndFlush(u);
        });
        superAdminToken = "Bearer " + jwtTokenProvider.generateToken(admin);

        User dean = userRepository.findByEmailIgnoreCase("catdean@institution.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("DEAN-CAT-001");
            u.setName("Dean Officer");
            u.setEmail("catdean@institution.edu");
            u.setPasswordHash("$2a$10$dummyHashDean");
            u.setRole(RoleType.DEAN);
            u.setStatus("ACTIVE");
            return userRepository.saveAndFlush(u);
        });
        deanToken = "Bearer " + jwtTokenProvider.generateToken(dean);

        User student = userRepository.findByEmailIgnoreCase("catstudent@institution.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("STU-CAT-001");
            u.setName("Student Complainant");
            u.setEmail("catstudent@institution.edu");
            u.setPasswordHash("$2a$10$dummyHashStudent");
            u.setRole(RoleType.STUDENT);
            u.setStatus("ACTIVE");
            return userRepository.saveAndFlush(u);
        });
        studentToken = "Bearer " + jwtTokenProvider.generateToken(student);
    }

    @Test
    public void testPublicGetCategories() throws Exception {
        mockMvc.perform(get("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    public void testGetCategoryById() throws Exception {
        List<Category> all = categoryRepository.findAll();
        Category first = all.get(0);

        mockMvc.perform(get("/api/v1/categories/" + first.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.categoryKey").value(first.getCategoryKey()));
    }

    @Test
    public void testSuperAdminCreateCategory() throws Exception {
        CategoryDTO.CreateRequest req = new CategoryDTO.CreateRequest();
        String uniqueKey = "LAB_SAFETY_" + System.currentTimeMillis();
        req.setCategoryKey(uniqueKey);
        req.setLabel("Laboratory Chemical Safety");
        req.setDescription("Chemical spills and protective equipment protocols.");
        req.setAllowsAnonymous(true);
        req.setSubcategories(List.of("Chemical Spill", "Fume Hood Failure"));

        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.categoryKey").value(uniqueKey))
                .andExpect(jsonPath("$.data.allowsAnonymous").value(true));
    }

    @Test
    public void testDeanCreateCategory() throws Exception {
        CategoryDTO.CreateRequest req = new CategoryDTO.CreateRequest();
        String uniqueKey = "HOSTEL_CURFEW_" + System.currentTimeMillis();
        req.setCategoryKey(uniqueKey);
        req.setLabel("Hostel Timings & Curfew");
        req.setDescription("Entry and exit curfew compliance.");
        req.setAllowsAnonymous(false);

        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", deanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.categoryKey").value(uniqueKey));
    }

    @Test
    public void testStudentCannotCreateCategory() throws Exception {
        CategoryDTO.CreateRequest req = new CategoryDTO.CreateRequest();
        req.setCategoryKey("STUDENT_UNAUTHORIZED");
        req.setLabel("Student Unauthorized Category");

        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testUpdateCategory() throws Exception {
        List<Category> all = categoryRepository.findAll();
        Category first = all.get(0);

        CategoryDTO.UpdateRequest updateReq = new CategoryDTO.UpdateRequest();
        updateReq.setLabel(first.getLabel() + " Updated");
        updateReq.setDescription("Updated institutional description");

        mockMvc.perform(put("/api/v1/categories/" + first.getId())
                        .header("Authorization", superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.label").value(first.getLabel() + " Updated"));
    }

    @Test
    public void testDeleteCategoryAccessControl() throws Exception {
        Category cat = new Category("TEMP_DEL_" + System.currentTimeMillis(), "Temporary", "Desc", false, "Sub");
        cat = categoryRepository.saveAndFlush(cat);

        // Student attempt -> 403 Forbidden
        mockMvc.perform(delete("/api/v1/categories/" + cat.getId())
                        .header("Authorization", studentToken))
                .andExpect(status().isForbidden());

        // Super Admin attempt -> 200 OK
        mockMvc.perform(delete("/api/v1/categories/" + cat.getId())
                        .header("Authorization", superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
