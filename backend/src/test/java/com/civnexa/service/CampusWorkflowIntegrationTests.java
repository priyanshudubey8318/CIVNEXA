package com.civnexa.service;

import com.civnexa.dto.*;
import com.civnexa.entity.*;
import com.civnexa.entity.enums.*;
import com.civnexa.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CampusWorkflowIntegrationTests {

    @Autowired
    private CaseService caseService;

    @Autowired
    private EvidenceService evidenceService;

    @Autowired
    private HearingService hearingService;

    @Autowired
    private AppealService appealService;

    @Autowired
    private CounselingService counselingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    private User studentUser;
    private User facultyUser;
    private User adminUser;
    private Department cseDept;

    @BeforeEach
    void setUp() {
        cseDept = departmentRepository.findByCode("CSE").orElseGet(() -> {
            Department d = new Department();
            d.setCode("CSE");
            d.setName("Computer Science & Engineering");
            d.setStatus("ACTIVE");
            return departmentRepository.saveAndFlush(d);
        });

        studentUser = userRepository.findByEmailIgnoreCase("workflow.student@institution.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("STU-2026-99001");
            u.setName("Workflow Student");
            u.setEmail("workflow.student@institution.edu");
            u.setPasswordHash("$2a$10$dummyHashForWorkflowTestingOnlyXXXXXXXXXXXXX");
            u.setRole(RoleType.STUDENT);
            u.setStatus(AuthService.STATUS_ACTIVE);
            u.setDepartment(cseDept);
            u.setRollNumber("ROLL-WF-001");
            return userRepository.saveAndFlush(u);
        });

        facultyUser = userRepository.findByEmailIgnoreCase("workflow.faculty@institution.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("FAC-2026-99002");
            u.setName("Workflow Faculty");
            u.setEmail("workflow.faculty@institution.edu");
            u.setPasswordHash("$2a$10$dummyHashForWorkflowTestingOnlyXXXXXXXXXXXXX");
            u.setRole(RoleType.FACULTY);
            u.setStatus(AuthService.STATUS_ACTIVE);
            u.setDepartment(cseDept);
            return userRepository.saveAndFlush(u);
        });

        adminUser = userRepository.findByEmailIgnoreCase("workflow.admin@institution.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("ADM-2026-99003");
            u.setName("Workflow Admin");
            u.setEmail("workflow.admin@institution.edu");
            u.setPasswordHash("$2a$10$dummyHashForWorkflowTestingOnlyXXXXXXXXXXXXX");
            u.setRole(RoleType.SUPER_ADMIN);
            u.setStatus(AuthService.STATUS_ACTIVE);
            return userRepository.saveAndFlush(u);
        });
    }

    @Test
    @DisplayName("Complete Case lifecycle: intake, assignment, notes, student response and status transitions")
    void testCompleteCaseLifecycle() {
        CaseDTO.CreateRequest req = new CaseDTO.CreateRequest();
        req.setTitle("Unauthorized Electronic Device in Examination");
        req.setCaseType(CaseType.INCIDENT);
        req.setCategory(CaseCategory.EXAM_INCIDENT);
        req.setPriority(Priority.HIGH);
        req.setLocation("Exam Hall 3B");
        req.setSummary("Student found in possession of unauthorized device during mid-semester examination.");
        req.setDepartmentId(cseDept.getId());
        req.setStudentRollOrEmail(studentUser.getEmail());

        CaseDTO.DetailResponse caseDetail = caseService.createCase(req, facultyUser);
        assertThat(caseDetail.getCaseNumber()).startsWith("CX-");
        assertThat(caseDetail.getStatus()).isEqualTo(CaseStatus.PENDING_VERIFICATION);
        assertThat(caseDetail.getActivities()).isNotEmpty();

        // Assign case to faculty investigator
        CaseDTO.AssignmentRequest assignReq = new CaseDTO.AssignmentRequest();
        assignReq.setAssignedToUserId(facultyUser.getId());
        CaseDTO.DetailResponse assigned = caseService.assignCase(caseDetail.getId(), assignReq, adminUser);
        assertThat(assigned.getAssignedTo().getName()).isEqualTo("Workflow Faculty");
        assertThat(assigned.getStatus()).isEqualTo(CaseStatus.ASSIGNED);

        // Add investigation note
        CaseDTO.NoteRequest noteReq = new CaseDTO.NoteRequest();
        noteReq.setContent("Proctor seized device; serial number documented in custody report.");
        noteReq.setConfidential(false);
        CaseDTO.DetailResponse withNote = caseService.addInvestigationNote(caseDetail.getId(), noteReq, facultyUser);
        assertThat(withNote.getInvestigationNotes()).hasSize(1);
        assertThat(withNote.getInvestigationNotes().get(0).getNoteContent()).contains("Proctor seized device");

        // Student submits representation response
        CaseDTO.ResponseRequest respReq = new CaseDTO.ResponseRequest();
        respReq.setResponse("I mistakenly had the device in my jacket pocket and did not access it during the test.");
        CaseDTO.DetailResponse withResp = caseService.submitStudentResponse(caseDetail.getId(), respReq, studentUser);
        assertThat(withResp.getResponses()).hasSize(1);
        assertThat(withResp.getResponses().get(0).getResponseText()).contains("mistakenly had the device");

        // Update status to UNDER_INVESTIGATION
        CaseDTO.StatusUpdateRequest statusReq = new CaseDTO.StatusUpdateRequest();
        statusReq.setStatus(CaseStatus.UNDER_INVESTIGATION);
        statusReq.setRemarks("Reviewing proctor statement and invigilation logs");
        CaseDTO.DetailResponse updated = caseService.updateStatus(caseDetail.getId(), statusReq, facultyUser);
        assertThat(updated.getStatus()).isEqualTo(CaseStatus.UNDER_INVESTIGATION);
    }

    @Test
    @DisplayName("Evidence Vault: upload, SHA-256 calculation, custody logs and review")
    void testEvidenceVaultWorkflow() {
        CaseDTO.CreateRequest req = new CaseDTO.CreateRequest();
        req.setTitle("Campus Property Damage");
        req.setCaseType(CaseType.INCIDENT);
        req.setCategory(CaseCategory.CAMPUS_SAFETY);
        req.setSummary("Damage reported to laboratory door.");
        CaseDTO.DetailResponse caseDetail = caseService.createCase(req, facultyUser);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "lab_door_damage.jpg",
                "image/jpeg",
                "FAKE_JPEG_IMAGE_CONTENT_BYTES_2026".getBytes(StandardCharsets.UTF_8)
        );

        EvidenceDTO.Response ev = evidenceService.uploadEvidence(caseDetail.getId(), file, facultyUser);
        assertThat(ev.getEvidenceReference()).startsWith("EV-");
        assertThat(ev.getSha256Checksum()).isNotBlank();
        assertThat(ev.getReviewStatus()).isEqualTo(ReviewStatus.PENDING);

        // Verify chain-of-custody log was generated
        List<EvidenceDTO.CustodyLogItem> logs = evidenceService.getCustodyLogs(ev.getId());
        assertThat(logs).isNotEmpty();
        assertThat(logs.get(0).getAction()).isEqualTo("INITIAL_UPLOAD");

        // Review evidence
        EvidenceDTO.ReviewRequest revReq = new EvidenceDTO.ReviewRequest();
        revReq.setReviewStatus(ReviewStatus.REVIEWED);
        revReq.setVerificationNotes("High-resolution photograph verified against lab CCTV timestamp.");
        EvidenceDTO.Response reviewed = evidenceService.reviewEvidence(ev.getId(), revReq, adminUser);
        assertThat(reviewed.getReviewStatus()).isEqualTo(ReviewStatus.REVIEWED);
    }

    @Test
    @DisplayName("Hearing Convocation: scheduling and minutes recording")
    void testHearingWorkflow() {
        CaseDTO.CreateRequest caseReq = new CaseDTO.CreateRequest();
        caseReq.setTitle("Student Disciplinary Inquiry");
        caseReq.setCategory(CaseCategory.DISCIPLINE);
        caseReq.setSummary("Disciplinary committee convened for code of conduct inquiry.");
        CaseDTO.DetailResponse caseDetail = caseService.createCase(caseReq, adminUser);

        HearingDTO.ScheduleRequest hrReq = new HearingDTO.ScheduleRequest();
        hrReq.setCaseId(caseDetail.getId());
        hrReq.setPresidingAuthorityId(adminUser.getId());
        hrReq.setHearingDate(LocalDate.now().plusDays(3));
        hrReq.setStartTime(LocalTime.of(10, 0));
        hrReq.setEndTime(LocalTime.of(11, 30));
        hrReq.setVenue("Administrative Board Room 204");
        hrReq.setHearingMode(HearingMode.IN_PERSON);
        hrReq.setRemarks("Formal notice delivered to respondent student.");

        HearingDTO.Response hearing = hearingService.scheduleHearing(hrReq, adminUser);
        assertThat(hearing.getHearingNumber()).startsWith("HR-");
        assertThat(hearing.getStatus()).isEqualTo(HearingStatus.SCHEDULED);

        // Case status should now reflect HEARING_SCHEDULED
        CaseDTO.DetailResponse updatedCase = caseService.getCaseById(caseDetail.getId(), adminUser);
        assertThat(updatedCase.getStatus()).isEqualTo(CaseStatus.HEARING_SCHEDULED);

        // Update hearing with minutes
        HearingDTO.UpdateRequest upReq = new HearingDTO.UpdateRequest();
        upReq.setStatus(HearingStatus.CONCLUDED);
        upReq.setMinutesDraft("All parties appeared. Respondent acknowledged inadvertent breach of lab hours.");
        upReq.setOutcome("First formal reprimand and requirement for safety re-briefing.");
        HearingDTO.Response completed = hearingService.updateHearing(hearing.getId(), upReq, adminUser);
        assertThat(completed.getStatus()).isEqualTo(HearingStatus.CONCLUDED);
        assertThat(completed.getOutcome()).contains("First formal reprimand");
    }

    @Test
    @DisplayName("Appellate Workflow: formal appeal submission and review determination")
    void testAppellateWorkflow() {
        CaseDTO.CreateRequest caseReq = new CaseDTO.CreateRequest();
        caseReq.setTitle("Library Privilege Suspension Appeal");
        caseReq.setCategory(CaseCategory.ACADEMIC_GRIEVANCE);
        caseReq.setSummary("30-day library suspension imposed.");
        CaseDTO.DetailResponse caseDetail = caseService.createCase(caseReq, facultyUser);

        AppealDTO.SubmitRequest appReq = new AppealDTO.SubmitRequest();
        appReq.setCaseId(caseDetail.getId());
        appReq.setGrounds("Disproportionate sanction given lack of prior infractions.");
        appReq.setExplanation("Sanction severely hinders preparation for upcoming university examinations.");
        appReq.setReliefSought("Reduction of suspension to 7 days.");

        AppealDTO.Response appeal = appealService.submitAppeal(appReq, studentUser);
        assertThat(appeal.getAppealNumber()).startsWith("AP-");
        assertThat(appeal.getStatus()).isEqualTo(AppealStatus.SUBMITTED);

        // Appellate authority reviews appeal
        AppealDTO.ReviewRequest revReq = new AppealDTO.ReviewRequest();
        revReq.setStatus(AppealStatus.MODIFIED);
        revReq.setFinalOutcome("Sanction reduced from 30 days to 10 days with community service.");
        revReq.setRecommendation("First-time infraction taken into consideration.");

        AppealDTO.Response determined = appealService.reviewAppeal(appeal.getId(), revReq, adminUser);
        assertThat(determined.getStatus()).isEqualTo(AppealStatus.MODIFIED);
        assertThat(determined.getFinalOutcome()).contains("Sanction reduced");
    }

    @Test
    @DisplayName("Counseling Care Workflow: referral creation, counselor assignment and confidential clinical notes")
    void testCounselingCareWorkflow() {
        CounselingDTO.CreateReferralRequest refReq = new CounselingDTO.CreateReferralRequest();
        refReq.setStudentId(studentUser.getId());
        refReq.setReason("Student experiencing high exam anxiety and sleep disruption.");
        refReq.setPriority(Priority.HIGH);

        CounselingDTO.ReferralResponse referral = counselingService.createReferral(refReq, facultyUser);
        assertThat(referral.getReferralNumber()).startsWith("CR-");
        assertThat(referral.getStatus()).isEqualTo(ReferralStatus.SCHEDULED);

        // Assign counselor
        CounselingDTO.AssignCounselorRequest assignReq = new CounselingDTO.AssignCounselorRequest();
        assignReq.setCounselorId(facultyUser.getId());
        CounselingDTO.ReferralResponse assigned = counselingService.assignCounselor(referral.getId(), assignReq, adminUser);
        assertThat(assigned.getCounselorName()).isEqualTo("Workflow Faculty");

        // Record confidential counseling session
        CounselingDTO.CreateSessionRequest sessReq = new CounselingDTO.CreateSessionRequest();
        sessReq.setSessionNumber(1);
        sessReq.setSessionDate(LocalDate.now());
        sessReq.setAttendanceStatus(AttendanceStatus.ATTENDED);
        sessReq.setClinicalSummary("Intake assessment: discussed stress coping strategies and breathing exercises.");

        CounselingDTO.SessionResponse session = counselingService.createSession(referral.getId(), sessReq, facultyUser);
        assertThat(session.getSessionNumber()).isEqualTo(1);
        assertThat(session.getClinicalSummary()).contains("Intake assessment");

        // Verify non-counselor student viewing referral does not see raw clinical notes
        CounselingDTO.ReferralResponse studentView = counselingService.getReferralById(referral.getId(), studentUser);
        assertThat(studentView.getSessions().get(0).getClinicalSummary()).isEqualTo("[CONFIDENTIAL_CLINICAL_NOTE]");

        // Verify counselor viewing referral sees full clinical notes
        CounselingDTO.ReferralResponse counselorView = counselingService.getReferralById(referral.getId(), facultyUser);
        assertThat(counselorView.getSessions().get(0).getClinicalSummary()).contains("Intake assessment");
    }
}
