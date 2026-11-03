package com.civnexa.mysql;

import com.civnexa.entity.*;
import com.civnexa.entity.enums.*;
import com.civnexa.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("mysql")
@EnabledIfEnvironmentVariable(named = "RUN_MYSQL_TESTS", matches = "true")
@DisplayName("Real MySQL 8 — Full-Cycle Relational Persistence & Data Integrity Tests")
public class MySqlFullCycleDataIntegrityTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CaseRecordRepository caseRecordRepository;

    @Autowired
    private EvidenceItemRepository evidenceItemRepository;

    @Autowired
    private HearingRepository hearingRepository;

    @AfterEach
    void cleanUp() {
        hearingRepository.findAll().stream()
                .filter(h -> h.getHearingNumber() != null && h.getHearingNumber().startsWith("H-MYSQL-"))
                .forEach(h -> hearingRepository.delete(h));

        evidenceItemRepository.findAll().stream()
                .filter(e -> e.getEvidenceReference() != null && e.getEvidenceReference().startsWith("EV-MYSQL-"))
                .forEach(e -> evidenceItemRepository.delete(e));

        caseRecordRepository.findAll().stream()
                .filter(c -> c.getCaseNumber() != null && c.getCaseNumber().startsWith("CX-MYSQL-"))
                .forEach(c -> caseRecordRepository.delete(c));

        userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().endsWith("@mysql-test.edu"))
                .forEach(u -> userRepository.delete(u));

        departmentRepository.findAll().stream()
                .filter(d -> d.getCode() != null && d.getCode().startsWith("TEST_MYSQL_"))
                .forEach(d -> departmentRepository.delete(d));
    }

    @Test
    @Transactional
    @DisplayName("Verify full relational lifecycle: User -> Department -> Case -> Evidence -> Hearing in real MySQL")
    void testFullRelationalLifecycle() {
        // 1. Department
        Department dept = new Department();
        dept.setName("Computer Science & Engineering");
        dept.setCode("TEST_MYSQL_CSE");
        dept.setHodName("Dr. Alan Turing");
        dept.setContactEmail("hod.cse@mysql-test.edu");
        Department savedDept = departmentRepository.saveAndFlush(dept);
        assertThat(savedDept.getId()).isNotNull();

        // 2. Users (Dean & Student)
        User dean = new User();
        dean.setUserReference("DEAN-MYSQL-001");
        dean.setName("Dean Academic");
        dean.setEmail("dean@mysql-test.edu");
        dean.setPasswordHash("hashed_pwd_123");
        dean.setRole(RoleType.DEAN);
        dean.setStatus("ACTIVE");
        dean.setDepartment(savedDept);
        User savedDean = userRepository.saveAndFlush(dean);

        User student = new User();
        student.setUserReference("STU-MYSQL-001");
        student.setName("Ada Lovelace");
        student.setEmail("ada.lovelace@mysql-test.edu");
        student.setPasswordHash("hashed_pwd_456");
        student.setRole(RoleType.STUDENT);
        student.setStatus("ACTIVE");
        student.setRollNumber("CS2026-001");
        student.setDepartment(savedDept);
        User savedStudent = userRepository.saveAndFlush(student);

        // 3. Case Record
        CaseRecord caseRecord = new CaseRecord();
        caseRecord.setCaseNumber("CX-MYSQL-001");
        caseRecord.setCaseType(CaseType.INCIDENT);
        caseRecord.setTitle("Unauthorized Reference Materials in Examination");
        caseRecord.setCategory(CaseCategory.DISCIPLINE);
        caseRecord.setPriority(Priority.HIGH);
        caseRecord.setStatus(CaseStatus.UNDER_INVESTIGATION);
        caseRecord.setSummary("Student was found in possession of unauthorized technical notes during mid-term examination.");
        caseRecord.setDepartment(savedDept);
        caseRecord.setReporter(savedDean);
        caseRecord.setStudent(savedStudent);
        CaseRecord savedCase = caseRecordRepository.saveAndFlush(caseRecord);
        assertThat(savedCase.getId()).isNotNull();

        // 4. Evidence Item
        EvidenceItem evidence = new EvidenceItem();
        evidence.setEvidenceReference("EV-MYSQL-001");
        evidence.setCaseRecord(savedCase);
        evidence.setUploader(savedDean);
        evidence.setFileName("seized_exam_notes.pdf");
        evidence.setFileType("application/pdf");
        evidence.setFileSizeBytes(1048576L);
        evidence.setStorageReference("/vault/evidence/seized_exam_notes.pdf");
        evidence.setSha256Checksum("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        evidence.setReviewStatus(ReviewStatus.PENDING);
        evidence.setConfidential(false);
        EvidenceItem savedEvidence = evidenceItemRepository.saveAndFlush(evidence);
        assertThat(savedEvidence.getId()).isNotNull();

        // 5. Hearing
        Hearing hearing = new Hearing();
        hearing.setHearingNumber("H-MYSQL-001");
        hearing.setCaseRecord(savedCase);
        hearing.setScheduledBy(savedDean);
        hearing.setPresidingAuthority(savedDean);
        hearing.setHearingDate(LocalDate.now().plusDays(3));
        hearing.setStartTime(LocalTime.of(10, 0));
        hearing.setEndTime(LocalTime.of(11, 0));
        hearing.setVenue("Proctorial Board Hearing Chamber 101");
        hearing.setStatus(HearingStatus.SCHEDULED);
        Hearing savedHearing = hearingRepository.saveAndFlush(hearing);
        assertThat(savedHearing.getId()).isNotNull();

        // 6. Verify Queries and Relationships in Real MySQL
        Optional<CaseRecord> foundCase = caseRecordRepository.findByCaseNumber("CX-MYSQL-001");
        assertThat(foundCase).isPresent();
        assertThat(foundCase.get().getDepartment().getCode()).isEqualTo("TEST_MYSQL_CSE");
        assertThat(foundCase.get().getStudent().getName()).isEqualTo("Ada Lovelace");
        assertThat(foundCase.get().getReporter().getName()).isEqualTo("Dean Academic");

        List<EvidenceItem> caseEvidence = evidenceItemRepository.findByCaseRecord(foundCase.get());
        assertThat(caseEvidence).hasSize(1);
        assertThat(caseEvidence.get(0).getEvidenceReference()).isEqualTo("EV-MYSQL-001");
        assertThat(caseEvidence.get(0).getSha256Checksum()).isEqualTo("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

        List<Hearing> caseHearings = hearingRepository.findByCaseRecord(foundCase.get());
        assertThat(caseHearings).hasSize(1);
        assertThat(caseHearings.get(0).getHearingNumber()).isEqualTo("H-MYSQL-001");
        assertThat(caseHearings.get(0).getVenue()).isEqualTo("Proctorial Board Hearing Chamber 101");
    }
}
