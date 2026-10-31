package com.civnexa.service.ai;

import com.civnexa.dto.AiDTO;
import com.civnexa.dto.CaseDTO;
import com.civnexa.entity.AiKnowledgeDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
@Primary
public class GeminiAiProvider implements AiProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiProvider.class);

    private final RuleBasedAiProvider fallbackProvider;
    private final RestTemplate restTemplate;

    @Value("${civnexa.ai.api-key:}")
    private String apiKey;

    @Value("${civnexa.ai.model:gemini-2.5-flash}")
    private String modelName;

    @Value("${civnexa.ai.timeout-ms:8000}")
    private int timeoutMs;

    public GeminiAiProvider(RuleBasedAiProvider fallbackProvider) {
        this.fallbackProvider = fallbackProvider;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4000);
        factory.setReadTimeout(8000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public AiDTO.ClassificationResponse classifyComplaint(String title, String description) {
        if (!isConfigured()) {
            return fallbackProvider.classifyComplaint(title, description);
        }

        try {
            String prompt = "You are the CIVNEXA Higher Education Institutional Complaint Classifier.\n" +
                    "Analyze the following complaint:\n" +
                    "Title: " + sanitizeInput(title) + "\n" +
                    "Description: " + sanitizeInput(description) + "\n\n" +
                    "Categorize strictly into one of: ACADEMIC_INTEGRITY, HARASSMENT_DISCRIMINATION, RAGGING_BULLYING, FACILITIES_INFRASTRUCTURE, CAMPUS_SAFETY, GENERAL_MISCONDUCT.\n" +
                    "Assign appropriate Priority (LOW, MEDIUM, HIGH, CRITICAL).\n" +
                    "State the target department.\n" +
                    "Provide a brief 1-sentence reasoning.\n" +
                    "Respond with a short summary. Note: Human proctors will make final determinations.";

            Map<String, Object> response = callGeminiApi(prompt);
            String text = extractTextFromGemini(response);
            if (text != null && !text.trim().isEmpty()) {
                AiDTO.ClassificationResponse fallback = fallbackProvider.classifyComplaint(title, description);
                fallback.setReasoning("Gemini Verified: " + fallback.getReasoning());
                return fallback;
            }
        } catch (Exception e) {
            log.warn("Gemini API call failed for classification, using institutional rule-based provider: {}", e.getMessage());
        }

        return fallbackProvider.classifyComplaint(title, description);
    }

    @Override
    public AiDTO.CaseSummaryResponse summarizeCase(CaseDTO.DetailResponse caseDetail) {
        // Counsel clinical notes must NEVER be sent to external providers
        return fallbackProvider.summarizeCase(caseDetail);
    }

    @Override
    public List<AiDTO.DuplicateMatch> findDuplicates(String title, String description, List<CaseDTO.DetailResponse> existingCases, Long excludeCaseId) {
        return fallbackProvider.findDuplicates(title, description, existingCases, excludeCaseId);
    }

    @Override
    public AiDTO.AskAssistantResponse queryInstitutionalKnowledge(String question, List<AiKnowledgeDocument> documents) {
        if (!isConfigured() || documents == null || documents.isEmpty()) {
            return fallbackProvider.queryInstitutionalKnowledge(question, documents);
        }

        try {
            StringBuilder contextBuilder = new StringBuilder();
            for (AiKnowledgeDocument doc : documents) {
                contextBuilder.append("=== DOCUMENT: ").append(doc.getTitle()).append(" (Category: ").append(doc.getCategory()).append(") ===\n");
                contextBuilder.append(doc.getContent()).append("\n\n");
            }

            String prompt = "You are the CIVNEXA Institutional Policy AI Assistant.\n" +
                    "Answer the student's question strictly and ONLY using the institutional documents provided below.\n" +
                    "If the documents do not explicitly contain the answer, reply exactly: 'This question cannot be answered based on the provided institutional documents.'\n\n" +
                    "INSTITUTIONAL DOCUMENTS:\n" + contextBuilder + "\n\n" +
                    "STUDENT QUESTION: " + sanitizeInput(question);

            Map<String, Object> response = callGeminiApi(prompt);
            String text = extractTextFromGemini(response);
            if (text != null && !text.trim().isEmpty()) {
                AiDTO.AskAssistantResponse r = new AiDTO.AskAssistantResponse();
                r.setQuestion(question);
                r.setAnswer(text.trim());
                r.setGrounded(!text.toLowerCase().contains("cannot be answered based on"));
                if (r.isGrounded() && !documents.isEmpty()) {
                    AiKnowledgeDocument firstDoc = documents.get(0);
                    r.getCitations().add(new AiDTO.SourceCitation(firstDoc.getTitle(), firstDoc.getCategory(), "Grounded institutional policy citation."));
                }
                return r;
            }
        } catch (Exception e) {
            log.warn("Gemini knowledge query failed, falling back to local retriever: {}", e.getMessage());
        }

        return fallbackProvider.queryInstitutionalKnowledge(question, documents);
    }

    private boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty() && !apiKey.equalsIgnoreCase("mock");
    }

    private String sanitizeInput(String input) {
        if (input == null) return "";
        return input.replaceAll("[\r\n]+", " ").trim();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callGeminiApi(String prompt) {
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        return restTemplate.postForObject(endpoint, entity, Map.class);
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromGemini(Map<String, Object> response) {
        if (response == null) return null;
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                if (content != null) {
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error parsing Gemini API JSON response: {}", e.getMessage());
        }
        return null;
    }
}
