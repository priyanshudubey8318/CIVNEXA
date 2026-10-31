package com.civnexa.service;

import com.civnexa.dto.AiDTO;
import com.civnexa.dto.CaseDTO;
import com.civnexa.entity.AiKnowledgeDocument;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.CaseCategory;
import com.civnexa.entity.enums.CaseType;
import com.civnexa.entity.enums.Priority;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.repository.AiKnowledgeDocumentRepository;
import com.civnexa.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AiServiceIntegrationTests {

    @Autowired
    private AiService aiService;

    @Autowired
    private CaseService caseService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AiKnowledgeDocumentRepository aiKnowledgeDocumentRepository;

    private User testUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        testUser = userRepository.findByEmailIgnoreCase("student.ai@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("USR-AI-TEST-001");
            u.setEmail("student.ai@civnexa.edu");
            u.setPasswordHash("$2a$12$e0MYzXyjpJS7Pd0RVvHwHeV4Z67LqG9oXwZg56X5P8u9f1e1y1e1.");
            u.setName("AI Test Student");
            u.setRole(RoleType.STUDENT);
            u.setStatus(AuthService.STATUS_ACTIVE);
            return userRepository.saveAndFlush(u);
        });

        adminUser = userRepository.findByEmailIgnoreCase("admin.ai@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("USR-AI-ADM-001");
            u.setEmail("admin.ai@civnexa.edu");
            u.setPasswordHash("$2a$12$e0MYzXyjpJS7Pd0RVvHwHeV4Z67LqG9oXwZg56X5P8u9f1e1y1e1.");
            u.setName("AI Test Admin");
            u.setRole(RoleType.SUPER_ADMIN);
            u.setStatus(AuthService.STATUS_ACTIVE);
            return userRepository.saveAndFlush(u);
        });
    }

    @Test
    @DisplayName("AI Classification correctly identifies academic integrity violation")
    void testClassifyComplaint_AcademicIntegrity() {
        AiDTO.ClassificationRequest request = new AiDTO.ClassificationRequest();
        request.setTitle("Cheating during midterm exam");
        request.setDescription("Student was caught using notes and cell phone during the end semester exam in hall 402.");

        AiDTO.ClassificationResponse response = aiService.classifyComplaint(request, testUser);

        assertThat(response).isNotNull();
        assertThat(response.getSuggestedCategory()).isEqualTo("ACADEMIC_INTEGRITY");
        assertThat(response.getSuggestedDepartment()).isNotEmpty();
        assertThat(response.isHumanConfirmationRequired()).isTrue();
        assertThat(response.getConfidence()).isGreaterThan(0.5);
    }

    @Test
    @DisplayName("AI Classification correctly identifies harassment / ragging complaint")
    void testClassifyComplaint_Harassment() {
        AiDTO.ClassificationRequest request = new AiDTO.ClassificationRequest();
        request.setTitle("Ragging incident in hostel block B");
        request.setDescription("Senior students were harassing and intimidating junior students after midnight.");

        AiDTO.ClassificationResponse response = aiService.classifyComplaint(request, testUser);

        assertThat(response).isNotNull();
        assertThat(response.getSuggestedCategory()).isIn("HARASSMENT", "DISCIPLINARY", "RAGGING", "RAGGING_BULLYING");
        assertThat(response.getSuggestedPriority()).isIn("HIGH", "CRITICAL");
        assertThat(response.isHumanConfirmationRequired()).isTrue();
    }

    @Test
    @DisplayName("AI Case Summarization preserves source citations")
    void testSummarizeCase_WithCitations() {
        CaseDTO.CreateRequest createReq = new CaseDTO.CreateRequest();
        createReq.setTitle("Unauthorized lab equipment access");
        createReq.setSummary("A student bypassed laboratory safety locks on Saturday night without supervision.");
        createReq.setCaseType(CaseType.INCIDENT);
        createReq.setCategory(CaseCategory.CAMPUS_SAFETY);
        createReq.setPriority(Priority.HIGH);
        createReq.setLocation("Robotics Lab 3");

        CaseDTO.DetailResponse caseDetail = caseService.createCase(createReq, testUser);

        AiDTO.CaseSummaryResponse summaryResponse = aiService.summarizeCase(caseDetail.getId(), testUser);

        assertThat(summaryResponse).isNotNull();
        assertThat(summaryResponse.getCaseNumber()).isEqualTo(caseDetail.getCaseNumber());
        assertThat(summaryResponse.getSummary()).isNotEmpty();
        assertThat(summaryResponse.getCitations()).isNotEmpty();
        assertThat(summaryResponse.getCitations()).anyMatch(c -> c.contains("Case Incident Record") || c.contains("Incident Report Docket"));
    }

    @Test
    @DisplayName("AI Duplicate Detection flags matching complaints")
    void testDuplicateDetection_FindsSimilarCase() {
        CaseDTO.CreateRequest createReq = new CaseDTO.CreateRequest();
        createReq.setTitle("Noise complaint and disturbance in hostel block A");
        createReq.setSummary("Loud music played past 2 AM causing extreme disturbance to students studying for finals.");
        createReq.setCaseType(CaseType.GRIEVANCE);
        createReq.setCategory(CaseCategory.HOSTEL_ISSUE);
        createReq.setPriority(Priority.MEDIUM);
        caseService.createCase(createReq, testUser);

        AiDTO.DuplicateCheckRequest checkReq = new AiDTO.DuplicateCheckRequest();
        checkReq.setTitle("Hostel disturbance and loud music late night");
        checkReq.setDescription("Extremely loud music and disturbance in hostel block A late night.");

        List<AiDTO.DuplicateMatch> duplicates = aiService.detectDuplicates(checkReq);

        assertThat(duplicates).isNotEmpty();
        AiDTO.DuplicateMatch match = duplicates.get(0);
        assertThat(match.getSimilarityScore()).isGreaterThanOrEqualTo(20);
        assertThat(match.getMatchingSnippets()).isNotEmpty();
    }

    @Test
    @DisplayName("AI Institutional Assistant answers grounded query with institutional source citations")
    void testAskAssistant_GroundedDocumentRAG() {
        AiDTO.AskAssistantRequest request = new AiDTO.AskAssistantRequest();
        request.setQuestion("What is the institutional policy on anti-ragging and punitive consequences?");

        AiDTO.AskAssistantResponse response = aiService.askAssistant(request, testUser);

        assertThat(response).isNotNull();
        assertThat(response.getAnswer()).isNotEmpty();
        assertThat(response.getCitations()).isNotEmpty();
        assertThat(response.isGrounded()).isTrue();
    }

    @Test
    @DisplayName("AI Institutional Assistant provides honest fallback when query is not present in institutional docs")
    void testAskAssistant_UngroundedFallback() {
        AiDTO.AskAssistantRequest request = new AiDTO.AskAssistantRequest();
        request.setQuestion("What are the names of the alien species discovered on Mars?");

        AiDTO.AskAssistantResponse response = aiService.askAssistant(request, testUser);

        assertThat(response).isNotNull();
        assertThat(response.isGrounded()).isFalse();
        assertThat(response.getAnswer()).contains("cannot be answered based on the provided institutional documents");
    }

    @Test
    @DisplayName("AI Knowledge Document upload computes SHA-256 and indexes document")
    void testUploadKnowledgeDocument_ComputesSha256() {
        byte[] content = "Civnexa Laboratory Safety Protocol: Eye protection must be worn at all times.".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "lab_safety.txt", "text/plain", content);

        AiDTO.KnowledgeDocumentDTO docDTO = aiService.uploadKnowledgeDocument(
                file,
                "Laboratory Safety Protocol 2026",
                "SAFETY",
                adminUser
        );

        assertThat(docDTO).isNotNull();
        assertThat(docDTO.getTitle()).isEqualTo("Laboratory Safety Protocol 2026");
        assertThat(docDTO.getChecksumSha256()).hasSize(64);

        AiKnowledgeDocument saved = aiKnowledgeDocumentRepository.findById(docDTO.getId()).orElse(null);
        assertThat(saved).isNotNull();
        assertThat(saved.getContent()).contains("Eye protection must be worn");
    }
}
