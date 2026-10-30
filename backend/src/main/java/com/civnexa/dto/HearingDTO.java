package com.civnexa.dto;

import com.civnexa.entity.Hearing;
import com.civnexa.entity.enums.HearingMode;
import com.civnexa.entity.enums.HearingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class HearingDTO {

    public static class ScheduleRequest {
        @NotNull
        private Long caseId;

        @NotNull
        private Long presidingAuthorityId;

        @NotNull
        private LocalDate hearingDate;

        @NotNull
        private LocalTime startTime;

        @NotNull
        private LocalTime endTime;

        @NotBlank
        private String venue;

        private HearingMode hearingMode = HearingMode.IN_PERSON;
        private String remarks;
        private List<Long> committeeMemberIds;

        public Long getCaseId() { return caseId; }
        public void setCaseId(Long caseId) { this.caseId = caseId; }
        public Long getPresidingAuthorityId() { return presidingAuthorityId; }
        public void setPresidingAuthorityId(Long presidingAuthorityId) { this.presidingAuthorityId = presidingAuthorityId; }
        public LocalDate getHearingDate() { return hearingDate; }
        public void setHearingDate(LocalDate hearingDate) { this.hearingDate = hearingDate; }
        public LocalTime getStartTime() { return startTime; }
        public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
        public LocalTime getEndTime() { return endTime; }
        public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
        public String getVenue() { return venue; }
        public void setVenue(String venue) { this.venue = venue; }
        public HearingMode getHearingMode() { return hearingMode; }
        public void setHearingMode(HearingMode hearingMode) { this.hearingMode = hearingMode; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
        public List<Long> getCommitteeMemberIds() { return committeeMemberIds; }
        public void setCommitteeMemberIds(List<Long> committeeMemberIds) { this.committeeMemberIds = committeeMemberIds; }
    }

    public static class UpdateRequest {
        private HearingStatus status;
        private String venue;
        private String remarks;
        private String minutesDraft;
        private String outcome;

        public HearingStatus getStatus() { return status; }
        public void setStatus(HearingStatus status) { this.status = status; }
        public String getVenue() { return venue; }
        public void setVenue(String venue) { this.venue = venue; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
        public String getMinutesDraft() { return minutesDraft; }
        public void setMinutesDraft(String minutesDraft) { this.minutesDraft = minutesDraft; }
        public String getOutcome() { return outcome; }
        public void setOutcome(String outcome) { this.outcome = outcome; }
    }

    public static class Response {
        private Long id;
        private String hearingNumber;
        private Long caseId;
        private String caseNumber;
        private String caseTitle;
        private LocalDate hearingDate;
        private LocalTime startTime;
        private LocalTime endTime;
        private String venue;
        private HearingMode hearingMode;
        private HearingStatus status;
        private String presidingAuthorityName;
        private String schedulerName;
        private String remarks;
        private String minutesDraft;
        private String outcome;
        private Instant createdAt;

        public static Response fromEntity(Hearing hearing) {
            Response dto = new Response();
            dto.setId(hearing.getId());
            dto.setHearingNumber(hearing.getHearingNumber());
            if (hearing.getCaseRecord() != null) {
                dto.setCaseId(hearing.getCaseRecord().getId());
                dto.setCaseNumber(hearing.getCaseRecord().getCaseNumber());
                dto.setCaseTitle(hearing.getCaseRecord().getTitle());
            }
            dto.setHearingDate(hearing.getHearingDate());
            dto.setStartTime(hearing.getStartTime());
            dto.setEndTime(hearing.getEndTime());
            dto.setVenue(hearing.getVenue());
            dto.setHearingMode(hearing.getMode());
            dto.setStatus(hearing.getStatus());
            if (hearing.getPresidingAuthority() != null) {
                dto.setPresidingAuthorityName(hearing.getPresidingAuthority().getName());
            }
            if (hearing.getScheduledBy() != null) {
                dto.setSchedulerName(hearing.getScheduledBy().getName());
            }
            dto.setRemarks(hearing.getRemarks());
            dto.setMinutesDraft(hearing.getMinutesDraft());
            dto.setOutcome(hearing.getOutcome());
            dto.setCreatedAt(hearing.getCreatedAt());
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getHearingNumber() { return hearingNumber; }
        public void setHearingNumber(String hearingNumber) { this.hearingNumber = hearingNumber; }
        public Long getCaseId() { return caseId; }
        public void setCaseId(Long caseId) { this.caseId = caseId; }
        public String getCaseNumber() { return caseNumber; }
        public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
        public String getCaseTitle() { return caseTitle; }
        public void setCaseTitle(String caseTitle) { this.caseTitle = caseTitle; }
        public LocalDate getHearingDate() { return hearingDate; }
        public void setHearingDate(LocalDate hearingDate) { this.hearingDate = hearingDate; }
        public LocalTime getStartTime() { return startTime; }
        public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
        public LocalTime getEndTime() { return endTime; }
        public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
        public String getVenue() { return venue; }
        public void setVenue(String venue) { this.venue = venue; }
        public HearingMode getHearingMode() { return hearingMode; }
        public void setHearingMode(HearingMode hearingMode) { this.hearingMode = hearingMode; }
        public HearingStatus getStatus() { return status; }
        public void setStatus(HearingStatus status) { this.status = status; }
        public String getPresidingAuthorityName() { return presidingAuthorityName; }
        public void setPresidingAuthorityName(String presidingAuthorityName) { this.presidingAuthorityName = presidingAuthorityName; }
        public String getSchedulerName() { return schedulerName; }
        public void setSchedulerName(String schedulerName) { this.schedulerName = schedulerName; }
        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }
        public String getMinutesDraft() { return minutesDraft; }
        public void setMinutesDraft(String minutesDraft) { this.minutesDraft = minutesDraft; }
        public String getOutcome() { return outcome; }
        public void setOutcome(String outcome) { this.outcome = outcome; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    }
}
