package com.civnexa.dto;

import com.civnexa.entity.Department;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DepartmentDTO {

    private Long id;
    private String code;
    private String name;
    private String hodName;
    private String contactEmail;
    private String status;
    private String description;

    public static DepartmentDTO fromEntity(Department dept) {
        if (dept == null) return null;
        DepartmentDTO dto = new DepartmentDTO();
        dto.setId(dept.getId());
        dto.setCode(dept.getCode());
        dto.setName(dept.getName());
        dto.setHodName(dept.getHodName());
        dto.setContactEmail(dept.getContactEmail());
        dto.setStatus(dept.getStatus());
        dto.setDescription(dept.getDescription());
        return dto;
    }

    public static class CreateRequest {
        @NotBlank(message = "Department code is required")
        @Size(max = 30)
        private String code;

        @NotBlank(message = "Department name is required")
        @Size(max = 150)
        private String name;

        @Size(max = 100)
        private String hodName;

        @Size(max = 120)
        private String contactEmail;

        private String description;

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getHodName() { return hodName; }
        public void setHodName(String hodName) { this.hodName = hodName; }
        public String getContactEmail() { return contactEmail; }
        public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class UpdateRequest {
        @Size(max = 150)
        private String name;

        @Size(max = 100)
        private String hodName;

        @Size(max = 120)
        private String contactEmail;

        private String status;
        private String description;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getHodName() { return hodName; }
        public void setHodName(String hodName) { this.hodName = hodName; }
        public String getContactEmail() { return contactEmail; }
        public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getHodName() { return hodName; }
    public void setHodName(String hodName) { this.hodName = hodName; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
