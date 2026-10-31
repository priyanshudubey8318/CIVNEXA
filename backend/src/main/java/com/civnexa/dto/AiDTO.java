package com.civnexa.dto;

import com.civnexa.entity.AiKnowledgeDocument;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AiDTO {

    public static class ClassificationRequest {
        @NotBlank(message = "Complaint title is required")
        private String title;

        @NotBlank(message = "Complaint description is required")
        private String description;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class ClassificationResponse {
        private String suggestedCategory;
        private String suggestedDepartment;
        private String suggestedPriority;
        private String summary;
        private double confidence;
        private String reasoning;
        private boolean humanConfirmationRequired = true;

        public ClassificationResponse() {}

        public ClassificationResponse(String suggestedCategory, String suggestedDepartment, String suggestedPriority, String summary, double confidence, String reasoning) {
            this.suggestedCategory = suggestedCategory;
            this.suggestedDepartment = suggestedDepartment;
            this.suggestedPriority = suggestedPriority;
            this.summary = summary;
            this.confidence = confidence;
            this.reasoning = reasoning;
            this.humanConfirmationRequired = true;
        }

        public String getSuggestedCategory() { return suggestedCategory; }
        public void setSuggestedCategory(String suggestedCategory) { this.suggestedCategory = suggestedCategory; }
        public String getSuggestedDepartment() { return suggestedDepartment; }
        public void setSuggestedDepartment(String suggestedDepartment) { this.suggestedDepartment = suggestedDepartment; }
        public String getSuggestedPriority() { return suggestedPriority; }
        public void setSuggestedPriority(String suggestedPriority) { this.suggestedPriority = suggestedPriority; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
        public String getReasoning() { return reasoning; }
        public void setReasoning(String reasoning) { this.reasoning = reasoning; }
        public boolean isHumanConfirmationRequired() { return humanConfirmationRequired; }
        public void setHumanConfirmationRequired(boolean humanConfirmationRequired) { this.humanConfirmationRequired = humanConfirmationRequired; }
    }

    public static class DuplicateCheckRequest {
        @NotBlank
        private String title;
        @NotBlank
        private String description;
        private Long excludeCaseId;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Long getExcludeCaseId() { return excludeCaseId; }
        public void setExcludeCaseId(Long excludeCaseId) { this.excludeCaseId = excludeCaseId; }
    }

    public static class DuplicateMatch {
        private Long caseId;
        private String caseNumber;
        private String title;
        private int similarityScore;
        private List<String> matchingSnippets = new ArrayList<>();
        private String status;
        private Instant createdAt;

        public DuplicateMatch() {}

        public DuplicateMatch(Long caseId, String caseNumber, String title, int similarityScore, List<String> matchingSnippets, String status, Instant createdAt) {
            this.caseId = caseId;
            this.caseNumber = caseNumber;
            this.title = title;
            this.similarityScore = similarityScore;
            this.matchingSnippets = matchingSnippets;
            this.status = status;
            this.createdAt = createdAt;
        }

        public Long getCaseId() { return caseId; }
        public void setCaseId(Long caseId) { this.caseId = caseId; }
        public String getCaseNumber() { return caseNumber; }
        public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public int getSimilarityScore() { return similarityScore; }
        public void setSimilarityScore(int similarityScore) { this.similarityScore = similarityScore; }
        public List<String> getMatchingSnippets() { return matchingSnippets; }
        public void setMatchingSnippets(List<String> matchingSnippets) { this.matchingSnippets = matchingSnippets; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    }

    public static class CaseSummaryResponse {
        private String caseNumber;
        private String caseTitle;
        private String summary;
        private List<String> keyFindings = new ArrayList<>();
        private List<String> timelineHighlights = new ArrayList<>();
        private List<String> citations = new ArrayList<>();
        private String disclaimers = "AI-generated factual synopsis. Disciplinary decisions are made exclusively by authorized proctorial committees.";

        public CaseSummaryResponse() {}

        public String getCaseNumber() { return caseNumber; }
        public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
        public String getCaseTitle() { return caseTitle; }
        public void setCaseTitle(String caseTitle) { this.caseTitle = caseTitle; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public List<String> getKeyFindings() { return keyFindings; }
        public void setKeyFindings(List<String> keyFindings) { this.keyFindings = keyFindings; }
        public List<String> getTimelineHighlights() { return timelineHighlights; }
        public void setTimelineHighlights(List<String> timelineHighlights) { this.timelineHighlights = timelineHighlights; }
        public List<String> getCitations() { return citations; }
        public void setCitations(List<String> citations) { this.citations = citations; }
        public String getDisclaimers() { return disclaimers; }
        public void setDisclaimers(String disclaimers) { this.disclaimers = disclaimers; }
    }

    public static class AskAssistantRequest {
        @NotBlank(message = "Question cannot be blank")
        @Size(max = 500, message = "Question is limited to 500 characters")
        private String question;

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
    }

    public static class SourceCitation {
        private String documentTitle;
        private String section;
        private String excerpt;

        public SourceCitation() {}

        public SourceCitation(String documentTitle, String section, String excerpt) {
            this.documentTitle = documentTitle;
            this.section = section;
            this.excerpt = excerpt;
        }

        public String getDocumentTitle() { return documentTitle; }
        public void setDocumentTitle(String documentTitle) { this.documentTitle = documentTitle; }
        public String getSection() { return section; }
        public void setSection(String section) { this.section = section; }
        public String getExcerpt() { return excerpt; }
        public void setExcerpt(String excerpt) { this.excerpt = excerpt; }
    }

    public static class AskAssistantResponse {
        private String question;
        private String answer;
        private boolean grounded;
        private List<SourceCitation> citations = new ArrayList<>();
        private String disclaimer = "CIVNEXA Institutional Assistant operates strictly over university regulations and policies.";

        public AskAssistantResponse() {}

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        public String getAnswer() { return answer; }
        public void setAnswer(String answer) { this.answer = answer; }
        public boolean isGrounded() { return grounded; }
        public void setGrounded(boolean grounded) { this.grounded = grounded; }
        public List<SourceCitation> getCitations() { return citations; }
        public void setCitations(List<SourceCitation> citations) { this.citations = citations; }
        public String getDisclaimer() { return disclaimer; }
        public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }
    }

    public static class KnowledgeDocumentDTO {
        private Long id;
        private String documentCode;
        private String title;
        private String category;
        private String sourceFilename;
        private String checksumSha256;
        private Instant createdAt;

        public static KnowledgeDocumentDTO fromEntity(AiKnowledgeDocument entity) {
            KnowledgeDocumentDTO dto = new KnowledgeDocumentDTO();
            dto.setId(entity.getId());
            dto.setDocumentCode(entity.getDocumentCode());
            dto.setTitle(entity.getTitle());
            dto.setCategory(entity.getCategory());
            dto.setSourceFilename(entity.getSourceFilename());
            dto.setChecksumSha256(entity.getChecksumSha256());
            dto.setCreatedAt(entity.getCreatedAt());
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getDocumentCode() { return documentCode; }
        public void setDocumentCode(String documentCode) { this.documentCode = documentCode; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getSourceFilename() { return sourceFilename; }
        public void setSourceFilename(String sourceFilename) { this.sourceFilename = sourceFilename; }
        public String getChecksumSha256() { return checksumSha256; }
        public void setChecksumSha256(String checksumSha256) { this.checksumSha256 = checksumSha256; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    }
}
