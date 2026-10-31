package com.civnexa.entity;

import com.civnexa.entity.enums.RoleType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_ref", columnList = "user_reference", unique = true),
    @Index(name = "idx_user_email", columnList = "email", unique = true),
    @Index(name = "idx_user_role", columnList = "role"),
    @Index(name = "idx_user_roll", columnList = "roll_number", unique = true),
    @Index(name = "idx_user_dept", columnList = "department_id")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 30)
    @Column(name = "user_reference", nullable = false, unique = true, length = 30)
    private String userReference;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @NotBlank
    @Email
    @Size(max = 120)
    @Column(name = "email", nullable = false, unique = true, length = 120)
    private String email;

    @NotBlank
    @Size(max = 255)
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    private RoleType role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", foreignKey = @ForeignKey(name = "fk_user_department"))
    private Department department;

    @Size(max = 150)
    @Column(name = "title", length = 150)
    private String title;

    @Size(max = 30)
    @Column(name = "phone", length = 30)
    private String phone;

    @Size(max = 10)
    @Column(name = "avatar", length = 10)
    private String avatar;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING_VERIFICATION";

    @Size(max = 30)
    @Column(name = "roll_number", length = 30)
    private String rollNumber;

    @Size(max = 50)
    @Column(name = "enrollment_number", length = 50)
    private String enrollmentNumber;

    @Size(max = 100)
    @Column(name = "course", length = 100)
    private String course;

    @Size(max = 30)
    @Column(name = "semester", length = 30)
    private String semester;

    @Size(max = 10)
    @Column(name = "section", length = 10)
    private String section;

    @Column(name = "cgpa", precision = 4, scale = 2)
    private BigDecimal cgpa;

    @Size(max = 150)
    @Column(name = "hostel_details", length = 150)
    private String hostelDetails;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "password_change_required", nullable = false)
    private boolean passwordChangeRequired = false;

    @Size(max = 64)
    @Column(name = "qr_token", length = 64)
    private String qrToken;

    @Column(name = "qr_issued_at")
    private Instant qrIssuedAt;

    @Column(name = "qr_revoked", nullable = false)
    private boolean qrRevoked = false;

    public User() {
    }

    public User(String userReference, String name, String email, String passwordHash, RoleType role) {
        this.userReference = userReference;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.status = "PENDING_VERIFICATION";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (status == null) status = "PENDING_VERIFICATION";
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

    public String getUserReference() {
        return userReference;
    }

    public void setUserReference(String userReference) {
        this.userReference = userReference;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public RoleType getRole() {
        return role;
    }

    public void setRole(RoleType role) {
        this.role = role;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRollNumber() {
        return rollNumber;
    }

    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }

    public String getEnrollmentNumber() {
        return enrollmentNumber;
    }

    public void setEnrollmentNumber(String enrollmentNumber) {
        this.enrollmentNumber = enrollmentNumber;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public BigDecimal getCgpa() {
        return cgpa;
    }

    public void setCgpa(BigDecimal cgpa) {
        this.cgpa = cgpa;
    }

    public String getHostelDetails() {
        return hostelDetails;
    }

    public void setHostelDetails(String hostelDetails) {
        this.hostelDetails = hostelDetails;
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

    public boolean isPasswordChangeRequired() {
        return passwordChangeRequired;
    }

    public void setPasswordChangeRequired(boolean passwordChangeRequired) {
        this.passwordChangeRequired = passwordChangeRequired;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public Instant getQrIssuedAt() {
        return qrIssuedAt;
    }

    public void setQrIssuedAt(Instant qrIssuedAt) {
        this.qrIssuedAt = qrIssuedAt;
    }

    public boolean isQrRevoked() {
        return qrRevoked;
    }

    public void setQrRevoked(boolean qrRevoked) {
        this.qrRevoked = qrRevoked;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", userReference='" + userReference + '\'' +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", role=" + role +
                ", status='" + status + '\'' +
                ", rollNumber='" + rollNumber + '\'' +
                '}';
    }
}
