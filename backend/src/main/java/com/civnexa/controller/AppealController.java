package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.AppealDTO;
import com.civnexa.entity.User;
import com.civnexa.security.CivnexaUserPrincipal;
import com.civnexa.service.AppealService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/appeals", "/api/v1/appeals"})
public class AppealController {

    private final AppealService appealService;

    public AppealController(AppealService appealService) {
        this.appealService = appealService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AppealDTO.Response>> submitAppeal(
            @Valid @RequestBody AppealDTO.SubmitRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User appellant = principal != null ? principal.getUser() : null;
        AppealDTO.Response response = appealService.submitAppeal(request, appellant);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Appeal lodged successfully under " + response.getAppealNumber()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppealDTO.Response>>> getAppeals(
            @RequestParam(value = "caseId", required = false) Long caseId) {
        List<AppealDTO.Response> list = appealService.getAppeals(caseId);
        return ResponseEntity.ok(ApiResponse.ok(list, "Appeals list retrieved"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppealDTO.Response>> getAppealById(@PathVariable Long id) {
        AppealDTO.Response response = appealService.getAppealById(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Appeal details retrieved"));
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD', 'COMMITTEE_MEMBER')")
    public ResponseEntity<ApiResponse<AppealDTO.Response>> reviewAppeal(
            @PathVariable Long id,
            @Valid @RequestBody AppealDTO.ReviewRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User reviewer = principal != null ? principal.getUser() : null;
        AppealDTO.Response response = appealService.reviewAppeal(id, request, reviewer);
        return ResponseEntity.ok(ApiResponse.ok(response, "Appeal review determination recorded"));
    }
}
