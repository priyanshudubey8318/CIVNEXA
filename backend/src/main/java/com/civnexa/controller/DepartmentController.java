package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.DepartmentDTO;
import com.civnexa.repository.DepartmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
