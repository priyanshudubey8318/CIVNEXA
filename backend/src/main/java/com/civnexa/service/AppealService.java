package com.civnexa.service;

import com.civnexa.dto.AppealDTO;
import com.civnexa.entity.AppealRecord;
import com.civnexa.entity.CaseActivity;
import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.AppealStatus;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.AppealRecordRepository;
import com.civnexa.repository.CaseActivityRepository;
import com.civnexa.repository.CaseRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class AppealService {

    private static final Logger log = LoggerFactory.getLogger(AppealService.class);

    private final AppealRecordRepository appealRepository;
    private final CaseRecordRepository caseRepository;
    private final CaseActivityRepository activityRepository;
    private final AuditService auditService;

    public AppealService(AppealRecordRepository appealRepository,
                         CaseRecordRepository caseRepository,
                         CaseActivityRepository activityRepository,
                         AuditService auditService) {
        this.appealRepository = appealRepository;
        this.caseRepository = caseRepository;
        this.activityRepository = activityRepository;
        this.auditService = auditService;
    }

    @Transactional
    public AppealDTO.Response submitAppeal(AppealDTO.SubmitRequest request, User appellant) {
        if (request == null) {
            throw new ApiException("Appeal submission cannot be null", HttpStatus.BAD_REQUEST);
        }

        CaseRecord caseRecord = caseRepository.findById(request.getCaseId())
                .orElseThrow(() -> new ApiException("Case not found with ID: " + request.getCaseId(), HttpStatus.NOT_FOUND));

        String appealNumber = generateUniqueAppealNumber();

        AppealRecord appeal = new AppealRecord();
        appeal.setAppealNumber(appealNumber);
        appeal.setCaseRecord(caseRecord);
        appeal.setAppellant(appellant);
        appeal.setStatus(AppealStatus.SUBMITTED);
        appeal.setGrounds(request.getGrounds());
        appeal.setExplanation(request.getExplanation());
        appeal.setReliefSought(request.getReliefSought());
        appeal.setOriginalDecisionSummary(caseRecord.getRemarks() != null ? caseRecord.getRemarks() : "Institutional review decision");
        appeal.setAppealDeadline(Instant.now().plus(30, ChronoUnit.DAYS));
        appeal.setSubmittedAt(Instant.now());

        AppealRecord saved = appealRepository.saveAndFlush(appeal);

        // Append Case activity
        CaseActivity activity = new CaseActivity(
                caseRecord,
                "APPEAL_SUBMITTED",
                appellant,
                appellant != null ? appellant.getName() : "APPELLANT",
                appellant != null && appellant.getRole() != null ? appellant.getRole().name() : "APPELLANT",
                "Formal appeal lodged under reference " + appealNumber + ". Grounds: " + request.getGrounds()
        );
        activityRepository.save(activity);

        if (auditService != null) {
            auditService.recordEvent("APPEAL_SUBMITTED", "APPEAL", appealNumber, appellant,
                    "Appeal submitted against case " + caseRecord.getCaseNumber());
        }

        log.info("Appeal {} submitted for case {}", appealNumber, caseRecord.getCaseNumber());
        return AppealDTO.Response.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AppealDTO.Response> getAppeals(Long caseId) {
        if (caseId != null) {
            CaseRecord record = caseRepository.findById(caseId).orElse(null);
            if (record != null) {
                return appealRepository.findByCaseRecord(record)
                        .stream().map(AppealDTO.Response::fromEntity).collect(Collectors.toList());
            }
        }
        return appealRepository.findAll()
                .stream().map(AppealDTO.Response::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AppealDTO.Response getAppealById(Long id) {
        AppealRecord record = appealRepository.findById(id)
                .orElseThrow(() -> new ApiException("Appeal not found with ID: " + id, HttpStatus.NOT_FOUND));
        return AppealDTO.Response.fromEntity(record);
    }

    @Transactional
    public AppealDTO.Response reviewAppeal(Long id, AppealDTO.ReviewRequest request, User reviewer) {
        AppealRecord record = appealRepository.findById(id)
                .orElseThrow(() -> new ApiException("Appeal not found with ID: " + id, HttpStatus.NOT_FOUND));

        record.setStatus(request.getStatus());
        record.setAssignedReviewer(reviewer);
        record.setDecidedBy(reviewer);
        record.setFinalOutcome(request.getFinalOutcome());
        record.setRecommendation(request.getRecommendation());
        record.setDecidedAt(Instant.now());

        AppealRecord saved = appealRepository.saveAndFlush(record);

        // Append Case activity
        CaseActivity activity = new CaseActivity(
                record.getCaseRecord(),
                "APPEAL_DETERMINED",
                reviewer,
                reviewer != null ? reviewer.getName() : "REVIEWER",
                reviewer != null && reviewer.getRole() != null ? reviewer.getRole().name() : "APPELLATE_AUTHORITY",
                "Appeal " + record.getAppealNumber() + " determination: " + request.getStatus() +
                        ". Outcome: " + request.getFinalOutcome()
        );
        activityRepository.save(activity);

        if (auditService != null) {
            auditService.recordEvent("APPEAL_REVIEWED", "APPEAL", record.getAppealNumber(), reviewer,
                    "Determination: " + request.getStatus());
        }

        return AppealDTO.Response.fromEntity(saved);
    }

    private String generateUniqueAppealNumber() {
        int currentYear = Year.now().getValue();
        for (int i = 0; i < 10; i++) {
            int randomVal = ThreadLocalRandom.current().nextInt(1000, 10000);
            String candidate = "AP-" + currentYear + "-" + randomVal;
            if (!appealRepository.existsByAppealNumber(candidate)) {
                return candidate;
            }
        }
        return "AP-" + currentYear + "-" + (System.currentTimeMillis() % 100000L);
    }
}
