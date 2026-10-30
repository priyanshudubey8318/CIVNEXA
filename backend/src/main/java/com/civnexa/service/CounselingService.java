package com.civnexa.service;

import com.civnexa.dto.CounselingDTO;
import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.CounselingReferral;
import com.civnexa.entity.CounselingSession;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.Priority;
import com.civnexa.entity.enums.ReferralStatus;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.CaseRecordRepository;
import com.civnexa.repository.CounselingReferralRepository;
import com.civnexa.repository.CounselingSessionRepository;
import com.civnexa.repository.UserRepository;
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
public class CounselingService {

    private static final Logger log = LoggerFactory.getLogger(CounselingService.class);

    private final CounselingReferralRepository referralRepository;
    private final CounselingSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final CaseRecordRepository caseRepository;
    private final AuditService auditService;

    public CounselingService(CounselingReferralRepository referralRepository,
                             CounselingSessionRepository sessionRepository,
                             UserRepository userRepository,
                             CaseRecordRepository caseRepository,
                             AuditService auditService) {
        this.referralRepository = referralRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.caseRepository = caseRepository;
        this.auditService = auditService;
    }

    @Transactional
    public CounselingDTO.ReferralResponse createReferral(CounselingDTO.CreateReferralRequest request, User referrer) {
        if (request == null) {
            throw new ApiException("Referral request cannot be null", HttpStatus.BAD_REQUEST);
        }

        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ApiException("Student not found with ID: " + request.getStudentId(), HttpStatus.BAD_REQUEST));

        CaseRecord caseRecord = null;
        if (request.getCaseId() != null) {
            caseRecord = caseRepository.findById(request.getCaseId()).orElse(null);
        }

        User counselor = null;
        if (request.getCounselorId() != null) {
            counselor = userRepository.findById(request.getCounselorId()).orElse(null);
        }

        String referralNumber = generateUniqueReferralNumber();

