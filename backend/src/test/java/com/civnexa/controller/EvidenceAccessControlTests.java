package com.civnexa.controller;

import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.EvidenceItem;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.CaseCategory;
import com.civnexa.entity.enums.CaseStatus;
import com.civnexa.entity.enums.Priority;
import com.civnexa.entity.enums.ReviewStatus;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.repository.CaseRecordRepository;
import com.civnexa.repository.EvidenceItemRepository;
import com.civnexa.repository.UserRepository;
import com.civnexa.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class EvidenceAccessControlTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CaseRecordRepository caseRepository;

    @Autowired
    private EvidenceItemRepository evidenceRepository;

    private User studentA;
    private User studentB;
    private User dean;
    private CaseRecord caseA;
    private CaseRecord caseB;

    private String tokenStudentA;
    private String tokenStudentB;
    private String tokenDean;

    @BeforeEach
    public void setup() {
        studentA = userRepository.findByEmailIgnoreCase("student.a@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("STU-A-001");
            u.setName("Student Alice");
            u.setEmail("student.a@civnexa.edu");
            u.setPasswordHash("$2a$10$dummyHashA");
            u.setRole(RoleType.STUDENT);
            u.setStatus("ACTIVE");
            return userRepository.saveAndFlush(u);
        });

        studentB = userRepository.findByEmailIgnoreCase("student.b@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("STU-B-001");
            u.setName("Student Bob");
            u.setEmail("student.b@civnexa.edu");
            u.setPasswordHash("$2a$10$dummyHashB");
            u.setRole(RoleType.STUDENT);
            u.setStatus("ACTIVE");
            return userRepository.saveAndFlush(u);
        });

        dean = userRepository.findByEmailIgnoreCase("dean.oversight@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("DEAN-OVR-001");
            u.setName("Dean Oversight");
            u.setEmail("dean.oversight@civnexa.edu");
            u.setPasswordHash("$2a$10$dummyHashDean");
            u.setRole(RoleType.DEAN);
            u.setStatus("ACTIVE");
            return userRepository.saveAndFlush(u);
        });

        tokenStudentA = "Bearer " + jwtTokenProvider.generateToken(studentA);
        tokenStudentB = "Bearer " + jwtTokenProvider.generateToken(studentB);
        tokenDean = "Bearer " + jwtTokenProvider.generateToken(dean);

        CaseRecord cA = new CaseRecord();
        cA.setCaseNumber("CX-TEST-A-" + System.currentTimeMillis());
        cA.setTitle("Alice Misconduct Allegation");
        cA.setCategory(CaseCategory.DISCIPLINE);
        cA.setPriority(Priority.MEDIUM);
        cA.setStatus(CaseStatus.UNDER_INVESTIGATION);
        cA.setStudent(studentA);
        cA.setReporter(dean);
        cA.setIncidentDate(Instant.now());
        cA.setLocation("Library Hall");
        cA.setSummary("Summary of case A");
        cA.setConfidential(false);
        caseA = caseRepository.saveAndFlush(cA);

        CaseRecord cB = new CaseRecord();
        cB.setCaseNumber("CX-TEST-B-" + System.currentTimeMillis());
        cB.setTitle("Bob Misconduct Allegation");
        cB.setCategory(CaseCategory.DISCIPLINE);
        cB.setPriority(Priority.HIGH);
        cB.setStatus(CaseStatus.UNDER_INVESTIGATION);
        cB.setStudent(studentB);
        cB.setReporter(dean);
        cB.setIncidentDate(Instant.now());
        cB.setLocation("Hostel Block 3");
        cB.setSummary("Summary of case B");
        cB.setConfidential(false);
        caseB = caseRepository.saveAndFlush(cB);

        // Attach evidence to Case A
        EvidenceItem itemA = new EvidenceItem();
        itemA.setEvidenceReference("EV-A-" + System.currentTimeMillis());
        itemA.setCaseRecord(caseA);
        itemA.setUploader(studentA);
        itemA.setFileName("statement_alice.pdf");
        itemA.setFileType("application/pdf");
        itemA.setFileSizeBytes(1024L);
        itemA.setSha256Checksum("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        itemA.setStorageReference("vault/caseA/statement.pdf");
        itemA.setReviewStatus(ReviewStatus.PENDING);
        itemA.setUploadedAt(Instant.now());
        evidenceRepository.saveAndFlush(itemA);
    }

    @Test
    public void testStudentCanAccessOwnCaseEvidence() throws Exception {
        mockMvc.perform(get("/api/v1/evidence?caseId=" + caseA.getId())
                        .header("Authorization", tokenStudentA)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    public void testStudentForbiddenFromAccessingOtherStudentCaseEvidence() throws Exception {
        // Student B attempts to query Case A's evidence -> 403 Forbidden
        mockMvc.perform(get("/api/v1/evidence?caseId=" + caseA.getId())
                        .header("Authorization", tokenStudentB)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testStudentForbiddenFromUploadingEvidenceToOtherStudentCase() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious_upload.pdf",
                "application/pdf",
                "Test content".getBytes()
        );

        // Student B attempts to upload evidence to Case A -> 403 Forbidden
        mockMvc.perform(multipart("/api/v1/evidence/upload")
                        .file(file)
                        .param("caseId", caseA.getId().toString())
                        .header("Authorization", tokenStudentB))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testDeanCanAccessAnyCaseEvidence() throws Exception {
        mockMvc.perform(get("/api/v1/evidence?caseId=" + caseA.getId())
                        .header("Authorization", tokenDean)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/v1/evidence?caseId=" + caseB.getId())
                        .header("Authorization", tokenDean)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
