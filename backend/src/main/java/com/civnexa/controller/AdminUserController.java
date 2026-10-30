package com.civnexa.controller;

import com.civnexa.dto.AccountDecisionRequest;
import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.ImportResultResponse;
import com.civnexa.dto.UserResponse;
import com.civnexa.entity.User;
import com.civnexa.repository.UserRepository;
import com.civnexa.security.CivnexaUserPrincipal;
import com.civnexa.service.AuthService;
import com.civnexa.service.UserImportService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping({"/admin", "/api/v1/admin"})
public class AdminUserController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserImportService userImportService;

    public AdminUserController(AuthService authService,
                               UserRepository userRepository,
                               UserImportService userImportService) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.userImportService = userImportService;
    }

    /**
     * Lists users pending institutional approval.
     */
    @GetMapping("/registrations/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'COORDINATOR', 'STAFF')")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getPendingRegistrations(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<UserResponse> page = authService.getPendingRegistrations(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page, "Pending registrations retrieved successfully"));
    }

    /**
     * Approves a student registration.
     */
    @PostMapping("/registrations/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<UserResponse>> approveRegistration(
            @PathVariable Long id,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        UserResponse response = authService.approveRegistration(id, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "Student registration approved and account activated"));
    }

    /**
     * Rejects an account registration.
     */
    @PostMapping("/registrations/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<UserResponse>> rejectRegistration(
            @PathVariable Long id,
            @RequestBody(required = false) AccountDecisionRequest decision,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        UserResponse response = authService.rejectRegistration(id, decision, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "Registration rejected successfully"));
    }

    /**
     * Suspends an active user account.
     */
    @PostMapping("/users/{id}/suspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN')")
    public ResponseEntity<ApiResponse<UserResponse>> suspendUser(
            @PathVariable Long id,
            @RequestBody(required = false) AccountDecisionRequest decision,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        UserResponse response = authService.suspendUser(id, decision, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "User account suspended successfully"));
    }

    /**
     * Re-activates a suspended/inactive user account.
     */
    @PostMapping("/users/{id}/activate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN')")
    public ResponseEntity<ApiResponse<UserResponse>> activateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        UserResponse response = authService.activateUser(id, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "User account activated successfully"));
    }

    /**
     * Lists institutional users with pagination.
     */
    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD', 'COORDINATOR', 'STAFF')")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        Page<UserResponse> page = userRepository.findAll(pageable).map(UserResponse::fromEntity);
        return ResponseEntity.ok(ApiResponse.ok(page, "Users retrieved successfully"));
    }

    /**
     * Bulk user import via CSV, Excel (.xlsx), or JSON files.
     */
    @PostMapping(value = "/imports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<ImportResultResponse>> importUsers(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        ImportResultResponse response = userImportService.importUsers(file, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "Bulk user import processed"));
    }
}
