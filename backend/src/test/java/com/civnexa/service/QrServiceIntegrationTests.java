package com.civnexa.service;

import com.civnexa.dto.CaseDTO;
import com.civnexa.dto.QrDTO;
import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.EvidenceItem;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.CaseCategory;
import com.civnexa.entity.enums.CaseType;
import com.civnexa.entity.enums.Priority;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.CaseRecordRepository;
import com.civnexa.repository.EvidenceItemRepository;
import com.civnexa.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class QrServiceIntegrationTests {

    @Autowired
    private QrService qrService;

    @Autowired
    private CaseService caseService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CaseRecordRepository caseRepository;

    @Autowired
    private EvidenceItemRepository evidenceRepository;

    private User activeStudent;
    private User inactiveStudent;
    private User facultyUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        activeStudent = userRepository.findByEmailIgnoreCase("student.qr@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("STU-QR-001");
            u.setEmail("student.qr@civnexa.edu");
            u.setPasswordHash("$2a$12$dummyHashForQrTestingOnlyXXXXXXXXXXXXX");
            u.setName("QR Active Student");
            u.setRollNumber("2026-CSE-099");
            u.setRole(RoleType.STUDENT);
            u.setStatus(AuthService.STATUS_ACTIVE);
            return userRepository.saveAndFlush(u);
        });

        inactiveStudent = userRepository.findByEmailIgnoreCase("inactive.qr@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("STU-QR-002");
            u.setEmail("inactive.qr@civnexa.edu");
            u.setPasswordHash("$2a$12$dummyHashForQrTestingOnlyXXXXXXXXXXXXX");
            u.setName("QR Inactive Student");
            u.setRollNumber("2026-CSE-100");
            u.setRole(RoleType.STUDENT);
            u.setStatus("INACTIVE");
            return userRepository.saveAndFlush(u);
        });

        facultyUser = userRepository.findByEmailIgnoreCase("faculty.qr@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("FAC-QR-001");
            u.setEmail("faculty.qr@civnexa.edu");
            u.setPasswordHash("$2a$12$dummyHashForQrTestingOnlyXXXXXXXXXXXXX");
            u.setName("QR Faculty");
            u.setRole(RoleType.FACULTY);
            u.setStatus(AuthService.STATUS_ACTIVE);
            return userRepository.saveAndFlush(u);
        });

        adminUser = userRepository.findByEmailIgnoreCase("admin.qr@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("ADM-QR-001");
            u.setEmail("admin.qr@civnexa.edu");
            u.setPasswordHash("$2a$12$dummyHashForQrTestingOnlyXXXXXXXXXXXXX");
            u.setName("QR Admin");
            u.setRole(RoleType.SUPER_ADMIN);
            u.setStatus(AuthService.STATUS_ACTIVE);
            return userRepository.saveAndFlush(u);
        });
    }

    @Test
    @DisplayName("Student Digital ID Card generation and successful verification")
    void testStudentDigitalCard_CreationAndVerification() {
        QrDTO.StudentCardResponse card = qrService.getOrCreateStudentCard(activeStudent);

        assertThat(card).isNotNull();
        assertThat(card.getQrToken()).startsWith("DIGI-STU-");
        assertThat(card.getFullName()).isEqualTo("QR Active Student");
        assertThat(card.getRollNumber()).isEqualTo("2026-CSE-099");

        QrDTO.StudentIdVerificationResponse verification = qrService.verifyStudentQr(card.getQrToken());
        assertThat(verification.isValid()).isTrue();
        assertThat(verification.getStudentName()).isEqualTo("QR Active Student");
        assertThat(verification.getStatus()).isEqualTo(AuthService.STATUS_ACTIVE);
    }

    @Test
    @DisplayName("Student Digital ID Card verification fails for inactive or suspended students")
    void testStudentDigitalCard_InactiveAccount_Rejected() {
        QrDTO.StudentCardResponse card = qrService.getOrCreateStudentCard(inactiveStudent);

        QrDTO.StudentIdVerificationResponse verification = qrService.verifyStudentQr(card.getQrToken());
        assertThat(verification.isValid()).isFalse();
        assertThat(verification.getMessage()).contains("Access is denied");
    }

    @Test
    @DisplayName("Revoking Student Digital ID Card immediately invalidates the token")
    void testStudentDigitalCard_Revocation() {
        QrDTO.StudentCardResponse card = qrService.getOrCreateStudentCard(activeStudent);
        qrService.revokeStudentQr(activeStudent.getId(), adminUser);

        QrDTO.StudentIdVerificationResponse verification = qrService.verifyStudentQr(card.getQrToken());
        assertThat(verification.isValid()).isFalse();
        assertThat(verification.getMessage()).contains("REVOKED");
    }

    @Test
    @DisplayName("Dynamic Attendance QR session creates challenge and records student check-in")
    void testDynamicAttendanceSession_CheckInSuccess() {
        QrDTO.AttendanceSessionCreateRequest req = new QrDTO.AttendanceSessionCreateRequest();
        req.setTitle("Midterm Examination Check-in");
        req.setEventType("EXAM");

        QrDTO.AttendanceSessionResponse session = qrService.createAttendanceSession(req, facultyUser);
        assertThat(session.getSessionCode()).startsWith("SES-");
        assertThat(session.getActiveChallenge()).startsWith("CHAL-");

        QrDTO.AttendanceCheckInResponse checkIn = qrService.checkInAttendance(
                session.getSessionCode(),
                session.getActiveChallenge(),
                activeStudent
        );

        assertThat(checkIn.isSuccess()).isTrue();
        assertThat(checkIn.getSessionTitle()).isEqualTo("Midterm Examination Check-in");
        assertThat(checkIn.getStudentName()).isEqualTo("QR Active Student");

        List<QrDTO.AttendanceRecordItem> records = qrService.getSessionRecords(session.getSessionCode(), facultyUser);
        assertThat(records).hasSize(1);
        assertThat(records.get(0).getStudentName()).isEqualTo("QR Active Student");
    }

    @Test
    @DisplayName("Dynamic Attendance QR rejects duplicate check-ins transactionally")
    void testDynamicAttendanceSession_RejectsDuplicateCheckIn() {
        QrDTO.AttendanceSessionCreateRequest req = new QrDTO.AttendanceSessionCreateRequest();
        req.setTitle("Campus Safety Seminar");
        req.setEventType("EVENT");

        QrDTO.AttendanceSessionResponse session = qrService.createAttendanceSession(req, facultyUser);

        // First check-in succeeds
        qrService.checkInAttendance(session.getSessionCode(), session.getActiveChallenge(), activeStudent);

        // Second check-in must be rejected with HTTP 409
        assertThatThrownBy(() -> qrService.checkInAttendance(session.getSessionCode(), session.getActiveChallenge(), activeStudent))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("already checked in");
    }

    @Test
    @DisplayName("Dynamic Attendance QR rejects invalid challenge tokens")
    void testDynamicAttendanceSession_RejectsInvalidChallenge() {
        QrDTO.AttendanceSessionCreateRequest req = new QrDTO.AttendanceSessionCreateRequest();
        req.setTitle("Proctorial Hearing Session");
        req.setEventType("HEARING");

        QrDTO.AttendanceSessionResponse session = qrService.createAttendanceSession(req, facultyUser);

        assertThatThrownBy(() -> qrService.checkInAttendance(session.getSessionCode(), "CHAL-FAKE-EXPIRED-TOKEN", activeStudent))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Invalid or stale QR challenge token");
    }

    @Test
    @DisplayName("Case Tracking QR respects confidentiality and access control")
    void testCaseTrackingQr_AccessControl() {
        CaseDTO.CreateRequest createReq = new CaseDTO.CreateRequest();
        createReq.setTitle("Confidential Proctorial Investigation");
        createReq.setSummary("Sensitive dormitory incident under formal inquiry.");
        createReq.setCaseType(CaseType.INCIDENT);
        createReq.setCategory(CaseCategory.DISCIPLINE);
        createReq.setPriority(Priority.CRITICAL);
        createReq.setConfidential(true);

        CaseDTO.DetailResponse caseDetail = caseService.createCase(createReq, facultyUser);
        String token = qrService.getOrCreateCaseTrackingQr(caseDetail.getId(), facultyUser);

        // Authorized investigator view
        QrDTO.CaseQrVerifyResponse authResp = qrService.verifyCaseQr(token, facultyUser);
        assertThat(authResp.isValid()).isTrue();
        assertThat(authResp.isHasFullAccess()).isTrue();
        assertThat(authResp.getTitle()).isEqualTo("Confidential Proctorial Investigation");

        // Unauthorized student view
        QrDTO.CaseQrVerifyResponse unauthResp = qrService.verifyCaseQr(token, activeStudent);
        assertThat(unauthResp.isValid()).isTrue();
        assertThat(unauthResp.isHasFullAccess()).isFalse();
        assertThat(unauthResp.getTitle()).contains("CONFIDENTIAL");
    }

    @Test
    @DisplayName("Evidence Custody QR maintains unbroken chain-of-custody audit trail")
    void testEvidenceCustodyQr_ActionTrail() {
        CaseRecord caseRec = new CaseRecord("CX-2026-99123", CaseType.INCIDENT, "Laboratory Inspection", CaseCategory.CAMPUS_SAFETY, Priority.MEDIUM, "Lab incident summary");
        caseRec = caseRepository.saveAndFlush(caseRec);

        EvidenceItem evidence = new EvidenceItem(
                "EVD-2026-88001",
                caseRec,
                facultyUser,
                "hallway_cctv.mp4",
                "video/mp4",
                1048576L,
                "vault/hallway_cctv.mp4",
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
        evidence = evidenceRepository.saveAndFlush(evidence);

        String custodyToken = qrService.getOrCreateEvidenceCustodyQr(evidence.getId(), facultyUser);
        assertThat(custodyToken).startsWith("EVD-CUST-");

        // Log custody transfer action
        QrDTO.EvidenceCustodyActionRequest actionReq = new QrDTO.EvidenceCustodyActionRequest();
        actionReq.setAction("SEALED_AND_TRANSFERRED_TO_FORENSICS");
        actionReq.setDetails("Evidence sealed in tamper-evident bag #401 by Campus Proctor");

        QrDTO.EvidenceCustodyResponse custodyResp = qrService.recordEvidenceCustodyAction(custodyToken, actionReq, facultyUser);

        assertThat(custodyResp.isValid()).isTrue();
        assertThat(custodyResp.getCustodyTrail()).isNotEmpty();
        assertThat(custodyResp.getCustodyTrail()).anyMatch(c -> c.getAction().equals("SEALED_AND_TRANSFERRED_TO_FORENSICS"));
    }
}
