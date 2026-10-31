package com.civnexa.service.ai;

import com.civnexa.dto.AiDTO;
import com.civnexa.dto.CaseDTO;
import com.civnexa.entity.AiKnowledgeDocument;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Deterministic Institutional Rule-Based AI Engine.
 * Operates offline or as a resilient fallback for zero-external-dependency execution.
 */
@Component
public class RuleBasedAiProvider implements AiProvider {

    @Override
    public AiDTO.ClassificationResponse classifyComplaint(String title, String description) {
        String combined = ((title != null ? title : "") + " " + (description != null ? description : "")).toLowerCase();

        String category;
        String department;
        String priority;
        String reasoning;
        double confidence;

        if (containsAny(combined, "ragging", "hazing", "senior", "threat", "force", "humiliation", "hostel bullying")) {
            category = "RAGGING_BULLYING";
            department = "Proctorial Board & Anti-Ragging Committee";
            priority = "CRITICAL";
            reasoning = "Detected high-severity keywords associated with coercive senior harassment, hazing, or student intimidation.";
            confidence = 0.94;
        } else if (containsAny(combined, "harassment", "stalking", "unwelcome", "gender", "inappropriate message", "molestation", "icc")) {
            category = "HARASSMENT_DISCRIMINATION";
            department = "Internal Complaints Committee (ICC)";
            priority = "CRITICAL";
            reasoning = "Identified statutory gender sensitivity, discrimination, or personal integrity grievance terms.";
            confidence = 0.96;
        } else if (containsAny(combined, "plagiarism", "cheating", "exam", "copying", "assignment", "quiz", "paper", "grading", "proctor", "test")) {
            category = "ACADEMIC_INTEGRITY";
            department = "Computer Science & Engineering";
            priority = containsAny(combined, "exam", "quiz", "end-semester") ? "HIGH" : "MEDIUM";
            reasoning = "Identified evaluation, assignment authenticity, or proctored examination integrity keywords.";
            confidence = 0.91;
        } else if (containsAny(combined, "room", "hostel", "mess", "food", "water", "electricity", "washroom", "wifi", "ac", "maintenance", "gym")) {
            category = "FACILITIES_INFRASTRUCTURE";
            department = "Campus Facilities & Student Housing";
            priority = containsAny(combined, "water", "electricity", "urgent") ? "HIGH" : "LOW";
            reasoning = "Categorized under university residential facilities and campus infrastructure maintenance.";
            confidence = 0.88;
        } else if (containsAny(combined, "gate", "curfew", "security", "guard", "id card", "trespass", "theft", "stolen", "lost")) {
            category = "CAMPUS_SAFETY";
            department = "Campus Security & Student Housing";
            priority = "HIGH";
            reasoning = "Matched campus physical security, entry-gate access, or personal property incident patterns.";
            confidence = 0.89;
        } else {
            category = "GENERAL_MISCONDUCT";
            department = "Student Affairs & Administration";
            priority = "MEDIUM";
            reasoning = "General campus conduct grievance categorized using standard administrative triage guidelines.";
            confidence = 0.82;
        }

        String summary = generateSnippet(description, 180);

        return new AiDTO.ClassificationResponse(category, department, priority, summary, confidence, reasoning);
    }

    @Override
    public AiDTO.CaseSummaryResponse summarizeCase(CaseDTO.DetailResponse caseDetail) {
        AiDTO.CaseSummaryResponse resp = new AiDTO.CaseSummaryResponse();
        if (caseDetail == null) return resp;

        resp.setCaseNumber(caseDetail.getCaseNumber());
        resp.setCaseTitle(caseDetail.getTitle());

        StringBuilder synopsis = new StringBuilder();
        synopsis.append("Case ").append(caseDetail.getCaseNumber()).append(" recorded under category ")
                .append(caseDetail.getCategory()).append(" with current status ")
                .append(caseDetail.getStatus()).append(". ");
        synopsis.append("Core incident description: \"").append(generateSnippet(caseDetail.getSummary(), 220)).append("\". ");

        List<String> keyFindings = new ArrayList<>();
        keyFindings.add("Primary Category: " + caseDetail.getCategory() + " [Source: Initial Case Record]");
        keyFindings.add("Assigned Priority: " + caseDetail.getPriority() + " [Source: Intake Triage]");

        if (caseDetail.getAssignedTo() != null) {
            keyFindings.add("Investigating Authority: " + caseDetail.getAssignedTo().getName() + " (" + caseDetail.getAssignedTo().getRole() + ") [Source: Assignment Docket]");
        }

        List<String> citations = new ArrayList<>();
        citations.add("[Source Ref #1: Incident Report Docket - " + caseDetail.getCaseNumber() + "]");

        if (caseDetail.getInvestigationNotes() != null && !caseDetail.getInvestigationNotes().isEmpty()) {
            int noteCount = caseDetail.getInvestigationNotes().size();
            keyFindings.add("Active Evidence & Notes: " + noteCount + " formal proctorial investigation notes recorded on docket.");
            citations.add("[Source Ref #2: Investigation Notes Log (count=" + noteCount + ")]");
        }

        if (caseDetail.getResponses() != null && !caseDetail.getResponses().isEmpty()) {
            keyFindings.add("Student Defense: Formal defense statement submitted and confirmed by respondent.");
            citations.add("[Source Ref #3: Respondent Statement Verification]");
        }

        List<String> timeline = new ArrayList<>();
        timeline.add("Incident Reported on " + (caseDetail.getCreatedAt() != null ? caseDetail.getCreatedAt().toString() : "Record Creation"));
        timeline.add("Current Administrative State: " + caseDetail.getStatus());

        resp.setSummary(synopsis.toString());
        resp.setKeyFindings(keyFindings);
        resp.setTimelineHighlights(timeline);
        resp.setCitations(citations);

        return resp;
    }

