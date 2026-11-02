package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.DepartmentDTO;
import com.civnexa.entity.Department;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.DepartmentRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/departments", "/api/v1/departments"})
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    public DepartmentController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DepartmentDTO>>> getDepartments() {
        List<DepartmentDTO> list = departmentRepository.findByStatus("ACTIVE")
                .stream()
                .map(DepartmentDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list, "Active departments retrieved"));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD')")
    public ResponseEntity<ApiResponse<List<DepartmentDTO>>> getAllDepartments() {
        List<DepartmentDTO> list = departmentRepository.findAll()
                .stream()
                .map(DepartmentDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list, "All institutional departments retrieved"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentDTO>> getDepartmentById(@PathVariable Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ApiException("Department not found with ID: " + id, HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(DepartmentDTO.fromEntity(dept), "Department details retrieved"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN')")
    public ResponseEntity<ApiResponse<DepartmentDTO>> createDepartment(@Valid @RequestBody DepartmentDTO.CreateRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (departmentRepository.existsByCode(code)) {
            throw new ApiException("A department with code " + code + " already exists", HttpStatus.CONFLICT);
        }

        Department dept = new Department(
                code,
                request.getName().trim(),
                request.getHodName() != null ? request.getHodName().trim() : null,
                request.getContactEmail() != null ? request.getContactEmail().trim() : null,
                request.getDescription() != null ? request.getDescription().trim() : null
        );
        dept.setStatus("ACTIVE");
        dept.setCreatedAt(Instant.now());
        dept.setUpdatedAt(Instant.now());

        Department saved = departmentRepository.save(dept);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(DepartmentDTO.fromEntity(saved), "Department created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN')")
    public ResponseEntity<ApiResponse<DepartmentDTO>> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentDTO.UpdateRequest request) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ApiException("Department not found with ID: " + id, HttpStatus.NOT_FOUND));

        if (request.getName() != null && !request.getName().isBlank()) {
            dept.setName(request.getName().trim());
        }
        if (request.getHodName() != null) {
            dept.setHodName(request.getHodName().trim());
        }
        if (request.getContactEmail() != null) {
            dept.setContactEmail(request.getContactEmail().trim());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            dept.setStatus(request.getStatus().trim().toUpperCase());
        }
        if (request.getDescription() != null) {
            dept.setDescription(request.getDescription().trim());
        }
        dept.setUpdatedAt(Instant.now());

        Department updated = departmentRepository.save(dept);
        return ResponseEntity.ok(ApiResponse.ok(DepartmentDTO.fromEntity(updated), "Department updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ApiException("Department not found with ID: " + id, HttpStatus.NOT_FOUND));

        dept.setStatus("INACTIVE");
        dept.setUpdatedAt(Instant.now());
        departmentRepository.save(dept);

        return ResponseEntity.ok(ApiResponse.ok(null, "Department deactivated successfully"));
    }
}
