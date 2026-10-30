package com.civnexa.dto;

import com.civnexa.entity.Department;

public class DepartmentDTO {

    private Long id;
    private String code;
    private String name;
    private String hodName;
    private String contactEmail;
    private String status;

    public static DepartmentDTO fromEntity(Department dept) {
        DepartmentDTO dto = new DepartmentDTO();
        dto.setId(dept.getId());
        dto.setCode(dept.getCode());
        dto.setName(dept.getName());
        dto.setHodName(dept.getHodName());
        dto.setContactEmail(dept.getContactEmail());
        dto.setStatus(dept.getStatus());
        return dto;
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
}