    @Override
    public List<AiDTO.DuplicateMatch> findDuplicates(String title, String description, List<CaseDTO.DetailResponse> existingCases, Long excludeCaseId) {
        List<AiDTO.DuplicateMatch> matches = new ArrayList<>();
        if (existingCases == null || existingCases.isEmpty()) return matches;

        Set<String> queryWords = extractSignificantWords(title + " " + description);
        if (queryWords.isEmpty()) return matches;

        for (CaseDTO.DetailResponse c : existingCases) {
            if (excludeCaseId != null && Objects.equals(c.getId(), excludeCaseId)) continue;

            Set<String> targetWords = extractSignificantWords(c.getTitle() + " " + (c.getSummary() != null ? c.getSummary() : ""));
            if (targetWords.isEmpty()) continue;

            Set<String> intersection = new HashSet<>(queryWords);
            intersection.retainAll(targetWords);

            Set<String> union = new HashSet<>(queryWords);
            union.addAll(targetWords);

            double jaccard = (double) intersection.size() / union.size();
            int score = (int) Math.min(100, Math.round(jaccard * 100 * 1.5));

            if (score >= 25 || intersection.size() >= 4) {
                List<String> snippets = intersection.stream().limit(5).map(w -> "Matched concept: '" + w + "'").collect(Collectors.toList());
                matches.add(new AiDTO.DuplicateMatch(
                        c.getId(),
                        c.getCaseNumber(),
                        c.getTitle(),
                        score,
                        snippets,
                        c.getStatus() != null ? c.getStatus().name() : "RECORDED",
                        c.getCreatedAt()
                ));
            }
        }

        matches.sort((a, b) -> Integer.compare(b.getSimilarityScore(), a.getSimilarityScore()));
        return matches.stream().limit(5).collect(Collectors.toList());
    }

    @Override
    public AiDTO.AskAssistantResponse queryInstitutionalKnowledge(String question, List<AiKnowledgeDocument> documents) {
        AiDTO.AskAssistantResponse resp = new AiDTO.AskAssistantResponse();
        resp.setQuestion(question);

        if (question == null || question.trim().isEmpty() || documents == null || documents.isEmpty()) {
            resp.setGrounded(false);
            resp.setAnswer("This question cannot be answered based on the provided institutional documents. Please contact the Office of Student Affairs or consult university administrative circulars.");
            return resp;
        }

        Set<String> queryTerms = extractSignificantWords(question);
        AiKnowledgeDocument bestDoc = null;
        String bestParagraph = null;
        int maxMatches = 0;

        for (AiKnowledgeDocument doc : documents) {
            String[] paragraphs = doc.getContent().split("\\n\\n+");
            for (String p : paragraphs) {
                Set<String> pTerms = extractSignificantWords(p);
                Set<String> intersection = new HashSet<>(queryTerms);
                intersection.retainAll(pTerms);
                if (intersection.size() > maxMatches) {
                    maxMatches = intersection.size();
                    bestDoc = doc;
                    bestParagraph = p.trim();
                }
            }
        }

        if (bestDoc == null || maxMatches < 2 || bestParagraph == null) {
            resp.setGrounded(false);
            resp.setAnswer("This question cannot be answered based on the provided institutional documents. No verified university policy sections directly address this specific inquiry.");
            return resp;
        }

        resp.setGrounded(true);
        resp.setAnswer(bestParagraph);

        AiDTO.SourceCitation citation = new AiDTO.SourceCitation();
        citation.setDocumentTitle(bestDoc.getTitle());
        citation.setSection(bestDoc.getCategory());
        citation.setExcerpt(generateSnippet(bestParagraph, 160));
        resp.getCitations().add(citation);

        return resp;
    }

    private boolean containsAny(String text, String... words) {
        if (text == null) return false;
        for (String w : words) {
            if (text.contains(w.toLowerCase())) return true;
        }
        return false;
    }

    private String generateSnippet(String text, int maxLen) {
        if (text == null) return "";
        String cleaned = text.replaceAll("\\s+", " ").trim();
        if (cleaned.length() <= maxLen) return cleaned;
        return cleaned.substring(0, maxLen - 3) + "...";
    }

    private Set<String> extractSignificantWords(String text) {
        if (text == null) return Collections.emptySet();
        Set<String> stopWords = Set.of("the", "and", "or", "to", "in", "a", "of", "for", "with", "is", "was", "at", "by", "from", "on", "this", "that", "it");
        return Arrays.stream(text.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").split("\\s+"))
                .filter(w -> w.length() > 2 && !stopWords.contains(w))
                .collect(Collectors.toSet());
    }
}
