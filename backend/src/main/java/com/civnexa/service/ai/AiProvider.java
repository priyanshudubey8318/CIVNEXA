package com.civnexa.service.ai;

import com.civnexa.dto.AiDTO;
import com.civnexa.dto.CaseDTO;
import com.civnexa.entity.AiKnowledgeDocument;

import java.util.List;

public interface AiProvider {

    AiDTO.ClassificationResponse classifyComplaint(String title, String description);

    AiDTO.CaseSummaryResponse summarizeCase(CaseDTO.DetailResponse caseDetail);

    List<AiDTO.DuplicateMatch> findDuplicates(String title, String description, List<CaseDTO.DetailResponse> existingCases, Long excludeCaseId);

    AiDTO.AskAssistantResponse queryInstitutionalKnowledge(String question, List<AiKnowledgeDocument> documents);
}
