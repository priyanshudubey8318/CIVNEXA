package com.civnexa.repository;

import com.civnexa.entity.*;
import com.civnexa.entity.enums.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RepositoryIntegrationTests {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CaseRecordRepository caseRecordRepository;

    @Autowired
    private InvestigationNoteRepository investigationNoteRepository;

    @Autowired
    private StudentResponseRepository studentResponseRepository;

    @Autowired
    private CaseActivityRepository caseActivityRepository;

    @Autowired
    private EvidenceItemRepository evidenceItemRepository;

    @Autowired
    private EvidenceCustodyLogRepository evidenceCustodyLogRepository;

    @Autowired
    private HearingRepository hearingRepository;

    @Autowired
    private HearingCommitteeMemberRepository hearingCommitteeMemberRepository;

    @Autowired
    private AppealRecordRepository appealRecordRepository;

    @Autowired
    private CounselingReferralRepository counselingReferralRepository;

    @Autowired
    private CounselingSessionRepository counselingSessionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private Department createDepartment(String code, String name) {
        Department dept = new Department(code, name);
        dept.setHodName("Dr. Alan Turing");
        dept.setContactEmail("turing@" + code.toLowerCase() + ".institution.edu");
        dept.setStatus("ACTIVE");
        return departmentRepository.save(dept);
    }

    private User createUser(String ref, String name, String email, RoleType role, Department dept) {
        User user = new User(ref, name, email, "$2a$12$e8F/e8k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h", role);
        user.setDepartment(dept);
        user.setStatus("ACTIVE");
        return userRepository.save(user);
    }

    @Test
    @DisplayName("Verify Department and User persistence with role mappings and profile attributes")
    void testDepartmentAndUserPersistence() {
        Department cse = createDepartment("CSE", "Computer Science & Engineering");
        assertThat(cse.getId()).isNotNull();
        assertThat(cse.getCreatedAt()).isNotNull();

        User student = createUser("STU-1001", "Aarav Sharma", "aarav.sharma@institution.edu", RoleType.STUDENT, cse);
        student.setRollNumber("2026CSE001");
        student.setEnrollmentNumber("ENR-2026-CSE-001");
        student.setCourse("B.Tech Computer Science");
        student.setSemester("Semester 6");
        student.setCgpa(new BigDecimal("8.75"));
        userRepository.save(student);

        User dean = createUser("ADM-001", "Dr. Vikram Seth", "dean@institution.edu", RoleType.DEAN, cse);
        dean.setTitle("Dean of Academic Affairs");
        userRepository.save(dean);

        Optional<User> foundStudent = userRepository.findByUserReference("STU-1001");
        assertThat(foundStudent).isPresent();
        assertThat(foundStudent.get().getRole()).isEqualTo(RoleType.STUDENT);
        assertThat(foundStudent.get().getDepartment().getCode()).isEqualTo("CSE");
        assertThat(foundStudent.get().getCgpa()).isEqualByComparingTo("8.75");

        List<User> cseStudents = userRepository.findByRoleAndDepartment(RoleType.STUDENT, cse);
        assertThat(cseStudents).hasSize(1);
        assertThat(cseStudents.get(0).getName()).isEqualTo("Aarav Sharma");
    }

    @Test
    @DisplayName("Verify CaseRecord creation, type distinctions, and cascade associations")
    void testCaseRecordPersistenceAndRelationships() {
        Department cse = createDepartment("MECH", "Mechanical Engineering");
        User student = createUser("STU-1002", "Priya Patel", "priya.patel@institution.edu", RoleType.STUDENT, cse);
        User faculty = createUser("FAC-001", "Prof. Rajesh Kumar", "rajesh.kumar@institution.edu", RoleType.FACULTY, cse);

        // Disciplinary Incident
        CaseRecord incident = new CaseRecord(
                "CX-2026-0001",
                CaseType.INCIDENT,
                "Unauthorized examination notes in Mid-Term Hall 4",
                CaseCategory.EXAM_INCIDENT,
                Priority.HIGH,
                "Found in possession of formula annotations"
        );
        incident.setStudent(student);
        incident.setReporter(faculty);
        incident.setDepartment(cse);
        incident.setLocation("Academic Complex Block C - Room 304");
        CaseRecord savedIncident = caseRecordRepository.save(incident);

        assertThat(savedIncident.getId()).isNotNull();
        assertThat(savedIncident.getStatus()).isEqualTo(CaseStatus.PENDING_VERIFICATION);
        assertThat(savedIncident.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);

        // Investigation Note
        InvestigationNote note = new InvestigationNote(savedIncident, faculty, "Proctorial inspection confirmed handwritten markings on desk.", false);
        investigationNoteRepository.save(note);

        List<InvestigationNote> notes = investigationNoteRepository.findByCaseRecordOrderByCreatedAtAsc(savedIncident);
        assertThat(notes).hasSize(1);
        assertThat(notes.get(0).getAuthor().getUserReference()).isEqualTo("FAC-001");

        // Student Response
        StudentResponse response = new StudentResponse(savedIncident, student, "I sat in the desk assigned by the invigilator and did not author the markings.", true);
        studentResponseRepository.save(response);

        List<StudentResponse> studentResponses = studentResponseRepository.findByCaseRecordOrderBySubmittedAtAsc(savedIncident);
        assertThat(studentResponses).hasSize(1);
        assertThat(studentResponses.get(0).isDeclarationConfirmed()).isTrue();

        // Case Activity Timeline
        CaseActivity activity = new CaseActivity(savedIncident, "CASE_CREATED", faculty, "Prof. Rajesh Kumar", "FACULTY", null, "PENDING_VERIFICATION", "Incident logged via mobile portal");
        caseActivityRepository.save(activity);

        List<CaseActivity> activities = caseActivityRepository.findByCaseRecordOrderByTimestampDesc(savedIncident);
        assertThat(activities).hasSize(1);
        assertThat(activities.get(0).getAction()).isEqualTo("CASE_CREATED");
    }

    @Test
    @DisplayName("Verify Evidence Vault metadata persistence and cryptographic Chain of Custody")
    void testEvidenceItemAndCustodyChain() {
        Department dept = createDepartment("ECE", "Electronics & Communication");
        User reporter = createUser("FAC-002", "Dr. Meera Nambiar", "meera@institution.edu", RoleType.FACULTY, dept);
        User student = createUser("STU-1003", "Rohan Verma", "rohan@institution.edu", RoleType.STUDENT, dept);

        CaseRecord c = new CaseRecord("CX-2026-0002", CaseType.INCIDENT, "Lab equipment damage", CaseCategory.CAMPUS_SAFETY, Priority.MEDIUM, "Oscilloscope display cracked");
        c.setStudent(student);
        caseRecordRepository.save(c);

        EvidenceItem evidence = new EvidenceItem(
                "EV-2026-0001",
                c,
                reporter,
                "hall_c_cctv_frame.jpg",
                "image/jpeg",
                2048576L,
                "evidence/2026/02/hall_c_cctv_frame.jpg",
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
        evidenceItemRepository.save(evidence);

        EvidenceCustodyLog log1 = new EvidenceCustodyLog(evidence, reporter, "UPLOADED", "Original CCTV snapshot captured and SHA-256 computed");
        evidenceCustodyLogRepository.save(log1);

        EvidenceCustodyLog log2 = new EvidenceCustodyLog(evidence, reporter, "VERIFIED", "Hash verified matching original camera server file");
        evidenceCustodyLogRepository.save(log2);

        Optional<EvidenceItem> foundEv = evidenceItemRepository.findByEvidenceReference("EV-2026-0001");
        assertThat(foundEv).isPresent();
        assertThat(foundEv.get().getSha256Checksum()).isEqualTo("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

        List<EvidenceCustodyLog> chain = evidenceCustodyLogRepository.findByEvidenceItemOrderByTimestampAsc(evidence);
        assertThat(chain).hasSize(2);
        assertThat(chain.get(0).getAction()).isEqualTo("UPLOADED");
        assertThat(chain.get(1).getAction()).isEqualTo("VERIFIED");
    }

    @Test
    @DisplayName("Verify Hearing schedule, presiding authority, and committee roster")
    void testHearingAndCommitteeMembers() {
        Department dept = createDepartment("CIVIL", "Civil Engineering");
        User dean = createUser("DEAN-001", "Dr. Sunita Rao", "dean.rao@institution.edu", RoleType.DEAN, dept);
        User faculty1 = createUser("FAC-003", "Prof. K. Sharma", "ksharma@institution.edu", RoleType.COMMITTEE_MEMBER, dept);
        User faculty2 = createUser("FAC-004", "Prof. N. Sen", "nsen@institution.edu", RoleType.COMMITTEE_MEMBER, dept);
        User student = createUser("STU-1004", "Ananya Deshmukh", "ananya@institution.edu", RoleType.STUDENT, dept);

        CaseRecord c = new CaseRecord("CX-2026-0003", CaseType.INCIDENT, "Disciplinary Hearing matter", CaseCategory.DISCIPLINE, Priority.HIGH, "Classroom disruption inquiry");
        c.setStudent(student);
        caseRecordRepository.save(c);

        Hearing hearing = new Hearing(
                "H-2026-0001",
                c,
                dean,
                dean,
                LocalDate.now().plusDays(5),
                LocalTime.of(14, 30),
                LocalTime.of(16, 0),
                "Senate Hall Room 201"
        );
        hearing.setMode(HearingMode.IN_PERSON);
        hearingRepository.save(hearing);

        HearingCommitteeMember m1 = new HearingCommitteeMember(hearing, faculty1, AttendanceStatus.PRESENT);
        HearingCommitteeMember m2 = new HearingCommitteeMember(hearing, faculty2, AttendanceStatus.PENDING);
        hearingCommitteeMemberRepository.save(m1);
        hearingCommitteeMemberRepository.save(m2);

        Optional<Hearing> foundHearing = hearingRepository.findByHearingNumber("H-2026-0001");
        assertThat(foundHearing).isPresent();
        assertThat(foundHearing.get().getPresidingAuthority().getName()).isEqualTo("Dr. Sunita Rao");

        List<HearingCommitteeMember> panel = hearingCommitteeMemberRepository.findByHearing(hearing);
        assertThat(panel).hasSize(2);
    }

    @Test
    @DisplayName("Verify AppealRecord lifecycle, statutory grounds, and reviewer assignment")
    void testAppealRecordLifecycle() {
        Department dept = createDepartment("PHY", "Physics");
        User student = createUser("STU-1005", "Devendra Joshi", "devendra@institution.edu", RoleType.STUDENT, dept);
        User reviewer = createUser("REV-001", "Prof. A. Banerjee", "banerjee@institution.edu", RoleType.DEAN, dept);

        CaseRecord c = new CaseRecord("CX-2026-0004", CaseType.INCIDENT, "Appealed sanction", CaseCategory.DISCIPLINE, Priority.MEDIUM, "Summary sanction imposed");
        c.setStudent(student);
        caseRecordRepository.save(c);

        AppealRecord appeal = new AppealRecord(
                "APL-2026-0001",
                c,
                student,
                "PROCEDURAL_IRREGULARITY,NEW_EVIDENCE",
                "New medical documentation verifies hospital admission at the time of the event.",
                "Revocation of academic probation sanction",
                "Initial board sanction imposed two-week probation without considering verified medical certificate.",
                Instant.now().plusSeconds(86400 * 7)
        );
        appeal.setAssignedReviewer(reviewer);
        appeal.setStatus(AppealStatus.UNDER_REVIEW);
        appealRecordRepository.save(appeal);

        Optional<AppealRecord> foundAppeal = appealRecordRepository.findByAppealNumber("APL-2026-0001");
        assertThat(foundAppeal).isPresent();
        assertThat(foundAppeal.get().getStatus()).isEqualTo(AppealStatus.UNDER_REVIEW);
        assertThat(foundAppeal.get().getAssignedReviewer().getUserReference()).isEqualTo("REV-001");
    }

    @Test
    @DisplayName("Verify CounselingReferral confidentiality isolation and sequential progress sessions")
    void testCounselingReferralAndSessions() {
        Department dept = createDepartment("CHEM", "Chemistry");
        User student = createUser("STU-1006", "Siddharth Nair", "sid@institution.edu", RoleType.STUDENT, dept);
        User hod = createUser("HOD-001", "Prof. M. K. Pillai", "pillai@institution.edu", RoleType.HOD, dept);
        User counselor = createUser("COUNS-001", "Dr. Shalini Ghosh", "shalini@institution.edu", RoleType.COORDINATOR, dept);

        CounselingReferral referral = new CounselingReferral(
                "REF-2026-0001",
                student,
                hod,
                "Student displaying acute exam anxiety and requested stress mitigation counseling.",
                Priority.HIGH
        );
        referral.setCounselor(counselor);
        referral.setScheduledDate(LocalDate.now().plusDays(2));
        referral.setConfidentialNotes("STRICTLY PRIVATE: Initial intake assessment indicates test anxiety without behavioral misconduct.");
        counselingReferralRepository.save(referral);

        CounselingSession s1 = new CounselingSession(referral, 1, LocalDate.now().plusDays(2), AttendanceStatus.SCHEDULED, "Introductory cognitive coping assessment");
        counselingSessionRepository.save(s1);

        CounselingSession s2 = new CounselingSession(referral, 2, LocalDate.now().plusDays(9), AttendanceStatus.SCHEDULED, "Follow-up relaxation exercises");
        counselingSessionRepository.save(s2);

        Optional<CounselingReferral> foundRef = counselingReferralRepository.findByReferralNumber("REF-2026-0001");
        assertThat(foundRef).isPresent();
        assertThat(foundRef.get().getConfidentialNotes()).contains("STRICTLY PRIVATE");

        List<CounselingSession> sessions = counselingSessionRepository.findByReferralOrderBySessionNumberAsc(referral);
        assertThat(sessions).hasSize(2);
        assertThat(sessions.get(0).getSessionNumber()).isEqualTo(1);
        assertThat(sessions.get(1).getSessionNumber()).isEqualTo(2);
    }

    @Test
    @DisplayName("Verify AuditLog persistence and compliance query retrieval")
    void testAuditLogPersistence() {
        Department dept = createDepartment("MATH", "Mathematics");
        User admin = createUser("ADM-002", "System Administrator", "admin@institution.edu", RoleType.SUPER_ADMIN, dept);

        AuditLog log = new AuditLog(
                "USER_STATUS_UPDATED",
                "USER",
                "STU-1001",
                admin,
                "System Administrator",
                "SUPER_ADMIN",
                "Administrative reactivation of student profile following semester registration"
        );
        log.setPreviousStatus("DEACTIVATED");
        log.setNewStatus("ACTIVE");
        log.setIpAddress("192.168.1.105");
        auditLogRepository.save(log);

        List<AuditLog> auditTrail = auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("USER", "STU-1001");
        assertThat(auditTrail).hasSize(1);
        assertThat(auditTrail.get(0).getAction()).isEqualTo("USER_STATUS_UPDATED");
        assertThat(auditTrail.get(0).getEventUuid()).isNotNull();
    }

    @Test
    @DisplayName("Verify database uniqueness constraints on critical public references")
    void testUniqueConstraintsEnforcement() {
        Department dept = createDepartment("BIO", "Biological Sciences");
        createUser("STU-9999", "Unique User One", "unique1@institution.edu", RoleType.STUDENT, dept);

        // Duplicate email should trigger DataIntegrityViolationException on flush
        User duplicateEmailUser = new User("STU-9998", "Duplicate Email", "unique1@institution.edu", "hash", RoleType.STUDENT);
        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(duplicateEmailUser);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Verify anonymous grievance whistleblower protection in CaseRecord")
    void testAnonymousWhistleblowerGrievance() {
        CaseRecord grievance = new CaseRecord(
                "GRV-2026-0001",
                CaseType.GRIEVANCE,
                "Water filter malfunctioning in Hostel Block D",
                CaseCategory.INFRASTRUCTURE,
                Priority.MEDIUM,
                "Drinking water supply contaminated on second floor."
        );
        grievance.setAnonymous(true);
        grievance.setConfidential(true);
        grievance.setStatus(CaseStatus.SUBMITTED);
        grievance.setVerificationStatus(VerificationStatus.PENDING);
        CaseRecord saved = caseRecordRepository.save(grievance);

        Optional<CaseRecord> found = caseRecordRepository.findByCaseNumber("GRV-2026-0001");
        assertThat(found).isPresent();
        assertThat(found.get().isAnonymous()).isTrue();
        assertThat(found.get().getStudent()).isNull();
        assertThat(found.get().getCaseType()).isEqualTo(CaseType.GRIEVANCE);
    }
}
