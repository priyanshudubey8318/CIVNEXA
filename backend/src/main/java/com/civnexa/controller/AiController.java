package com.civnexa.controller;

import com.civnexa.dto.AiDTO;
import com.civnexa.dto.ApiResponse;
import com.civnexa.entity.User;
import com.civnexa.security.CivnexaUserPrincipal;
import com.civnexa.service.AiService;
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
@RequestMapping({"/ai", "/api/v1/ai"})
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/classify")
    public ResponseEntity<ApiResponse<AiDTO.ClassificationResponse>> classifyComplaint(
            @Valid @RequestBody AiDTO.ClassificationRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        AiDTO.ClassificationResponse response = aiService.classifyComplaint(request, caller);
        return ResponseEntity.ok(ApiResponse.ok(response, "Complaint analysis and classification generated"));
    }

    @PostMapping("/summarize-case/{caseId}")
    public ResponseEntity<ApiResponse<AiDTO.CaseSummaryResponse>> summarizeCase(
            @PathVariable Long caseId,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        AiDTO.CaseSummaryResponse response = aiService.summarizeCase(caseId, caller);
        return ResponseEntity.ok(ApiResponse.ok(response, "Case summary generated successfully"));
    }

    @PostMapping("/detect-duplicates")
    public ResponseEntity<ApiResponse<List<AiDTO.DuplicateMatch>>> detectDuplicates(
            @Valid @RequestBody AiDTO.DuplicateCheckRequest request) {
        List<AiDTO.DuplicateMatch> matches = aiService.detectDuplicates(request);
        String message = matches.isEmpty() ? "No duplicate cases detected" : "Potential duplicate cases detected for review";
        return ResponseEntity.ok(ApiResponse.ok(matches, message));
    }

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<AiDTO.AskAssistantResponse>> askAssistant(
            @Valid @RequestBody AiDTO.AskAssistantRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        AiDTO.AskAssistantResponse response = aiService.askAssistant(request, caller);
        return ResponseEntity.ok(ApiResponse.ok(response, "Assistant query processed"));
    }

    @GetMapping("/knowledge")
    public ResponseEntity<ApiResponse<List<AiDTO.KnowledgeDocumentDTO>>> getKnowledgeDocuments() {
        List<AiDTO.KnowledgeDocumentDTO> documents = aiService.getKnowledgeDocuments();
        return ResponseEntity.ok(ApiResponse.ok(documents, "Knowledge documents retrieved successfully"));
    }

    @PostMapping(value = "/knowledge/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD')")
    public ResponseEntity<ApiResponse<AiDTO.KnowledgeDocumentDTO>> uploadKnowledgeDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "category", defaultValue = "POLICY") String category,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        AiDTO.KnowledgeDocumentDTO dto = aiService.uploadKnowledgeDocument(file, title, category, caller);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(dto, "Knowledge document uploaded and indexed successfully"));
    }
}
