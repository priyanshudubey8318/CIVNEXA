package com.civnexa.dto;

import com.civnexa.entity.enums.RoleType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;

    private boolean explicitName = false;

    @Size(max = 50, message = "First name cannot exceed 50 characters")
    private String firstName;

    @Size(max = 50, message = "Last name cannot exceed 50 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 120, message = "Email cannot exceed 120 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    private String password;

    private RoleType role;

    @Size(max = 30, message = "Roll number cannot exceed 30 characters")
    private String rollNumber;

    @Size(max = 30, message = "Institutional ID cannot exceed 30 characters")
    private String institutionalId;

    @Size(max = 50, message = "Enrollment number cannot exceed 50 characters")
    private String enrollmentNumber;

    private Long departmentId;

    @Size(max = 100, message = "Department name cannot exceed 100 characters")
    private String department;

    @Size(max = 100, message = "Course cannot exceed 100 characters")
    private String course;

    @Size(max = 30, message = "Semester cannot exceed 30 characters")
    private String semester;

    @Size(max = 10, message = "Section cannot exceed 10 characters")
    private String section;

    public RegisterRequest() {
    }

    public RegisterRequest(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public String getName() {
        if (!explicitName && (firstName != null || lastName != null)) {
            syncCombinedName();
        }
        return name;
    }

    public void setName(String name) {
        this.name = name;
        this.explicitName = (name != null && !name.trim().isEmpty());
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
        if (!explicitName) {
            syncCombinedName();
        }
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
        if (!explicitName) {
            syncCombinedName();
        }
    }

    private void syncCombinedName() {
        StringBuilder sb = new StringBuilder();
        if (firstName != null && !firstName.isBlank()) {
            sb.append(firstName.trim());
        }
        if (lastName != null && !lastName.isBlank()) {
            if (!sb.isEmpty()) {
                sb.append(" ");
            }
            sb.append(lastName.trim());
        }
        if (!sb.isEmpty()) {
            this.name = sb.toString();
        }
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public RoleType getRole() {
        return role;
    }

    public void setRole(RoleType role) {
        this.role = role;
    }

    public String getRollNumber() {
        if ((rollNumber == null || rollNumber.trim().isEmpty()) && institutionalId != null && !institutionalId.trim().isEmpty()) {
            return institutionalId.trim();
        }
        return rollNumber;
    }

    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }

    public String getInstitutionalId() {
        return institutionalId;
    }

    public void setInstitutionalId(String institutionalId) {
        this.institutionalId = institutionalId;
        if (this.rollNumber == null || this.rollNumber.trim().isEmpty()) {
            this.rollNumber = institutionalId;
        }
    }

    public String getEnrollmentNumber() {
        return enrollmentNumber;
    }

    public void setEnrollmentNumber(String enrollmentNumber) {
        this.enrollmentNumber = enrollmentNumber;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
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

    @Override
    public String toString() {
        return "RegisterRequest{" +
                "name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", password='[PROTECTED]'" +
                ", role=" + role +
                ", rollNumber='" + rollNumber + '\'' +
                ", institutionalId='" + institutionalId + '\'' +
                ", enrollmentNumber='" + enrollmentNumber + '\'' +
                ", departmentId=" + departmentId +
                ", department='" + department + '\'' +
                ", course='" + course + '\'' +
                ", semester='" + semester + '\'' +
                ", section='" + section + '\'' +
                '}';
    }
}
