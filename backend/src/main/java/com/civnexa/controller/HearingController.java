package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.HearingDTO;
import com.civnexa.entity.User;
import com.civnexa.security.CivnexaUserPrincipal;
import com.civnexa.service.HearingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/hearings", "/api/v1/hearings"})
public class HearingController {

    private final HearingService hearingService;

    public HearingController(HearingService hearingService) {
        this.hearingService = hearingService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD', 'COORDINATOR', 'COMMITTEE_MEMBER')")
    public ResponseEntity<ApiResponse<HearingDTO.Response>> scheduleHearing(
            @Valid @RequestBody HearingDTO.ScheduleRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User scheduler = principal != null ? principal.getUser() : null;
        HearingDTO.Response response = hearingService.scheduleHearing(request, scheduler);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Hearing scheduled successfully under " + response.getHearingNumber()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HearingDTO.Response>>> getHearings(
            @RequestParam(value = "caseId", required = false) Long caseId) {
        List<HearingDTO.Response> list = hearingService.getHearings(caseId);
        return ResponseEntity.ok(ApiResponse.ok(list, "Hearings retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HearingDTO.Response>> getHearingById(@PathVariable Long id) {
        HearingDTO.Response response = hearingService.getHearingById(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Hearing details retrieved"));
    }

    @RequestMapping(value = "/{id}", method = {RequestMethod.PUT, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD', 'COORDINATOR', 'COMMITTEE_MEMBER')")
    public ResponseEntity<ApiResponse<HearingDTO.Response>> updateHearing(
            @PathVariable Long id,
            @RequestBody HearingDTO.UpdateRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        HearingDTO.Response response = hearingService.updateHearing(id, request, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "Hearing updated successfully"));
    }
}
