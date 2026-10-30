package com.civnexa.service;

import com.civnexa.dto.CaseDTO;
import com.civnexa.entity.*;
import com.civnexa.entity.enums.CaseStatus;
import com.civnexa.entity.enums.CaseType;
import com.civnexa.entity.enums.Priority;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.entity.enums.VerificationStatus;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class CaseService {

    private static final Logger log = LoggerFactory.getLogger(CaseService.class);

    private final CaseRecordRepository caseRepository;
    private final CaseActivityRepository activityRepository;
    private final InvestigationNoteRepository noteRepository;
    private final StudentResponseRepository responseRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditService auditService;

    public CaseService(CaseRecordRepository caseRepository,
                       CaseActivityRepository activityRepository,
                       InvestigationNoteRepository noteRepository,
                       StudentResponseRepository responseRepository,
                       UserRepository userRepository,
                       DepartmentRepository departmentRepository,
                       AuditService auditService) {
        this.caseRepository = caseRepository;
        this.activityRepository = activityRepository;
        this.noteRepository = noteRepository;
        this.responseRepository = responseRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.auditService = auditService;
    }

    @Transactional
    public CaseDTO.DetailResponse createCase(CaseDTO.CreateRequest request, User reporter) {
        if (request == null) {
            throw new ApiException("Case creation request cannot be null", HttpStatus.BAD_REQUEST);
        }

        String prefix = (request.getCaseType() == CaseType.GRIEVANCE) ? "GR" : "CX";
        String caseNumber = generateUniqueCaseNumber(prefix);

        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
        }

        User student = null;
        if (request.getStudentRollOrEmail() != null && !request.getStudentRollOrEmail().isBlank()) {
            String idStr = request.getStudentRollOrEmail().trim();
            student = userRepository.findByEmailIgnoreCase(idStr)
                    .or(() -> userRepository.findByRollNumber(idStr))
                    .orElse(null);
        }

        CaseRecord record = new CaseRecord();
        record.setCaseNumber(caseNumber);
        record.setCaseType(request.getCaseType() != null ? request.getCaseType() : CaseType.INCIDENT);
        record.setTitle(request.getTitle().trim());
        record.setCategory(request.getCategory());
        record.setSubcategory(request.getSubcategory());
        record.setPriority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM);
        record.setStatus(CaseStatus.PENDING_VERIFICATION);
        record.setVerificationStatus(VerificationStatus.PENDING);
        record.setDepartment(dept);
        record.setStudent(student);
        record.setReporter(reporter);
        record.setIncidentDate(request.getIncidentDate());
        record.setIncidentTime(request.getIncidentTime());
        record.setLocation(request.getLocation());
        record.setSummary(request.getSummary());
        record.setConfidential(request.isConfidential());
        record.setAnonymous(request.isAnonymous());
        record.setConcernedPerson(request.getConcernedPerson());
        record.setCreatedAt(Instant.now());
        record.setUpdatedAt(Instant.now());

        CaseRecord saved = caseRepository.saveAndFlush(record);

        // Record initial activity log
        CaseActivity activity = new CaseActivity(
                saved,
                "CASE_CREATED",
                reporter,
                reporter != null ? reporter.getName() : "ANONYMOUS",
                reporter != null && reporter.getRole() != null ? reporter.getRole().name() : "REPORTER",
                "Case intake initiated under reference " + caseNumber
        );
        activityRepository.save(activity);

        if (auditService != null) {
            auditService.recordEvent("CASE_CREATED", "CASE", caseNumber, reporter,
                    "New case logged: " + request.getTitle());
        }

        log.info("Created new case {} by actor {}", caseNumber, reporter != null ? reporter.getUserReference() : "ANONYMOUS");
        return assembleDetail(saved, reporter);
    }

    @Transactional(readOnly = true)
    public Page<CaseDTO.DetailResponse> getAllCases(Pageable pageable, User caller) {
        return caseRepository.findAll(pageable)
                .map(c -> assembleDetail(c, caller));
    }

    @Transactional(readOnly = true)
    public CaseDTO.DetailResponse getCaseById(Long id, User caller) {
        CaseRecord record = caseRepository.findById(id)
                .orElseThrow(() -> new ApiException("Case not found with ID: " + id, HttpStatus.NOT_FOUND));
        return assembleDetail(record, caller);
    }

    @Transactional
    public CaseDTO.DetailResponse updateStatus(Long id, CaseDTO.StatusUpdateRequest request, User actor) {
        CaseRecord record = caseRepository.findById(id)
                .orElseThrow(() -> new ApiException("Case not found with ID: " + id, HttpStatus.NOT_FOUND));

        CaseStatus prevStatus = record.getStatus();
        record.setStatus(request.getStatus());
        if (request.getRemarks() != null && !request.getRemarks().isBlank()) {
            record.setRemarks(request.getRemarks());
        }
        record.setUpdatedAt(Instant.now());
        CaseRecord saved = caseRepository.saveAndFlush(record);

        CaseActivity activity = new CaseActivity(
                saved,
                "STATUS_UPDATED",
                actor,
                actor != null ? actor.getName() : "SYSTEM",
                actor != null && actor.getRole() != null ? actor.getRole().name() : "ADMIN",
                "Status changed from " + prevStatus + " to " + request.getStatus() +
                        (request.getRemarks() != null ? ". Remarks: " + request.getRemarks() : "")
        );
        activityRepository.save(activity);

        if (auditService != null) {
            auditService.recordEvent("CASE_STATUS_UPDATED", "CASE", record.getCaseNumber(), actor,
                    "Status transitioned to " + request.getStatus());
        }

        return assembleDetail(saved, actor);
    }

    @Transactional
    public CaseDTO.DetailResponse assignCase(Long id, CaseDTO.AssignmentRequest request, User actor) {
        CaseRecord record = caseRepository.findById(id)
                .orElseThrow(() -> new ApiException("Case not found with ID: " + id, HttpStatus.NOT_FOUND));

        User assignee = userRepository.findById(request.getAssignedToUserId())
                .orElseThrow(() -> new ApiException("Assigned user not found", HttpStatus.BAD_REQUEST));

        record.setAssignedTo(assignee);
        if (record.getStatus() == CaseStatus.PENDING_VERIFICATION || record.getStatus() == CaseStatus.SUBMITTED) {
            record.setStatus(CaseStatus.ASSIGNED);
        }
        record.setUpdatedAt(Instant.now());
        CaseRecord saved = caseRepository.saveAndFlush(record);

        CaseActivity activity = new CaseActivity(
                saved,
                "CASE_ASSIGNED",
                actor,
                actor != null ? actor.getName() : "SYSTEM",
                actor != null && actor.getRole() != null ? actor.getRole().name() : "ADMIN",
                "Case assigned to " + assignee.getName() + " (" + assignee.getRole() + ")"
        );
        activityRepository.save(activity);

        if (auditService != null) {
            auditService.recordEvent("CASE_ASSIGNED", "CASE", record.getCaseNumber(), actor,
                    "Assigned to " + assignee.getUserReference());
        }

        return assembleDetail(saved, actor);
    }

    @Transactional
    public CaseDTO.DetailResponse addInvestigationNote(Long id, CaseDTO.NoteRequest request, User author) {
        CaseRecord record = caseRepository.findById(id)
                .orElseThrow(() -> new ApiException("Case not found with ID: " + id, HttpStatus.NOT_FOUND));

        InvestigationNote note = new InvestigationNote(
                record,
                author,
                request.getContent(),
                request.isConfidential()
        );
        noteRepository.save(note);

        CaseActivity activity = new CaseActivity(
                record,
                "NOTE_ADDED",
                author,
                author != null ? author.getName() : "INVESTIGATOR",
                author != null && author.getRole() != null ? author.getRole().name() : "OFFICER",
                "Investigation note appended" + (request.isConfidential() ? " (Confidential)" : "")
        );
        activityRepository.save(activity);

        return assembleDetail(record, author);
    }

    @Transactional
    public CaseDTO.DetailResponse submitStudentResponse(Long id, CaseDTO.ResponseRequest request, User student) {
        CaseRecord record = caseRepository.findById(id)
                .orElseThrow(() -> new ApiException("Case not found with ID: " + id, HttpStatus.NOT_FOUND));

        StudentResponse resp = new StudentResponse(
                record,
                student,
                request.getResponse(),
                true
        );
        responseRepository.save(resp);

        CaseActivity activity = new CaseActivity(
                record,
                "STUDENT_RESPONSE_SUBMITTED",
                student,
                student != null ? student.getName() : "STUDENT",
                "STUDENT",
                "Student representation response recorded"
        );
        activityRepository.save(activity);

        return assembleDetail(record, student);
    }

    @Transactional(readOnly = true)
    public CaseDTO.StatsResponse getStats() {
        long total = caseRepository.count();
        long open = caseRepository.countByStatusIn(List.of(
                CaseStatus.SUBMITTED,
                CaseStatus.PENDING_VERIFICATION,
                CaseStatus.VERIFIED,
                CaseStatus.ASSIGNED,
                CaseStatus.UNDER_INVESTIGATION,
                CaseStatus.AWAITING_RESPONSE,
                CaseStatus.HEARING_SCHEDULED,
                CaseStatus.DECISION_PENDING
        ));
        long underInv = caseRepository.countByStatus(CaseStatus.UNDER_INVESTIGATION);
        long closed = caseRepository.countByStatusIn(List.of(CaseStatus.RESOLVED, CaseStatus.CLOSED));
        long pending = caseRepository.countByStatus(CaseStatus.PENDING_VERIFICATION);
        long critical = caseRepository.countByPriority(Priority.CRITICAL);

        return new CaseDTO.StatsResponse(total, open, underInv, closed, pending, critical);
    }

    private CaseDTO.DetailResponse assembleDetail(CaseRecord record, User caller) {
        CaseDTO.DetailResponse dto = CaseDTO.DetailResponse.fromEntity(record);

        // Fetch activities
        List<CaseActivity> activities = activityRepository.findByCaseRecordOrderByTimestampDesc(record);
        dto.setActivities(activities.stream().map(a -> new CaseDTO.ActivityItem(
                a.getId(),
                a.getAction(),
                a.getActorName(),
                a.getActorRole(),
                a.getDescription(),
                a.getTimestamp()
        )).collect(Collectors.toList()));

        // Fetch investigation notes (filtering confidential notes if student)
        boolean isStudent = (caller != null && caller.getRole() == RoleType.STUDENT);
        List<InvestigationNote> notes;
        if (isStudent) {
            notes = noteRepository.findByCaseRecordAndIsConfidentialFalseOrderByCreatedAtAsc(record);
        } else {
            notes = noteRepository.findByCaseRecordOrderByCreatedAtAsc(record);
        }
        dto.setInvestigationNotes(notes.stream().map(n -> new CaseDTO.NoteItem(
                n.getId(),
                n.getAuthor() != null ? n.getAuthor().getName() : "INVESTIGATOR",
                n.getAuthor() != null && n.getAuthor().getRole() != null ? n.getAuthor().getRole().name() : "OFFICER",
                n.getNote(),
                n.isConfidential(),
                n.getCreatedAt()
        )).collect(Collectors.toList()));

        // Fetch responses
        List<StudentResponse> responses = responseRepository.findByCaseRecordOrderBySubmittedAtAsc(record);
        dto.setResponses(responses.stream().map(r -> new CaseDTO.StudentResponseItem(
                r.getId(),
                r.getStudent() != null ? r.getStudent().getName() : "STUDENT",
                r.getResponseText(),
                r.getSubmittedAt()
        )).collect(Collectors.toList()));

        return dto;
    }

    public String generateUniqueCaseNumber(String prefix) {
        int currentYear = Year.now().getValue();
        for (int i = 0; i < 10; i++) {
            int randomVal = ThreadLocalRandom.current().nextInt(1000, 10000);
            String candidate = prefix + "-" + currentYear + "-" + randomVal;
            if (!caseRepository.existsByCaseNumber(candidate)) {
                return candidate;
            }
        }
        return prefix + "-" + currentYear + "-" + (System.currentTimeMillis() % 100000L);
    }
}
