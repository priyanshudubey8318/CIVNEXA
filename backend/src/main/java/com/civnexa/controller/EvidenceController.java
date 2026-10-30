package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.EvidenceDTO;
import com.civnexa.entity.User;
import com.civnexa.security.CivnexaUserPrincipal;
import com.civnexa.service.EvidenceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping({"/evidence", "/api/v1/evidence"})
public class EvidenceController {

    private final EvidenceService evidenceService;

    public EvidenceController(EvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EvidenceDTO.Response>> uploadEvidence(
            @RequestParam("caseId") Long caseId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User uploader = principal != null ? principal.getUser() : null;
        EvidenceDTO.Response response = evidenceService.uploadEvidence(caseId, file, uploader);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Evidence securely vaulted under reference " + response.getEvidenceReference()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EvidenceDTO.Response>>> getEvidenceByCase(
            @RequestParam("caseId") Long caseId) {
        List<EvidenceDTO.Response> list = evidenceService.getEvidenceByCase(caseId);
        return ResponseEntity.ok(ApiResponse.ok(list, "Evidence list retrieved"));
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD', 'COORDINATOR', 'COMMITTEE_MEMBER')")
    public ResponseEntity<ApiResponse<EvidenceDTO.Response>> reviewEvidence(
            @PathVariable Long id,
            @Valid @RequestBody EvidenceDTO.ReviewRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User reviewer = principal != null ? principal.getUser() : null;
        EvidenceDTO.Response response = evidenceService.reviewEvidence(id, request, reviewer);
        return ResponseEntity.ok(ApiResponse.ok(response, "Evidence review status updated"));
    }

    @GetMapping("/{id}/custody-logs")
    public ResponseEntity<ApiResponse<List<EvidenceDTO.CustodyLogItem>>> getCustodyLogs(
            @PathVariable Long id) {
        List<EvidenceDTO.CustodyLogItem> logs = evidenceService.getCustodyLogs(id);
        return ResponseEntity.ok(ApiResponse.ok(logs, "Chain of custody log retrieved"));
    }
}
