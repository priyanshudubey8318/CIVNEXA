package com.civnexa.service;

import com.civnexa.dto.AiDTO;
import com.civnexa.dto.CaseDTO;
import com.civnexa.entity.AiKnowledgeDocument;
import com.civnexa.entity.User;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.AiKnowledgeDocumentRepository;
import com.civnexa.repository.CaseRecordRepository;
import com.civnexa.service.ai.AiProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final AiProvider aiProvider;
    private final AiKnowledgeDocumentRepository knowledgeDocumentRepository;
    private final CaseService caseService;
    private final CaseRecordRepository caseRecordRepository;
    private final AuditService auditService;

    public AiService(AiProvider aiProvider,
                     AiKnowledgeDocumentRepository knowledgeDocumentRepository,
                     CaseService caseService,
                     CaseRecordRepository caseRecordRepository,
                     AuditService auditService) {
        this.aiProvider = aiProvider;
        this.knowledgeDocumentRepository = knowledgeDocumentRepository;
        this.caseService = caseService;
        this.caseRecordRepository = caseRecordRepository;
        this.auditService = auditService;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaultKnowledgeDocuments() {
        if (knowledgeDocumentRepository.count() > 0) {
            return;
        }

        log.info("Seeding initial institutional knowledge documents for AI Assistant RAG...");

        addSeedDoc(
                "DOC-POLICY-001",
                "CIVNEXA Student Code of Conduct & Academic Integrity Handbook (2026 Edition)",
                "STUDENT_HANDBOOK",
                "Section 1: Core Values and Behavioral Expectations\n" +
                "All enrolled scholars are expected to maintain the highest standards of intellectual honesty and campus decorum. Prohibited acts include plagiarism, unauthorized collaboration, misrepresentation, and examination misconduct.\n\n" +
                "Section 2: Examination and Grading Integrity\n" +
                "Possession of unauthorized electronic devices, calculators, smartwatches, or cheat sheets during invigilated examinations constitutes a Level 3 Academic Infraction, mandating an immediate hearing before the Academic Ethics Committee.\n\n" +
                "Section 3: Disciplinary Sanctions\n" +
                "Sanctions range from written reprimands and grade penalties to suspension and formal rustication depending on gravity and previous conduct record.",
                "student_handbook_2026.txt"
        );

        addSeedDoc(
                "DOC-POLICY-002",
                "Institutional Anti-Ragging and Prohibition of Coercive Hazing Regulations",
                "ANTI_RAGGING",
                "Section 1: Zero-Tolerance Policy\n" +
                "Ragging in any form—physical, psychological, verbal, or online—is strictly banned within the campus, hostels, transport vehicles, and affiliated university premises under Supreme Court directives.\n\n" +
                "Section 2: Reporting Mechanism and Anonymity\n" +
                "Victims or witnesses can lodge immediate confidential reports via the CIVNEXA Grievance Portal or the 24/7 Anti-Ragging Helpline. Anonymous reporting is explicitly protected by university bylaws.\n\n" +
                "Section 3: Mandatory Police Reporting\n" +
                "In cases of severe physical assault or extortion, the Proctorial Board is legally required to file a First Information Report (FIR) within twenty-four hours of preliminary verification.",
                "anti_ragging_policy.txt"
        );

        addSeedDoc(
                "DOC-POLICY-003",
                "Internal Complaints Committee (ICC) & Gender Equity Safeguards",
                "WOMEN_SAFETY",
                "Section 1: Statutory Scope\n" +
                "The Internal Complaints Committee handles all grievances regarding gender harassment, hostile academic environments, and personal boundary violations in accordance with national statutory provisions.\n\n" +
                "Section 2: Confidentiality and Non-Retaliation\n" +
                "All inquiries are conducted in strict in-camera hearings. Retaliatory actions against appellants, witnesses, or support counselors carry automatic suspension from institutional privileges.",
                "icc_gender_policy.txt"
        );

        addSeedDoc(
                "DOC-POLICY-004",
                "Disciplinary Grievance, Proctorial Hearings & Appellate Review Procedure",
                "DISCIPLINARY_PROCEDURES",
                "Section 1: Procedural Fairness and Summons\n" +
                "Every respondent receives minimum 48 hours notice prior to formal committee hearings. Respondents are entitled to submit a formal written explanation and inspect evidence in the vault.\n\n" +
                "Section 2: Right to Appeal\n" +
                "Students may lodge a formal appeal to the Dean of Student Affairs within 15 calendar days of sanction notification. Approved grounds include procedural irregularity, disproportionate penalty, or discovery of new material evidence.",
                "proctorial_sop.txt"
        );
    }

    private void addSeedDoc(String code, String title, String category, String content, String filename) {
        String checksum = computeSha256(content);
        AiKnowledgeDocument doc = new AiKnowledgeDocument(code, title, category, content, filename, checksum);
        knowledgeDocumentRepository.save(doc);
    }

    public AiDTO.ClassificationResponse classifyComplaint(AiDTO.ClassificationRequest request, User actor) {
        if (request == null) {
            throw new ApiException("Classification request cannot be null", HttpStatus.BAD_REQUEST);
        }
        AiDTO.ClassificationResponse resp = aiProvider.classifyComplaint(request.getTitle(), request.getDescription());
        if (auditService != null) {
            auditService.recordEvent("AI_CLASSIFICATION", "COMPLAINT", "ANALYSIS", actor,
                    "AI classification performed for category=" + resp.getSuggestedCategory());
        }
        return resp;
    }

    @Transactional(readOnly = true)
    public AiDTO.CaseSummaryResponse summarizeCase(Long caseId, User actor) {
        if (caseId == null) {
            throw new ApiException("Case ID is required", HttpStatus.BAD_REQUEST);
        }
        CaseDTO.DetailResponse caseDetail = caseService.getCaseById(caseId, actor);
        AiDTO.CaseSummaryResponse summary = aiProvider.summarizeCase(caseDetail);

        if (auditService != null) {
            auditService.recordEvent("AI_CASE_SUMMARY", "CASE", caseDetail.getCaseNumber(), actor,
                    "AI generated case synopsis");
        }
        return summary;
    }

    @Transactional(readOnly = true)
    public List<AiDTO.DuplicateMatch> detectDuplicates(AiDTO.DuplicateCheckRequest request) {
        if (request == null) {
            throw new ApiException("Request cannot be null", HttpStatus.BAD_REQUEST);
        }
        // Fetch recent cases for similarity comparison
        List<CaseDTO.DetailResponse> recentCases = caseRecordRepository.findAll(PageRequest.of(0, 50))
                .stream()
                .map(CaseDTO.DetailResponse::fromEntity)
                .collect(Collectors.toList());

        return aiProvider.findDuplicates(request.getTitle(), request.getDescription(), recentCases, request.getExcludeCaseId());
    }

    @Transactional(readOnly = true)
    public AiDTO.AskAssistantResponse askAssistant(AiDTO.AskAssistantRequest request, User actor) {
        if (request == null || request.getQuestion() == null || request.getQuestion().trim().isEmpty()) {
            throw new ApiException("Question is required", HttpStatus.BAD_REQUEST);
        }
        List<AiKnowledgeDocument> documents = knowledgeDocumentRepository.findByIsActiveTrue();
        AiDTO.AskAssistantResponse response = aiProvider.queryInstitutionalKnowledge(request.getQuestion().trim(), documents);

        if (auditService != null) {
            auditService.recordEvent("AI_ASSISTANT_QUERY", "KNOWLEDGE", "RAG", actor,
                    "User queried AI institutional assistant: grounded=" + response.isGrounded());
        }
        return response;
    }

    @Transactional(readOnly = true)
    public List<AiDTO.KnowledgeDocumentDTO> getKnowledgeDocuments() {
        return knowledgeDocumentRepository.findByIsActiveTrue()
                .stream()
                .map(AiDTO.KnowledgeDocumentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AiDTO.KnowledgeDocumentDTO uploadKnowledgeDocument(MultipartFile file, String title, String category, User uploader) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("Document file is required", HttpStatus.BAD_REQUEST);
        }
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            String checksum = computeSha256(content);
            String code = "DOC-MANUAL-" + System.currentTimeMillis();

            AiKnowledgeDocument doc = new AiKnowledgeDocument(
                    code,
                    (title != null && !title.trim().isEmpty()) ? title.trim() : file.getOriginalFilename(),
                    (category != null && !category.trim().isEmpty()) ? category.trim() : "GENERAL_POLICY",
                    content,
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.txt",
                    checksum
            );
            doc.setUploadedBy(uploader);
            AiKnowledgeDocument saved = knowledgeDocumentRepository.save(doc);

            if (auditService != null) {
                auditService.recordEvent("AI_DOC_UPLOAD", "KNOWLEDGE", code, uploader,
                        "Uploaded institutional policy document: " + doc.getTitle());
            }

            return AiDTO.KnowledgeDocumentDTO.fromEntity(saved);
        } catch (IOException e) {
            throw new ApiException("Failed to read document content: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    private String computeSha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
