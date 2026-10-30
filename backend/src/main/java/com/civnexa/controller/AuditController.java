package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.entity.AuditLog;
import com.civnexa.service.AuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/admin", "/api/v1/admin"})
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN')")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @PageableDefault(size = 30, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AuditLog> page = auditService.getAuditLogs(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page, "Audit trail retrieved successfully"));
    }
}
