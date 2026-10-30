package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.CaseDTO;
import com.civnexa.entity.User;
import com.civnexa.security.CivnexaUserPrincipal;
import com.civnexa.service.CaseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/cases", "/api/v1/cases"})
public class CaseController {

    private final CaseService caseService;

    public CaseController(CaseService caseService) {
        this.caseService = caseService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CaseDTO.DetailResponse>> createCase(
            @Valid @RequestBody CaseDTO.CreateRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User reporter = principal != null ? principal.getUser() : null;
        CaseDTO.DetailResponse response = caseService.createCase(request, reporter);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Case recorded successfully with reference " + response.getCaseNumber()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CaseDTO.DetailResponse>>> getCases(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        Page<CaseDTO.DetailResponse> page = caseService.getAllCases(pageable, caller);
        return ResponseEntity.ok(ApiResponse.ok(page, "Cases retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CaseDTO.DetailResponse>> getCaseById(
            @PathVariable Long id,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        CaseDTO.DetailResponse response = caseService.getCaseById(id, caller);
        return ResponseEntity.ok(ApiResponse.ok(response, "Case retrieved successfully"));
    }

    @RequestMapping(value = "/{id}/status", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD', 'COORDINATOR', 'COMMITTEE_MEMBER')")
    public ResponseEntity<ApiResponse<CaseDTO.DetailResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody CaseDTO.StatusUpdateRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        CaseDTO.DetailResponse response = caseService.updateStatus(id, request, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "Case status updated successfully"));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<CaseDTO.DetailResponse>> assignCase(
            @PathVariable Long id,
            @Valid @RequestBody CaseDTO.AssignmentRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        CaseDTO.DetailResponse response = caseService.assignCase(id, request, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "Case assigned successfully"));
    }

    @PostMapping("/{id}/notes")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD', 'COORDINATOR', 'FACULTY', 'STAFF', 'COMMITTEE_MEMBER')")
    public ResponseEntity<ApiResponse<CaseDTO.DetailResponse>> addNote(
            @PathVariable Long id,
            @Valid @RequestBody CaseDTO.NoteRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        CaseDTO.DetailResponse response = caseService.addInvestigationNote(id, request, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "Investigation note recorded"));
    }

    @PostMapping("/{id}/responses")
    public ResponseEntity<ApiResponse<CaseDTO.DetailResponse>> submitResponse(
            @PathVariable Long id,
            @Valid @RequestBody CaseDTO.ResponseRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User student = principal != null ? principal.getUser() : null;
        CaseDTO.DetailResponse response = caseService.submitStudentResponse(id, request, student);
        return ResponseEntity.ok(ApiResponse.ok(response, "Student response recorded"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<CaseDTO.StatsResponse>> getStats() {
        CaseDTO.StatsResponse stats = caseService.getStats();
        return ResponseEntity.ok(ApiResponse.ok(stats, "Case statistics retrieved"));
    }
}
