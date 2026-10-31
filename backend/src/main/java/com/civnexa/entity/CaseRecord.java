package com.civnexa.entity;

import com.civnexa.entity.enums.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
@Table(name = "cases", indexes = {
    @Index(name = "idx_case_number", columnList = "case_number", unique = true),
    @Index(name = "idx_case_status", columnList = "status"),
    @Index(name = "idx_case_type", columnList = "case_type"),
    @Index(name = "idx_case_category", columnList = "category"),
    @Index(name = "idx_case_student", columnList = "student_id"),
    @Index(name = "idx_case_reporter", columnList = "reporter_id"),
    @Index(name = "idx_case_assigned", columnList = "assigned_to_id"),
    @Index(name = "idx_case_dept", columnList = "department_id")
})
public class CaseRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 30)
    @Column(name = "case_number", nullable = false, unique = true, length = 30)
    private String caseNumber;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "case_type", nullable = false, length = 20)
    private CaseType caseType = CaseType.INCIDENT;

    @NotBlank
    @Size(max = 255)
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private CaseCategory category;

    @Size(max = 100)
    @Column(name = "subcategory", length = 100)
    private String subcategory;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private Priority priority = Priority.MEDIUM;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private CaseStatus status = CaseStatus.PENDING_VERIFICATION;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 20)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", foreignKey = @ForeignKey(name = "fk_case_department"))
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", foreignKey = @ForeignKey(name = "fk_case_student"))
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", foreignKey = @ForeignKey(name = "fk_case_reporter"))
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id", foreignKey = @ForeignKey(name = "fk_case_assigned_to"))
    private User assignedTo;

    @Column(name = "incident_date")
    private Instant incidentDate;

    @Size(max = 10)
    @Column(name = "incident_time", length = 10)
    private String incidentTime;

    @Size(max = 150)
    @Column(name = "location", length = 150)
    private String location;

    @NotBlank
    @Column(name = "summary", nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "is_confidential", nullable = false)
    private boolean isConfidential = false;

    @Column(name = "is_anonymous", nullable = false)
    private boolean isAnonymous = false;

    @Size(max = 150)
    @Column(name = "concerned_person", length = 150)
    private String concernedPerson;

    @Column(name = "next_action_deadline")
    private Instant nextActionDeadline;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Size(max = 64)
    @Column(name = "qr_tracking_token", length = 64)
    private String qrTrackingToken;

    public CaseRecord() {
    }

    public CaseRecord(String caseNumber, CaseType caseType, String title, CaseCategory category, Priority priority, String summary) {
        this.caseNumber = caseNumber;
        this.caseType = caseType;
        this.title = title;
        this.category = category;
        this.priority = priority;
        this.summary = summary;
        this.status = CaseStatus.PENDING_VERIFICATION;
        this.verificationStatus = VerificationStatus.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (status == null) status = CaseStatus.PENDING_VERIFICATION;
        if (verificationStatus == null) verificationStatus = VerificationStatus.PENDING;
        if (priority == null) priority = Priority.MEDIUM;
        if (caseType == null) caseType = CaseType.INCIDENT;
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCaseNumber() {
        return caseNumber;
    }

    public void setCaseNumber(String caseNumber) {
        this.caseNumber = caseNumber;
    }

    public CaseType getCaseType() {
        return caseType;
    }

    public void setCaseType(CaseType caseType) {
        this.caseType = caseType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public CaseCategory getCategory() {
        return category;
    }

    public void setCategory(CaseCategory category) {
        this.category = category;
    }

    public String getSubcategory() {
        return subcategory;
    }

    public void setSubcategory(String subcategory) {
        this.subcategory = subcategory;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public CaseStatus getStatus() {
        return status;
    }

    public void setStatus(CaseStatus status) {
        this.status = status;
    }

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(VerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public User getReporter() {
        return reporter;
    }

    public void setReporter(User reporter) {
        this.reporter = reporter;
    }

    public User getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(User assignedTo) {
        this.assignedTo = assignedTo;
    }

    public Instant getIncidentDate() {
        return incidentDate;
    }

    public void setIncidentDate(Instant incidentDate) {
        this.incidentDate = incidentDate;
    }

    public String getIncidentTime() {
        return incidentTime;
    }

    public void setIncidentTime(String incidentTime) {
        this.incidentTime = incidentTime;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public boolean isConfidential() {
        return isConfidential;
    }

    public void setConfidential(boolean confidential) {
        isConfidential = confidential;
    }

    public boolean isAnonymous() {
        return isAnonymous;
    }

    public void setAnonymous(boolean anonymous) {
        isAnonymous = anonymous;
    }

    public String getConcernedPerson() {
        return concernedPerson;
    }

    public void setConcernedPerson(String concernedPerson) {
        this.concernedPerson = concernedPerson;
    }

    public Instant getNextActionDeadline() {
        return nextActionDeadline;
    }

    public void setNextActionDeadline(Instant nextActionDeadline) {
        this.nextActionDeadline = nextActionDeadline;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getQrTrackingToken() {
        return qrTrackingToken;
    }

    public void setQrTrackingToken(String qrTrackingToken) {
        this.qrTrackingToken = qrTrackingToken;
    }

    @Override
    public String toString() {
        return "CaseRecord{" +
                "id=" + id +
                ", caseNumber='" + caseNumber + '\'' +
                ", caseType=" + caseType +
                ", title='" + title + '\'' +
                ", category=" + category +
                ", priority=" + priority +
                ", status=" + status +
                ", isConfidential=" + isConfidential +
                ", isAnonymous=" + isAnonymous +
                '}';
    }
}
