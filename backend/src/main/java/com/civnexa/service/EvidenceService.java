package com.civnexa.service;

import com.civnexa.dto.EvidenceDTO;
import com.civnexa.entity.*;
import com.civnexa.entity.enums.ReviewStatus;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.CaseActivityRepository;
import com.civnexa.repository.CaseRecordRepository;
import com.civnexa.repository.EvidenceCustodyLogRepository;
import com.civnexa.repository.EvidenceItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class EvidenceService {

    private static final Logger log = LoggerFactory.getLogger(EvidenceService.class);

    private final EvidenceItemRepository evidenceRepository;
    private final EvidenceCustodyLogRepository custodyLogRepository;
    private final CaseRecordRepository caseRepository;
    private final CaseActivityRepository activityRepository;
    private final AuditService auditService;

    public EvidenceService(EvidenceItemRepository evidenceRepository,
                           EvidenceCustodyLogRepository custodyLogRepository,
                           CaseRecordRepository caseRepository,
                           CaseActivityRepository activityRepository,
                           AuditService auditService) {
        this.evidenceRepository = evidenceRepository;
        this.custodyLogRepository = custodyLogRepository;
        this.caseRepository = caseRepository;
        this.activityRepository = activityRepository;
        this.auditService = auditService;
    }

    @Transactional
    public EvidenceDTO.Response uploadEvidence(Long caseId, MultipartFile file, User uploader) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("Evidence file cannot be empty", HttpStatus.BAD_REQUEST);
        }

        CaseRecord caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ApiException("Case not found with ID: " + caseId, HttpStatus.NOT_FOUND));

        String checksum;
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
            checksum = calculateSha256(fileBytes);
        } catch (Exception e) {
            throw new ApiException("Failed to process evidence file checksum: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }

        String evidenceRef = generateUniqueEvidenceReference();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "evidence_file";
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        String storageRef = "vault/" + caseRecord.getCaseNumber() + "/" + checksum.substring(0, 12) + "_" + originalFilename;

        EvidenceItem item = new EvidenceItem();
        item.setEvidenceReference(evidenceRef);
        item.setCaseRecord(caseRecord);
        item.setUploader(uploader);
        item.setFileName(originalFilename);
        item.setFileType(contentType);
        item.setFileSizeBytes((long) fileBytes.length);
        item.setSha256Checksum(checksum);
        item.setStorageReference(storageRef);
        item.setReviewStatus(ReviewStatus.PENDING);
        item.setUploadedAt(Instant.now());

        EvidenceItem saved = evidenceRepository.saveAndFlush(item);

        // Chain of custody log entry
        EvidenceCustodyLog custodyLog = new EvidenceCustodyLog(
                saved,
                uploader,
                "INITIAL_UPLOAD",
                "Uploaded with cryptographic SHA-256 verification: " + checksum
        );
        custodyLogRepository.save(custodyLog);

        // Append Case activity
        CaseActivity activity = new CaseActivity(
                caseRecord,
                "EVIDENCE_SUBMITTED",
                uploader,
                uploader != null ? uploader.getName() : "ANONYMOUS",
                uploader != null && uploader.getRole() != null ? uploader.getRole().name() : "UPLOADER",
                "Evidence vaulted under reference " + evidenceRef + " (" + originalFilename + ")"
        );
        activityRepository.save(activity);

        if (auditService != null) {
            auditService.recordEvent("EVIDENCE_UPLOADED", "EVIDENCE", evidenceRef, uploader,
                    "Cryptographic evidence item secured for case " + caseRecord.getCaseNumber());
        }

        log.info("Secured evidence {} for case {}", evidenceRef, caseRecord.getCaseNumber());
        return EvidenceDTO.Response.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<EvidenceDTO.Response> getEvidenceByCase(Long caseId) {
        return evidenceRepository.findByCaseRecordId(caseId)
                .stream()
                .map(EvidenceDTO.Response::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public EvidenceDTO.Response reviewEvidence(Long evidenceId, EvidenceDTO.ReviewRequest request, User reviewer) {
        EvidenceItem item = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ApiException("Evidence item not found with ID: " + evidenceId, HttpStatus.NOT_FOUND));

        item.setReviewStatus(request.getReviewStatus());
        EvidenceItem saved = evidenceRepository.saveAndFlush(item);

        // Chain of custody log
        EvidenceCustodyLog logEntry = new EvidenceCustodyLog(
                saved,
                reviewer,
                "REVIEW_COMPLETED",
                "Review status set to " + request.getReviewStatus() +
                        (request.getVerificationNotes() != null ? ". Notes: " + request.getVerificationNotes() : "")
        );
        custodyLogRepository.save(logEntry);

        if (auditService != null) {
            auditService.recordEvent("EVIDENCE_REVIEWED", "EVIDENCE", item.getEvidenceReference(), reviewer,
                    "Status updated to " + request.getReviewStatus());
        }

        return EvidenceDTO.Response.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<EvidenceDTO.CustodyLogItem> getCustodyLogs(Long evidenceId) {
        return custodyLogRepository.findByEvidenceItemIdOrderByTimestampAsc(evidenceId)
                .stream()
                .map(EvidenceDTO.CustodyLogItem::fromEntity)
                .collect(Collectors.toList());
    }

    private String generateUniqueEvidenceReference() {
        int currentYear = Year.now().getValue();
        for (int i = 0; i < 10; i++) {
            int randomVal = ThreadLocalRandom.current().nextInt(1000, 10000);
            String candidate = "EV-" + currentYear + "-" + randomVal;
            if (!evidenceRepository.existsByEvidenceReference(candidate)) {
                return candidate;
            }
        }
        return "EV-" + currentYear + "-" + (System.currentTimeMillis() % 100000L);
    }

    private String calculateSha256(byte[] data) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(data);
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }
}
