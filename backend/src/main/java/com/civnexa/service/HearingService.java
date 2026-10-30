package com.civnexa.service;

import com.civnexa.dto.HearingDTO;
import com.civnexa.entity.*;
import com.civnexa.entity.enums.AttendanceStatus;
import com.civnexa.entity.enums.CaseStatus;
import com.civnexa.entity.enums.HearingStatus;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class HearingService {

    private static final Logger log = LoggerFactory.getLogger(HearingService.class);

    private final HearingRepository hearingRepository;
    private final HearingCommitteeMemberRepository memberRepository;
    private final CaseRecordRepository caseRepository;
    private final CaseActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public HearingService(HearingRepository hearingRepository,
                          HearingCommitteeMemberRepository memberRepository,
                          CaseRecordRepository caseRepository,
                          CaseActivityRepository activityRepository,
                          UserRepository userRepository,
                          AuditService auditService) {
        this.hearingRepository = hearingRepository;
        this.memberRepository = memberRepository;
        this.caseRepository = caseRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public HearingDTO.Response scheduleHearing(HearingDTO.ScheduleRequest request, User scheduler) {
        if (request == null) {
            throw new ApiException("Schedule request cannot be null", HttpStatus.BAD_REQUEST);
        }

        CaseRecord caseRecord = caseRepository.findById(request.getCaseId())
                .orElseThrow(() -> new ApiException("Case not found with ID: " + request.getCaseId(), HttpStatus.NOT_FOUND));

        User presiding = userRepository.findById(request.getPresidingAuthorityId())
                .orElseThrow(() -> new ApiException("Presiding authority user not found", HttpStatus.BAD_REQUEST));

        String hearingNumber = generateUniqueHearingNumber();

        Hearing hearing = new Hearing();
        hearing.setHearingNumber(hearingNumber);
        hearing.setCaseRecord(caseRecord);
        hearing.setScheduledBy(scheduler);
        hearing.setPresidingAuthority(presiding);
        hearing.setHearingDate(request.getHearingDate());
        hearing.setStartTime(request.getStartTime());
        hearing.setEndTime(request.getEndTime());
        hearing.setVenue(request.getVenue());
        hearing.setMode(request.getHearingMode());
        hearing.setStatus(HearingStatus.SCHEDULED);
        hearing.setRemarks(request.getRemarks());
        hearing.setCreatedAt(Instant.now());

        Hearing saved = hearingRepository.saveAndFlush(hearing);

        // Assign committee members if provided
        if (request.getCommitteeMemberIds() != null) {
            for (Long memberId : request.getCommitteeMemberIds()) {
                userRepository.findById(memberId).ifPresent(user -> {
                    HearingCommitteeMember member = new HearingCommitteeMember(
                            saved,
                            user,
                            AttendanceStatus.PENDING
                    );
                    memberRepository.save(member);
                });
            }
        }

        // Update case status to HEARING_SCHEDULED
        caseRecord.setStatus(CaseStatus.HEARING_SCHEDULED);
        caseRecord.setUpdatedAt(Instant.now());
        caseRepository.saveAndFlush(caseRecord);

        // Log case activity
        CaseActivity activity = new CaseActivity(
                caseRecord,
                "HEARING_SCHEDULED",
                scheduler,
                scheduler != null ? scheduler.getName() : "COORDINATOR",
                scheduler != null && scheduler.getRole() != null ? scheduler.getRole().name() : "ADMIN",
                "Hearing scheduled under " + hearingNumber + " on " + request.getHearingDate() + " at " + request.getVenue()
        );
        activityRepository.save(activity);

        if (auditService != null) {
            auditService.recordEvent("HEARING_SCHEDULED", "HEARING", hearingNumber, scheduler,
                    "Hearing convocation scheduled for case " + caseRecord.getCaseNumber());
        }

        log.info("Hearing {} scheduled for case {}", hearingNumber, caseRecord.getCaseNumber());
        return HearingDTO.Response.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<HearingDTO.Response> getHearings(Long caseId) {
        if (caseId != null) {
            CaseRecord record = caseRepository.findById(caseId).orElse(null);
            if (record != null) {
                return hearingRepository.findByCaseRecord(record)
                        .stream().map(HearingDTO.Response::fromEntity).collect(Collectors.toList());
            }
        }
        return hearingRepository.findAll()
                .stream().map(HearingDTO.Response::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public HearingDTO.Response getHearingById(Long id) {
        Hearing hearing = hearingRepository.findById(id)
                .orElseThrow(() -> new ApiException("Hearing not found with ID: " + id, HttpStatus.NOT_FOUND));
        return HearingDTO.Response.fromEntity(hearing);
    }

    @Transactional
    public HearingDTO.Response updateHearing(Long id, HearingDTO.UpdateRequest request, User actor) {
        Hearing hearing = hearingRepository.findById(id)
                .orElseThrow(() -> new ApiException("Hearing not found with ID: " + id, HttpStatus.NOT_FOUND));

        if (request.getStatus() != null) hearing.setStatus(request.getStatus());
        if (request.getVenue() != null && !request.getVenue().isBlank()) hearing.setVenue(request.getVenue());
        if (request.getRemarks() != null) hearing.setRemarks(request.getRemarks());
        if (request.getMinutesDraft() != null) hearing.setMinutesDraft(request.getMinutesDraft());
        if (request.getOutcome() != null) hearing.setOutcome(request.getOutcome());

        Hearing saved = hearingRepository.saveAndFlush(hearing);

        if (auditService != null) {
            auditService.recordEvent("HEARING_UPDATED", "HEARING", hearing.getHearingNumber(), actor,
                    "Hearing status/details updated to " + hearing.getStatus());
        }

        return HearingDTO.Response.fromEntity(saved);
    }

    private String generateUniqueHearingNumber() {
        int currentYear = Year.now().getValue();
        for (int i = 0; i < 10; i++) {
            int randomVal = ThreadLocalRandom.current().nextInt(1000, 10000);
            String candidate = "HR-" + currentYear + "-" + randomVal;
            if (!hearingRepository.existsByHearingNumber(candidate)) {
                return candidate;
            }
        }
        return "HR-" + currentYear + "-" + (System.currentTimeMillis() % 100000L);
    }
}
