package com.civnexa.storage;

import com.civnexa.dto.EvidenceDTO;
import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.EvidenceCustodyLog;
import com.civnexa.entity.EvidenceItem;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.CaseCategory;
import com.civnexa.entity.enums.CaseStatus;
import com.civnexa.entity.enums.Priority;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.CaseRecordRepository;
import com.civnexa.repository.EvidenceCustodyLogRepository;
import com.civnexa.repository.EvidenceItemRepository;
import com.civnexa.repository.UserRepository;
import com.civnexa.security.jwt.JwtTokenProvider;
import com.civnexa.service.EvidenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Evidence Storage & Cryptographic Verification Integration Tests")
public class EvidenceStorageIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EvidenceService evidenceService;

    @Autowired
    private EvidenceStorageService storageService;

    @Autowired
    private EvidenceItemRepository evidenceRepository;

    @Autowired
    private EvidenceCustodyLogRepository custodyLogRepository;

    @Autowired
    private CaseRecordRepository caseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User studentAlice;
    private User studentBob;
    private User deanUser;
    private CaseRecord testCase;

    private String tokenAlice;
    private String tokenBob;
    private String tokenDean;

    @BeforeEach
    void setUp() {
        studentAlice = userRepository.findByEmailIgnoreCase("alice.storage@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("STU-STG-001");
            u.setName("Alice Storage");
            u.setEmail("alice.storage@civnexa.edu");
            u.setPasswordHash("$2a$10$dummyHashAlice");
            u.setRole(RoleType.STUDENT);
            u.setStatus("ACTIVE");
            return userRepository.saveAndFlush(u);
        });

        studentBob = userRepository.findByEmailIgnoreCase("bob.storage@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("STU-STG-002");
            u.setName("Bob Storage");
            u.setEmail("bob.storage@civnexa.edu");
            u.setPasswordHash("$2a$10$dummyHashBob");
            u.setRole(RoleType.STUDENT);
            u.setStatus("ACTIVE");
            return userRepository.saveAndFlush(u);
        });

        deanUser = userRepository.findByEmailIgnoreCase("dean.storage@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("DEAN-STG-001");
            u.setName("Dean Storage");
            u.setEmail("dean.storage@civnexa.edu");
            u.setPasswordHash("$2a$10$dummyHashDean");
            u.setRole(RoleType.DEAN);
            u.setStatus("ACTIVE");
            return userRepository.saveAndFlush(u);
        });

        tokenAlice = "Bearer " + jwtTokenProvider.generateToken(studentAlice);
        tokenBob = "Bearer " + jwtTokenProvider.generateToken(studentBob);
        tokenDean = "Bearer " + jwtTokenProvider.generateToken(deanUser);

        CaseRecord c = new CaseRecord();
        c.setCaseNumber("CX-STG-" + UUID.randomUUID().toString().substring(0, 8));
        c.setTitle("Storage Verification Case");
        c.setCategory(CaseCategory.EXAM_INCIDENT);
        c.setPriority(Priority.MEDIUM);
        c.setStatus(CaseStatus.UNDER_INVESTIGATION);
        c.setStudent(studentAlice);
        c.setReporter(deanUser);
        c.setIncidentDate(Instant.now());
        c.setLocation("Exam Hall B");
        c.setSummary("Storage test investigation");
        c.setConfidential(false);
        testCase = caseRepository.saveAndFlush(c);
    }

    @Test
    @DisplayName("Verify successful upload, persistence to filesystem, and download with SHA-256 integrity")
    void testUploadPersistAndDownloadSuccess() throws Exception {
        byte[] payload = "Official Examination Submission Document Content".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "exam_paper.pdf",
                "application/pdf",
                payload
        );

        // Upload evidence
        EvidenceDTO.Response uploadResponse = evidenceService.uploadEvidence(testCase.getId(), file, studentAlice);
        assertThat(uploadResponse).isNotNull();
        assertThat(uploadResponse.getStorageReference()).isNotBlank();
        assertThat(uploadResponse.getSha256Checksum()).isNotBlank();

        // Check file exists in physical storage
        assertThat(storageService.exists(uploadResponse.getStorageReference())).isTrue();

        // Download via EvidenceService
        EvidenceDTO.DownloadResponse download = evidenceService.downloadEvidence(uploadResponse.getId(), studentAlice);
        assertThat(download).isNotNull();
        assertThat(download.getFileName()).isEqualTo("exam_paper.pdf");
        assertThat(download.getFileSizeBytes()).isEqualTo(payload.length);
        assertThat(download.getSha256Checksum()).isEqualTo(uploadResponse.getSha256Checksum());

        try (InputStream is = download.getResource().getInputStream()) {
            byte[] readBytes = is.readAllBytes();
            assertThat(readBytes).isEqualTo(payload);
        }

        // Verify Chain of Custody has both INITIAL_UPLOAD and DOWNLOAD logs
        List<EvidenceCustodyLog> logs = custodyLogRepository.findByEvidenceItemIdOrderByTimestampAsc(uploadResponse.getId());
        assertThat(logs).hasSizeGreaterThanOrEqualTo(2);
        assertThat(logs.stream().anyMatch(l -> "DOWNLOAD".equals(l.getAction()))).isTrue();
    }

    @Test
    @DisplayName("Verify HTTP GET /api/v1/evidence/{id}/download endpoint streams file with proper headers")
    void testDownloadEndpointHttp() throws Exception {
        byte[] payload = "Confidential Log Payload for HTTP Download".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "report.txt",
                "text/plain",
                payload
        );

        EvidenceDTO.Response uploadResponse = evidenceService.uploadEvidence(testCase.getId(), file, studentAlice);

        mockMvc.perform(get("/api/v1/evidence/" + uploadResponse.getId() + "/download")
                        .header("Authorization", tokenAlice))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"report.txt\""))
                .andExpect(header().string("X-Evidence-Checksum", uploadResponse.getSha256Checksum()))
                .andExpect(header().string("X-Evidence-Reference", uploadResponse.getEvidenceReference()))
                .andExpect(content().bytes(payload));
    }

    @Test
    @DisplayName("Verify unauthorized student cannot download evidence from another student's case")
    void testUnauthorizedStudentDownloadForbidden() throws Exception {
        byte[] payload = "Private Alice Data".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "alice_notes.pdf",
                "application/pdf",
                payload
        );

        EvidenceDTO.Response uploadResponse = evidenceService.uploadEvidence(testCase.getId(), file, studentAlice);

        // Student Bob attempts to download Alice's evidence -> 403 Forbidden
        mockMvc.perform(get("/api/v1/evidence/" + uploadResponse.getId() + "/download")
                        .header("Authorization", tokenBob))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Verify privileged role (Dean) can download evidence from any case")
    void testDeanCanDownloadEvidence() throws Exception {
        byte[] payload = "Dean Accessible Document".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "dean_view.pdf",
                "application/pdf",
                payload
        );

        EvidenceDTO.Response uploadResponse = evidenceService.uploadEvidence(testCase.getId(), file, studentAlice);

        mockMvc.perform(get("/api/v1/evidence/" + uploadResponse.getId() + "/download")
                        .header("Authorization", tokenDean))
                .andExpect(status().isOk())
                .andExpect(content().bytes(payload));
    }

    @Test
    @DisplayName("Verify path traversal attempts in storage reference are strictly blocked")
    void testPathTraversalRejected() {
        byte[] payload = "Malicious Payload".getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> storageService.store("../../etc/shadow", new ByteArrayInputStream(payload), payload.length, "text/plain"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Path traversal");

        assertThatThrownBy(() -> storageService.retrieve("../../../windows/system32/cmd.exe"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Path traversal");
    }

    @Test
    @DisplayName("Verify disallowed executable extensions and MIME types are rejected")
    void testDisallowedExecutableRejected() {
        byte[] script = "echo Hacked!".getBytes(StandardCharsets.UTF_8);

        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "payload.exe",
                "application/x-msdownload",
                script
        );

        assertThatThrownBy(() -> evidenceService.uploadEvidence(testCase.getId(), exeFile, studentAlice))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Disallowed");

        MockMultipartFile batFile = new MockMultipartFile(
                "file",
                "script.bat",
                "application/octet-stream",
                script
        );

        assertThatThrownBy(() -> evidenceService.uploadEvidence(testCase.getId(), batFile, studentAlice))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Disallowed");
    }

    @Test
    @DisplayName("Verify oversized files exceeding configured limit are rejected")
    void testOversizedFileRejected() {
        // Create an oversized file stream assertion
        byte[] dummy = new byte[100];
        long oversized = 30 * 1024 * 1024L; // 30 MB > 25 MB limit

        assertThatThrownBy(() -> storageService.store("vault/test/large.dat", new ByteArrayInputStream(dummy), oversized, "application/pdf"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("exceeds maximum permitted size");
    }

    @Test
    @DisplayName("Verify downloading non-existent evidence or missing file returns 404")
    void testMissingEvidenceReturns404() throws Exception {
        // Non-existent evidence ID
        mockMvc.perform(get("/api/v1/evidence/999999/download")
                        .header("Authorization", tokenDean))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Verify tamper detection: SHA-256 integrity mismatch throws error on download")
    void testSha256IntegrityMismatchDetected() throws Exception {
        byte[] original = "Tamper Proof Evidence Original Content".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "evidence_tamper.txt",
                "text/plain",
                original
        );

        EvidenceDTO.Response response = evidenceService.uploadEvidence(testCase.getId(), file, studentAlice);

        // Artificially corrupt the file in storage
        Path storedFile = ((FileSystemEvidenceStorageService) storageService).getRootLocation()
                .resolve(response.getStorageReference()).normalize();

        Files.writeString(storedFile, "Corrupted Tampered Evidence Content!");

        // Attempting to download must detect checksum mismatch
        assertThatThrownBy(() -> evidenceService.downloadEvidence(response.getId(), studentAlice))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("integrity violation");
    }
}
