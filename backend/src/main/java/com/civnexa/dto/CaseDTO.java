package com.civnexa.dto;

import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.enums.CaseCategory;
import com.civnexa.entity.enums.CaseStatus;
import com.civnexa.entity.enums.CaseType;
import com.civnexa.entity.enums.Priority;
import com.civnexa.entity.enums.VerificationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public class CaseDTO {

    public static class CreateRequest {
        @NotBlank(message = "Title is required")
        @Size(max = 255)
        private String title;

        private CaseType caseType = CaseType.INCIDENT;

        @NotNull(message = "Category is required")
        private CaseCategory category;

        private String subcategory;
        private Priority priority = Priority.MEDIUM;
        private Long departmentId;
        private String studentRollOrEmail;
        private Instant incidentDate;
        private String incidentTime;
        private String location;

        @NotBlank(message = "Summary is required")
        private String summary;

        private boolean confidential;
        private boolean anonymous;
        private String concernedPerson;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public CaseType getCaseType() { return caseType; }
        public void setCaseType(CaseType caseType) { this.caseType = caseType; }
        public CaseCategory getCategory() { return category; }
        public void setCategory(CaseCategory category) { this.category = category; }
        public String getSubcategory() { return subcategory; }
        public void setSubcategory(String subcategory) { this.subcategory = subcategory; }
        public Priority getPriority() { return priority; }
        public void setPriority(Priority priority) { this.priority = priority; }
        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public String getStudentRollOrEmail() { return studentRollOrEmail; }
        public void setStudentRollOrEmail(String studentRollOrEmail) { this.studentRollOrEmail = studentRollOrEmail; }
        public Instant getIncidentDate() { return incidentDate; }
        public void setIncidentDate(Instant incidentDate) { this.incidentDate = incidentDate; }
        public String getIncidentTime() { return incidentTime; }
        public void setIncidentTime(String incidentTime) { this.incidentTime = incidentTime; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public boolean isConfidential() { return confidential; }
        public void setConfidential(boolean confidential) { this.confidential = confidential; }
        public boolean isAnonymous() { return anonymous; }
        public void setAnonymous(boolean anonymous) { this.anonymous = anonymous; }
        public String getConcernedPerson() { return concernedPerson; }
        public void setConcernedPerson(String concernedPerson) { this.concernedPerson = concernedPerson; }
    }

    public static class StatusUpdateRequest {
        @NotNull
        private CaseStatus status;
        private String remarks;

        public CaseStatus getStatus() { return status; }
        public void setStatus(CaseStatus status) { this.status = status; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
    }

    public static class AssignmentRequest {
        @NotNull
        private Long assignedToUserId;

        public Long getAssignedToUserId() { return assignedToUserId; }
        public void setAssignedToUserId(Long assignedToUserId) { this.assignedToUserId = assignedToUserId; }
    }

    public static class NoteRequest {
        @NotBlank
        private String content;
        private boolean confidential;

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public boolean isConfidential() { return confidential; }
        public void setConfidential(boolean confidential) { this.confidential = confidential; }
    }

    public static class ResponseRequest {
        @NotBlank
        private String response;

        public String getResponse() { return response; }
        public void setResponse(String response) { this.response = response; }
    }

    public static class DetailResponse {
        private Long id;
        private String caseNumber;
        private CaseType caseType;
        private String title;
        private CaseCategory category;
        private String subcategory;
        private Priority priority;
        private CaseStatus status;
        private VerificationStatus verificationStatus;
        private String departmentName;
        private Long departmentId;
        private UserResponse student;
        private UserResponse reporter;
        private UserResponse assignedTo;
        private Instant incidentDate;
        private String incidentTime;
        private String location;
        private String summary;
        private String remarks;
        private boolean confidential;
        private boolean anonymous;
        private String concernedPerson;
        private Instant nextActionDeadline;
        private Instant createdAt;
        private Instant updatedAt;
        private List<ActivityItem> activities;
        private List<NoteItem> investigationNotes;
        private List<StudentResponseItem> responses;

        public static DetailResponse fromEntity(CaseRecord record) {
            DetailResponse dto = new DetailResponse();
            dto.setId(record.getId());
            dto.setCaseNumber(record.getCaseNumber());
            dto.setCaseType(record.getCaseType());
            dto.setTitle(record.getTitle());
            dto.setCategory(record.getCategory());
            dto.setSubcategory(record.getSubcategory());
            dto.setPriority(record.getPriority());
            dto.setStatus(record.getStatus());
            dto.setVerificationStatus(record.getVerificationStatus());
            if (record.getDepartment() != null) {
                dto.setDepartmentId(record.getDepartment().getId());
                dto.setDepartmentName(record.getDepartment().getName());
            }
            if (record.getStudent() != null) {
                dto.setStudent(UserResponse.fromEntity(record.getStudent()));
            }
            if (record.getReporter() != null && !record.isAnonymous()) {
                dto.setReporter(UserResponse.fromEntity(record.getReporter()));
            }
            if (record.getAssignedTo() != null) {
                dto.setAssignedTo(UserResponse.fromEntity(record.getAssignedTo()));
            }
            dto.setIncidentDate(record.getIncidentDate());
            dto.setIncidentTime(record.getIncidentTime());
            dto.setLocation(record.getLocation());
            dto.setSummary(record.getSummary());
            dto.setRemarks(record.getRemarks());
            dto.setConfidential(record.isConfidential());
            dto.setAnonymous(record.isAnonymous());
            dto.setConcernedPerson(record.getConcernedPerson());
            dto.setNextActionDeadline(record.getNextActionDeadline());
            dto.setCreatedAt(record.getCreatedAt());
            dto.setUpdatedAt(record.getUpdatedAt());
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getCaseNumber() { return caseNumber; }
        public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
        public CaseType getCaseType() { return caseType; }
        public void setCaseType(CaseType caseType) { this.caseType = caseType; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public CaseCategory getCategory() { return category; }
        public void setCategory(CaseCategory category) { this.category = category; }
        public String getSubcategory() { return subcategory; }
        public void setSubcategory(String subcategory) { this.subcategory = subcategory; }
        public Priority getPriority() { return priority; }
        public void setPriority(Priority priority) { this.priority = priority; }
        public CaseStatus getStatus() { return status; }
        public void setStatus(CaseStatus status) { this.status = status; }
        public VerificationStatus getVerificationStatus() { return verificationStatus; }
        public void setVerificationStatus(VerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public UserResponse getStudent() { return student; }
        public void setStudent(UserResponse student) { this.student = student; }
        public UserResponse getReporter() { return reporter; }
        public void setReporter(UserResponse reporter) { this.reporter = reporter; }
        public UserResponse getAssignedTo() { return assignedTo; }
        public void setAssignedTo(UserResponse assignedTo) { this.assignedTo = assignedTo; }
        public Instant getIncidentDate() { return incidentDate; }
        public void setIncidentDate(Instant incidentDate) { this.incidentDate = incidentDate; }
        public String getIncidentTime() { return incidentTime; }
        public void setIncidentTime(String incidentTime) { this.incidentTime = incidentTime; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
        public boolean isConfidential() { return confidential; }
        public void setConfidential(boolean confidential) { this.confidential = confidential; }
        public boolean isAnonymous() { return anonymous; }
        public void setAnonymous(boolean anonymous) { this.anonymous = anonymous; }
        public String getConcernedPerson() { return concernedPerson; }
        public void setConcernedPerson(String concernedPerson) { this.concernedPerson = concernedPerson; }
        public Instant getNextActionDeadline() { return nextActionDeadline; }
        public void setNextActionDeadline(Instant nextActionDeadline) { this.nextActionDeadline = nextActionDeadline; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
        public List<ActivityItem> getActivities() { return activities; }
        public void setActivities(List<ActivityItem> activities) { this.activities = activities; }
        public List<NoteItem> getInvestigationNotes() { return investigationNotes; }
        public void setInvestigationNotes(List<NoteItem> investigationNotes) { this.investigationNotes = investigationNotes; }
        public List<StudentResponseItem> getResponses() { return responses; }
        public void setResponses(List<StudentResponseItem> responses) { this.responses = responses; }
    }

    public static class ActivityItem {
        private Long id;
        private String action;
        private String actorName;
        private String actorRole;
        private String description;
        private Instant timestamp;

        public ActivityItem(Long id, String action, String actorName, String actorRole, String description, Instant timestamp) {
            this.id = id;
            this.action = action;
            this.actorName = actorName;
            this.actorRole = actorRole;
            this.description = description;
            this.timestamp = timestamp;
        }

        public Long getId() { return id; }
        public String getAction() { return action; }
        public String getActorName() { return actorName; }
        public String getActorRole() { return actorRole; }
        public String getDescription() { return description; }
        public Instant getTimestamp() { return timestamp; }
    }

    public static class NoteItem {
        private Long id;
        private String authorName;
        private String authorRole;
        private String noteContent;
        private boolean confidential;
        private Instant createdAt;

        public NoteItem(Long id, String authorName, String authorRole, String noteContent, boolean confidential, Instant createdAt) {
            this.id = id;
            this.authorName = authorName;
            this.authorRole = authorRole;
            this.noteContent = noteContent;
            this.confidential = confidential;
            this.createdAt = createdAt;
        }

        public Long getId() { return id; }
        public String getAuthorName() { return authorName; }
        public String getAuthorRole() { return authorRole; }
        public String getNoteContent() { return noteContent; }
        public boolean isConfidential() { return confidential; }
        public Instant getCreatedAt() { return createdAt; }
    }

    public static class StudentResponseItem {
        private Long id;
        private String studentName;
        private String responseText;
        private Instant submittedAt;

        public StudentResponseItem(Long id, String studentName, String responseText, Instant submittedAt) {
            this.id = id;
            this.studentName = studentName;
            this.responseText = responseText;
            this.submittedAt = submittedAt;
        }

        public Long getId() { return id; }
        public String getStudentName() { return studentName; }
        public String getResponseText() { return responseText; }
        public Instant getSubmittedAt() { return submittedAt; }
    }

    public static class StatsResponse {
        private long totalCases;
        private long openCases;
        private long underInvestigation;
        private long closedCases;
        private long pendingVerification;
        private long criticalPriority;

        public StatsResponse() {}
        public StatsResponse(long total, long open, long underInv, long closed, long pending, long critical) {
            this.totalCases = total;
            this.openCases = open;
            this.underInvestigation = underInv;
            this.closedCases = closed;
            this.pendingVerification = pending;
            this.criticalPriority = critical;
        }

        public long getTotalCases() { return totalCases; }
        public long getOpenCases() { return openCases; }
        public long getUnderInvestigation() { return underInvestigation; }
        public long getClosedCases() { return closedCases; }
        public long getPendingVerification() { return pendingVerification; }
        public long getCriticalPriority() { return criticalPriority; }
    }
}
