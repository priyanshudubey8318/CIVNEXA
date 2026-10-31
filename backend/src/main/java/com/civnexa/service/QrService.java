package com.civnexa.service;

import com.civnexa.dto.QrDTO;
import com.civnexa.entity.*;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QrService {

    private static final Logger log = LoggerFactory.getLogger(QrService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final UserRepository userRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final CaseRecordRepository caseRepository;
    private final EvidenceItemRepository evidenceRepository;
    private final EvidenceCustodyLogRepository custodyLogRepository;
    private final AuditService auditService;

    public QrService(UserRepository userRepository,
                     AttendanceSessionRepository sessionRepository,
                     AttendanceRecordRepository recordRepository,
                     CaseRecordRepository caseRepository,
                     EvidenceItemRepository evidenceRepository,
                     EvidenceCustodyLogRepository custodyLogRepository,
                     AuditService auditService) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.caseRepository = caseRepository;
        this.evidenceRepository = evidenceRepository;
        this.custodyLogRepository = custodyLogRepository;
        this.auditService = auditService;
    }

    // =========================================================================
    // 1. STUDENT DIGITAL IDENTITY QR
    // =========================================================================

    @Transactional
    public QrDTO.StudentCardResponse getOrCreateStudentCard(User student) {
        if (student == null) {
            throw new ApiException("Authentication required", HttpStatus.UNAUTHORIZED);
        }

        // Re-read student from DB to get latest state
        User user = userRepository.findById(student.getId())
                .orElseThrow(() -> new ApiException("User record not found", HttpStatus.NOT_FOUND));

        if (user.getQrToken() == null || user.getQrToken().trim().isEmpty()) {
            user.setQrToken(generateOpaqueToken("DIGI-STU"));
            user.setQrIssuedAt(Instant.now());
            user.setQrRevoked(false);
            user = userRepository.save(user);
        }

        QrDTO.StudentCardResponse card = new QrDTO.StudentCardResponse();
        card.setQrToken(user.getQrToken());
        card.setUserReference(user.getUserReference());
        card.setFullName(user.getName());
        card.setRollNumber(user.getRollNumber());
        card.setDepartment(user.getDepartment() != null ? user.getDepartment().getName() : "General Institutional");
        card.setStatus(user.getStatus());
        card.setIssuedAt(user.getQrIssuedAt());
        card.setRevoked(user.isQrRevoked());

        return card;
    }

    @Transactional(readOnly = true)
    public QrDTO.StudentIdVerificationResponse verifyStudentQr(String qrToken) {
        if (qrToken == null || qrToken.trim().isEmpty()) {
            throw new ApiException("QR token is required", HttpStatus.BAD_REQUEST);
        }

        Optional<User> userOpt = userRepository.findByQrToken(qrToken.trim());
        QrDTO.StudentIdVerificationResponse resp = new QrDTO.StudentIdVerificationResponse();
        resp.setVerifiedAt(Instant.now());

        if (userOpt.isEmpty()) {
            resp.setValid(false);
            resp.setMessage("Unrecognized or invalid student identity QR token.");
            return resp;
        }

        User user = userOpt.get();

        if (user.isQrRevoked()) {
            resp.setValid(false);
            resp.setUserReference(user.getUserReference());
            resp.setStudentName(user.getName());
            resp.setMessage("This digital student identity card has been REVOKED by the Proctorial Office.");
            return resp;
        }

        if (!AuthService.STATUS_ACTIVE.equalsIgnoreCase(user.getStatus())) {
            resp.setValid(false);
            resp.setUserReference(user.getUserReference());
            resp.setStudentName(user.getName());
            resp.setStatus(user.getStatus());
            resp.setMessage("Student account is currently " + user.getStatus() + ". Access is denied.");
            return resp;
        }

        resp.setValid(true);
        resp.setUserReference(user.getUserReference());
        resp.setStudentName(user.getName());
        resp.setRollNumber(user.getRollNumber());
        resp.setDepartment(user.getDepartment() != null ? user.getDepartment().getName() : "Institutional Scholar");
        resp.setRole(user.getRole() != null ? user.getRole().name() : "STUDENT");
        resp.setStatus(user.getStatus());
        resp.setPhotoUrl("/api/v1/users/" + user.getId() + "/photo");
        resp.setMessage("Student identity successfully verified and authenticated.");

        return resp;
    }

    @Transactional
    public void revokeStudentQr(Long userId, User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        user.setQrRevoked(true);
        userRepository.save(user);

        if (auditService != null) {
            auditService.recordEvent("QR_REVOKE", "USER", user.getUserReference(), actor,
                    "Student digital identity QR code revoked by proctorial authority");
        }
    }

    @Transactional
    public QrDTO.StudentCardResponse reissueStudentQr(Long userId, User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        user.setQrToken(generateOpaqueToken("DIGI-STU"));
        user.setQrIssuedAt(Instant.now());
        user.setQrRevoked(false);
        user = userRepository.save(user);

        if (auditService != null) {
            auditService.recordEvent("QR_REISSUE", "USER", user.getUserReference(), actor,
                    "New student digital identity QR card issued");
        }

        return getOrCreateStudentCard(user);
    }

    // =========================================================================
    // 2. DYNAMIC ATTENDANCE QR (60-SECOND ROTATING CHALLENGE)
    // =========================================================================

    @Transactional
    public QrDTO.AttendanceSessionResponse createAttendanceSession(QrDTO.AttendanceSessionCreateRequest request, User creator) {
        if (request == null || request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new ApiException("Session title is required", HttpStatus.BAD_REQUEST);
        }

        String sessionCode = "SES-" + generateRandomString(8);
        String initialChallenge = "CHAL-" + generateRandomHex(16);
        Instant challengeExpiresAt = Instant.now().plus(Duration.ofSeconds(60));

        AttendanceSession session = new AttendanceSession(
                sessionCode,
                request.getTitle().trim(),
                request.getEventType() != null ? request.getEventType() : "EVENT",
                creator,
                initialChallenge,
                challengeExpiresAt
        );

        if (request.getCaseId() != null) {
            caseRepository.findById(request.getCaseId()).ifPresent(session::setCaseRecord);
        }

        session = sessionRepository.save(session);

        if (auditService != null) {
            auditService.recordEvent("ATTENDANCE_SESSION_CREATED", "SESSION", sessionCode, creator,
                    "Dynamic attendance session created: " + session.getTitle());
        }

        return toSessionResponse(session);
    }

    @Transactional
    public QrDTO.AttendanceSessionResponse getSessionChallenge(String sessionCode) {
        AttendanceSession session = sessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ApiException("Attendance session not found with code: " + sessionCode, HttpStatus.NOT_FOUND));

        if (!session.isActive()) {
            throw new ApiException("This attendance session has concluded and is inactive.", HttpStatus.BAD_REQUEST);
        }

        Instant now = Instant.now();
        // If current challenge has expired or within 2 seconds of expiry, rotate challenge for next 60 seconds
        if (now.isAfter(session.getChallengeExpiresAt().minus(Duration.ofSeconds(2)))) {
            session.setActiveChallenge("CHAL-" + generateRandomHex(16));
            session.setChallengeExpiresAt(now.plus(Duration.ofSeconds(60)));
            session = sessionRepository.save(session);
        }

        return toSessionResponse(session);
    }

    @Transactional
    public QrDTO.AttendanceCheckInResponse checkInAttendance(String sessionCode, String challengeToken, User student) {
        if (student == null) {
            throw new ApiException("Student authentication required for attendance check-in", HttpStatus.UNAUTHORIZED);
        }

        if (!AuthService.STATUS_ACTIVE.equalsIgnoreCase(student.getStatus())) {
            throw new ApiException("Account is not active (" + student.getStatus() + "). Attendance denied.", HttpStatus.FORBIDDEN);
        }

        AttendanceSession session = sessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ApiException("Attendance session not found", HttpStatus.NOT_FOUND));

        if (!session.isActive()) {
            throw new ApiException("Attendance session is inactive or closed", HttpStatus.BAD_REQUEST);
        }

        Instant now = Instant.now();
        // Allow a slight 5-second grace period for network transit
        if (now.isAfter(session.getChallengeExpiresAt().plus(Duration.ofSeconds(5)))) {
            throw new ApiException("The scanned QR challenge token has expired. Please rescan the live screen.", HttpStatus.BAD_REQUEST);
        }

        if (!session.getActiveChallenge().equals(challengeToken.trim())) {
            throw new ApiException("Invalid or stale QR challenge token. Please rescan the live screen.", HttpStatus.BAD_REQUEST);
        }

        // Check if student already checked in
        if (recordRepository.findBySessionIdAndStudentId(session.getId(), student.getId()).isPresent()) {
            throw new ApiException("You have already checked in to this attendance session.", HttpStatus.CONFLICT);
        }

        try {
            AttendanceRecord record = new AttendanceRecord(session, student, challengeToken, "QR_SCAN");
            recordRepository.saveAndFlush(record);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException("Duplicate check-in detected for this student in session.", HttpStatus.CONFLICT);
        }

        if (auditService != null) {
            auditService.recordEvent("ATTENDANCE_CHECKIN", "SESSION", session.getSessionCode(), student,
                    "Student checked in to attendance session: " + session.getTitle());
        }

        QrDTO.AttendanceCheckInResponse resp = new QrDTO.AttendanceCheckInResponse();
        resp.setSuccess(true);
        resp.setSessionTitle(session.getTitle());
        resp.setStudentName(student.getName());
        resp.setCheckedInAt(now);
        resp.setMessage("Attendance successfully recorded and verified!");

        return resp;
    }

    @Transactional(readOnly = true)
    public List<QrDTO.AttendanceRecordItem> getSessionRecords(String sessionCode, User caller) {
        AttendanceSession session = sessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ApiException("Attendance session not found", HttpStatus.NOT_FOUND));

        return recordRepository.findBySessionIdOrderByCheckedInAtDesc(session.getId())
                .stream()
                .map(r -> {
                    QrDTO.AttendanceRecordItem item = new QrDTO.AttendanceRecordItem();
                    item.setId(r.getId());
                    item.setStudentName(r.getStudent().getName());
                    item.setRollNumber(r.getStudent().getRollNumber());
                    item.setDepartment(r.getStudent().getDepartment() != null ? r.getStudent().getDepartment().getName() : "N/A");
                    item.setCheckedInAt(r.getCheckedInAt());
                    item.setVerificationMethod(r.getVerificationMethod());
                    return item;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void closeAttendanceSession(String sessionCode, User actor) {
        AttendanceSession session = sessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ApiException("Attendance session not found", HttpStatus.NOT_FOUND));

        session.setActive(false);
        sessionRepository.save(session);

        if (auditService != null) {
            auditService.recordEvent("ATTENDANCE_SESSION_CLOSED", "SESSION", sessionCode, actor,
                    "Attendance session closed");
        }
    }

    // =========================================================================
    // 3. CASE TRACKING QR
    // =========================================================================

    @Transactional
    public String getOrCreateCaseTrackingQr(Long caseId, User actor) {
        CaseRecord c = caseRepository.findById(caseId)
                .orElseThrow(() -> new ApiException("Case not found with id: " + caseId, HttpStatus.NOT_FOUND));

        if (c.getQrTrackingToken() == null || c.getQrTrackingToken().trim().isEmpty()) {
            c.setQrTrackingToken(generateOpaqueToken("CX-TRK"));
            c = caseRepository.save(c);
        }

        return c.getQrTrackingToken();
    }

    @Transactional(readOnly = true)
    public QrDTO.CaseQrVerifyResponse verifyCaseQr(String trackingToken, User caller) {
        Optional<CaseRecord> caseOpt = caseRepository.findByQrTrackingToken(trackingToken.trim());
        QrDTO.CaseQrVerifyResponse resp = new QrDTO.CaseQrVerifyResponse();

        if (caseOpt.isEmpty()) {
            resp.setValid(false);
            resp.setMessage("Invalid or unverified Case QR Tracking token.");
            return resp;
        }

        CaseRecord c = caseOpt.get();
        resp.setValid(true);
        resp.setCaseNumber(c.getCaseNumber());
        resp.setStatus(c.getStatus() != null ? c.getStatus().name() : "RECORDED");
        resp.setConfidential(c.isConfidential());

        boolean hasAccess = caller != null && (
                caller.getRole() == RoleType.SUPER_ADMIN ||
                caller.getRole() == RoleType.DEAN ||
                caller.getRole() == RoleType.HOD ||
                caller.getRole() == RoleType.COORDINATOR ||
                caller.getRole() == RoleType.COMMITTEE_MEMBER ||
                (c.getReporter() != null && Objects.equals(c.getReporter().getId(), caller.getId())) ||
                (c.getStudent() != null && Objects.equals(c.getStudent().getId(), caller.getId())) ||
                (c.getAssignedTo() != null && Objects.equals(c.getAssignedTo().getId(), caller.getId()))
        );

        resp.setHasFullAccess(hasAccess);

        if (hasAccess) {
            resp.setTitle(c.getTitle());
            resp.setCategory(c.getCategory() != null ? c.getCategory().name() : "GENERAL");
            resp.setPriority(c.getPriority() != null ? c.getPriority().name() : "MEDIUM");
            resp.setMessage("Case verified. Authorized user granted docket details.");
        } else {
            resp.setTitle("CONFIDENTIAL INSTITUTIONAL DOCKET");
            resp.setCategory("VERIFIED_RECORD");
            resp.setPriority("STANDARD");
            resp.setMessage("Case registered and valid in CIVNEXA Proctorial System.");
        }

        return resp;
    }

    // =========================================================================
    // 4. EVIDENCE CUSTODY QR
    // =========================================================================

    @Transactional
    public String getOrCreateEvidenceCustodyQr(Long evidenceId, User actor) {
        EvidenceItem item = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ApiException("Evidence item not found with id: " + evidenceId, HttpStatus.NOT_FOUND));

        if (item.getQrCustodyToken() == null || item.getQrCustodyToken().trim().isEmpty()) {
            item.setQrCustodyToken(generateOpaqueToken("EVD-CUST"));
            item = evidenceRepository.save(item);
        }

        return item.getQrCustodyToken();
    }

    @Transactional(readOnly = true)
    public QrDTO.EvidenceCustodyResponse verifyEvidenceCustody(String custodyToken, User caller) {
        Optional<EvidenceItem> itemOpt = evidenceRepository.findByQrCustodyToken(custodyToken.trim());
        QrDTO.EvidenceCustodyResponse resp = new QrDTO.EvidenceCustodyResponse();

        if (itemOpt.isEmpty()) {
            resp.setValid(false);
            resp.setMessage("Unrecognized Evidence Custody QR token.");
            return resp;
        }

        EvidenceItem item = itemOpt.get();
        resp.setValid(true);
        resp.setEvidenceReference(item.getEvidenceReference());
        resp.setCaseNumber(item.getCaseRecord() != null ? item.getCaseRecord().getCaseNumber() : "N/A");
        resp.setFileName(item.getFileName());
        resp.setFileType(item.getFileType());
        resp.setFileSizeBytes(item.getFileSizeBytes());
        resp.setReviewStatus(item.getReviewStatus() != null ? item.getReviewStatus().name() : "PENDING");
        resp.setSha256Checksum(item.getSha256Checksum());

        List<EvidenceCustodyLog> logs = custodyLogRepository.findByEvidenceItemIdOrderByTimestampAsc(item.getId());
        List<QrDTO.CustodyLogItem> trail = logs.stream()
                .map(l -> new QrDTO.CustodyLogItem(
                        l.getAction(),
                        l.getActor() != null ? l.getActor().getName() : "System",
                        l.getActor() != null && l.getActor().getRole() != null ? l.getActor().getRole().name() : "STAFF",
                        l.getDetails(),
                        l.getTimestamp()
                ))
                .collect(Collectors.toList());

        resp.setCustodyTrail(trail);
        resp.setMessage("Evidence chain of custody verified.");

        return resp;
    }

    @Transactional
    public QrDTO.EvidenceCustodyResponse recordEvidenceCustodyAction(String custodyToken, QrDTO.EvidenceCustodyActionRequest request, User actor) {
        EvidenceItem item = evidenceRepository.findByQrCustodyToken(custodyToken.trim())
                .orElseThrow(() -> new ApiException("Evidence item not found", HttpStatus.NOT_FOUND));

        EvidenceCustodyLog logEntry = new EvidenceCustodyLog(item, actor, request.getAction(), request.getDetails());
        custodyLogRepository.save(logEntry);

        if (auditService != null) {
            auditService.recordEvent("EVIDENCE_CUSTODY_UPDATE", "EVIDENCE", item.getEvidenceReference(), actor,
                    "Custody action recorded via QR scan: " + request.getAction());
        }

        return verifyEvidenceCustody(custodyToken, actor);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private QrDTO.AttendanceSessionResponse toSessionResponse(AttendanceSession session) {
        QrDTO.AttendanceSessionResponse resp = new QrDTO.AttendanceSessionResponse();
        resp.setSessionCode(session.getSessionCode());
        resp.setTitle(session.getTitle());
        resp.setEventType(session.getEventType());
        resp.setActiveChallenge(session.getActiveChallenge());
        resp.setChallengeExpiresAt(session.getChallengeExpiresAt());
        long remaining = Math.max(0, Duration.between(Instant.now(), session.getChallengeExpiresAt()).getSeconds());
        resp.setSecondsRemaining(remaining);
        resp.setActive(session.isActive());
        resp.setRecordsCount(recordRepository.countBySessionId(session.getId()));
        resp.setCreatedAt(session.getCreatedAt());
        return resp;
    }

    private String generateOpaqueToken(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
    }

    private String generateRandomHex(int byteLength) {
        byte[] bytes = new byte[byteLength];
        SECURE_RANDOM.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }

    private String generateRandomString(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHANUM.charAt(SECURE_RANDOM.nextInt(ALPHANUM.length())));
        }
        return sb.toString();
    }
}
