package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.CounselingDTO;
import com.civnexa.entity.User;
import com.civnexa.security.CivnexaUserPrincipal;
import com.civnexa.service.CounselingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/counseling", "/api/v1/counseling"})
public class CounselingController {

    private final CounselingService counselingService;

    public CounselingController(CounselingService counselingService) {
        this.counselingService = counselingService;
    }

    @PostMapping("/referrals")
    public ResponseEntity<ApiResponse<CounselingDTO.ReferralResponse>> createReferral(
            @Valid @RequestBody CounselingDTO.CreateReferralRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User referrer = principal != null ? principal.getUser() : null;
        CounselingDTO.ReferralResponse response = counselingService.createReferral(request, referrer);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Counseling referral created under " + response.getReferralNumber()));
    }

    @GetMapping("/referrals")
    public ResponseEntity<ApiResponse<List<CounselingDTO.ReferralResponse>>> getReferrals(
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        List<CounselingDTO.ReferralResponse> list = counselingService.getReferrals(caller);
        return ResponseEntity.ok(ApiResponse.ok(list, "Counseling referrals retrieved"));
    }

    @GetMapping("/referrals/{id}")
    public ResponseEntity<ApiResponse<CounselingDTO.ReferralResponse>> getReferralById(
            @PathVariable Long id,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        CounselingDTO.ReferralResponse response = counselingService.getReferralById(id, caller);
        return ResponseEntity.ok(ApiResponse.ok(response, "Counseling referral retrieved"));
    }

    @PostMapping("/referrals/{id}/assign")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<CounselingDTO.ReferralResponse>> assignCounselor(
            @PathVariable Long id,
            @Valid @RequestBody CounselingDTO.AssignCounselorRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        CounselingDTO.ReferralResponse response = counselingService.assignCounselor(id, request, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "Counselor assigned successfully"));
    }

    @PostMapping("/referrals/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<CounselingDTO.ReferralResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody CounselingDTO.ReferralStatusRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        CounselingDTO.ReferralResponse response = counselingService.updateStatus(id, request, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "Referral status updated"));
    }

    @PostMapping("/referrals/{id}/sessions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COORDINATOR', 'FACULTY', 'STAFF')")
    public ResponseEntity<ApiResponse<CounselingDTO.SessionResponse>> recordSession(
            @PathVariable Long id,
            @Valid @RequestBody CounselingDTO.CreateSessionRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User counselor = principal != null ? principal.getUser() : null;
        CounselingDTO.SessionResponse response = counselingService.createSession(id, request, counselor);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Counseling session recorded successfully"));
    }
}