        CounselingReferral referral = new CounselingReferral();
        referral.setReferralNumber(referralNumber);
        referral.setStudent(student);
        referral.setReferredBy(referrer);
        referral.setCounselor(counselor);
        referral.setCaseRecord(caseRecord);
        referral.setReason(request.getReason());
        referral.setPriority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM);
        referral.setStatus(ReferralStatus.SCHEDULED);
        referral.setCreatedAt(Instant.now());

        CounselingReferral saved = referralRepository.saveAndFlush(referral);

        if (auditService != null) {
            auditService.recordEvent("COUNSELING_REFERRAL_CREATED", "COUNSELING", referralNumber, referrer,
                    "Student counseling referral created for " + student.getName());
        }

        log.info("Counseling referral {} created for student {}", referralNumber, student.getUserReference());
        return assembleReferral(saved, referrer);
    }

    @Transactional(readOnly = true)
    public List<CounselingDTO.ReferralResponse> getReferrals(User caller) {
        List<CounselingReferral> referrals;
        if (caller != null && caller.getRole() == RoleType.STUDENT) {
            referrals = referralRepository.findByStudent(caller);
        } else if (caller != null && caller.getRole() == RoleType.COORDINATOR) {
            referrals = referralRepository.findAll();
        } else if (caller != null) {
            // Counselor or other staff
            List<CounselingReferral> assigned = referralRepository.findByCounselor(caller);
            if (!assigned.isEmpty()) {
                referrals = assigned;
            } else {
                referrals = referralRepository.findAll();
            }
        } else {
            referrals = referralRepository.findAll();
        }

        return referrals.stream()
                .map(r -> assembleReferral(r, caller))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CounselingDTO.ReferralResponse getReferralById(Long id, User caller) {
        CounselingReferral referral = referralRepository.findById(id)
                .orElseThrow(() -> new ApiException("Counseling referral not found with ID: " + id, HttpStatus.NOT_FOUND));
        return assembleReferral(referral, caller);
    }

    @Transactional
    public CounselingDTO.ReferralResponse assignCounselor(Long id, CounselingDTO.AssignCounselorRequest request, User actor) {
        CounselingReferral referral = referralRepository.findById(id)
                .orElseThrow(() -> new ApiException("Counseling referral not found with ID: " + id, HttpStatus.NOT_FOUND));

        User counselor = userRepository.findById(request.getCounselorId())
                .orElseThrow(() -> new ApiException("Counselor user not found", HttpStatus.BAD_REQUEST));

        referral.setCounselor(counselor);
        if (referral.getStatus() == ReferralStatus.SCHEDULED) {
            referral.setStatus(ReferralStatus.IN_PROGRESS);
        }
        CounselingReferral saved = referralRepository.saveAndFlush(referral);

        if (auditService != null) {
            auditService.recordEvent("COUNSELOR_ASSIGNED", "COUNSELING", referral.getReferralNumber(), actor,
                    "Assigned counselor " + counselor.getName());
        }

        return assembleReferral(saved, actor);
    }

    @Transactional
    public CounselingDTO.ReferralResponse updateStatus(Long id, CounselingDTO.ReferralStatusRequest request, User actor) {
        CounselingReferral referral = referralRepository.findById(id)
                .orElseThrow(() -> new ApiException("Counseling referral not found with ID: " + id, HttpStatus.NOT_FOUND));

        referral.setStatus(request.getStatus());
        CounselingReferral saved = referralRepository.saveAndFlush(referral);

        if (auditService != null) {
            auditService.recordEvent("COUNSELING_STATUS_UPDATED", "COUNSELING", referral.getReferralNumber(), actor,
                    "Status updated to " + request.getStatus());
        }

        return assembleReferral(saved, actor);
    }

    @Transactional
    public CounselingDTO.SessionResponse createSession(Long referralId, CounselingDTO.CreateSessionRequest request, User actor) {
        CounselingReferral referral = referralRepository.findById(referralId)
                .orElseThrow(() -> new ApiException("Counseling referral not found with ID: " + referralId, HttpStatus.NOT_FOUND));

        // Enforce counselor or coordinator authorization
        boolean isAuthorized = actor != null && (
                actor.getRole() == RoleType.COORDINATOR ||
                actor.getRole() == RoleType.SUPER_ADMIN ||
                (referral.getCounselor() != null && actor.getId().equals(referral.getCounselor().getId()))
        );

        if (!isAuthorized) {
            throw new ApiException("Access denied: Clinical counseling session notes can only be recorded by the assigned counselor or coordinator.",
                    HttpStatus.FORBIDDEN);
        }

        CounselingSession session = new CounselingSession(
                referral,
                request.getSessionNumber(),
                request.getSessionDate(),
                request.getAttendanceStatus(),
                request.getClinicalSummary()
        );

        CounselingSession saved = sessionRepository.saveAndFlush(session);

        // Transition referral to IN_PROGRESS if not completed
        if (referral.getStatus() == ReferralStatus.SCHEDULED) {
            referral.setStatus(ReferralStatus.IN_PROGRESS);
            referralRepository.saveAndFlush(referral);
        }

        return CounselingDTO.SessionResponse.fromEntity(saved, true);
    }

    private CounselingDTO.ReferralResponse assembleReferral(CounselingReferral referral, User caller) {
        CounselingDTO.ReferralResponse dto = CounselingDTO.ReferralResponse.fromEntity(referral);

        boolean canViewClinical = caller != null && (
                caller.getRole() == RoleType.COORDINATOR ||
                caller.getRole() == RoleType.SUPER_ADMIN ||
                (referral.getCounselor() != null && caller.getId().equals(referral.getCounselor().getId()))
        );

        List<CounselingSession> sessions = sessionRepository.findByReferralOrderBySessionNumberAsc(referral);
        dto.setSessions(sessions.stream()
                .map(s -> CounselingDTO.SessionResponse.fromEntity(s, canViewClinical))
                .collect(Collectors.toList()));

        return dto;
    }

    private String generateUniqueReferralNumber() {
        int currentYear = Year.now().getValue();
        for (int i = 0; i < 10; i++) {
            int randomVal = ThreadLocalRandom.current().nextInt(1000, 10000);
            String candidate = "CR-" + currentYear + "-" + randomVal;
            if (!referralRepository.existsByReferralNumber(candidate)) {
                return candidate;
            }
        }
        return "CR-" + currentYear + "-" + (System.currentTimeMillis() % 100000L);
    }
}
