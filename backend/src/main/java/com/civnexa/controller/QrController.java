package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.QrDTO;
import com.civnexa.entity.User;
import com.civnexa.security.CivnexaUserPrincipal;
import com.civnexa.service.QrService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/qr", "/api/v1/qr"})
public class QrController {

    private final QrService qrService;

    public QrController(QrService qrService) {
        this.qrService = qrService;
    }

    // =========================================================================
    // 1. STUDENT IDENTITY QR
    // =========================================================================

    @GetMapping("/student-card")
    public ResponseEntity<ApiResponse<QrDTO.StudentCardResponse>> getStudentCard(
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        QrDTO.StudentCardResponse card = qrService.getOrCreateStudentCard(caller);
        return ResponseEntity.ok(ApiResponse.ok(card, "Student digital identity card retrieved"));
    }

    @PostMapping("/verify-student")
    public ResponseEntity<ApiResponse<QrDTO.StudentIdVerificationResponse>> verifyStudentQr(
            @RequestBody Map<String, String> body) {
        String qrToken = body != null ? body.get("qrToken") : null;
        QrDTO.StudentIdVerificationResponse response = qrService.verifyStudentQr(qrToken);
        return ResponseEntity.ok(ApiResponse.ok(response, response.getMessage()));
    }

    @PostMapping("/revoke-student/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD')")
    public ResponseEntity<ApiResponse<Void>> revokeStudentQr(
            @PathVariable Long userId,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        qrService.revokeStudentQr(userId, caller);
        return ResponseEntity.ok(ApiResponse.ok(null, "Student digital QR token revoked successfully"));
    }

    @PostMapping("/reissue-student/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD')")
    public ResponseEntity<ApiResponse<QrDTO.StudentCardResponse>> reissueStudentQr(
            @PathVariable Long userId,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        QrDTO.StudentCardResponse response = qrService.reissueStudentQr(userId, caller);
        return ResponseEntity.ok(ApiResponse.ok(response, "Student digital QR token reissued successfully"));
    }

    // =========================================================================
    // 2. DYNAMIC ATTENDANCE QR SESSIONS
    // =========================================================================

    @PostMapping("/attendance/sessions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD', 'FACULTY', 'STAFF', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<QrDTO.AttendanceSessionResponse>> createAttendanceSession(
            @Valid @RequestBody QrDTO.AttendanceSessionCreateRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        QrDTO.AttendanceSessionResponse response = qrService.createAttendanceSession(request, caller);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Dynamic attendance session created with code " + response.getSessionCode()));
    }

    @GetMapping("/attendance/sessions/{sessionCode}/live")
    public ResponseEntity<ApiResponse<QrDTO.AttendanceSessionResponse>> getSessionLiveChallenge(
            @PathVariable String sessionCode) {
        QrDTO.AttendanceSessionResponse response = qrService.getSessionChallenge(sessionCode);
        return ResponseEntity.ok(ApiResponse.ok(response, "Live attendance QR challenge retrieved"));
    }

    @PostMapping("/attendance/sessions/{sessionCode}/check-in")
    public ResponseEntity<ApiResponse<QrDTO.AttendanceCheckInResponse>> checkInAttendance(
            @PathVariable String sessionCode,
            @Valid @RequestBody QrDTO.AttendanceCheckInRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        QrDTO.AttendanceCheckInResponse response = qrService.checkInAttendance(sessionCode, request.getChallengeToken(), caller);
        return ResponseEntity.ok(ApiResponse.ok(response, response.getMessage()));
    }

    @GetMapping("/attendance/sessions/{sessionCode}/records")
    public ResponseEntity<ApiResponse<List<QrDTO.AttendanceRecordItem>>> getSessionRecords(
            @PathVariable String sessionCode,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        List<QrDTO.AttendanceRecordItem> records = qrService.getSessionRecords(sessionCode, caller);
        return ResponseEntity.ok(ApiResponse.ok(records, "Attendance records retrieved successfully"));
    }

    @PostMapping("/attendance/sessions/{sessionCode}/close")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD', 'FACULTY', 'STAFF', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<Void>> closeAttendanceSession(
            @PathVariable String sessionCode,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        qrService.closeAttendanceSession(sessionCode, caller);
        return ResponseEntity.ok(ApiResponse.ok(null, "Attendance session closed"));
    }

    // =========================================================================
    // 3. CASE TRACKING QR
    // =========================================================================

    @GetMapping("/case/{caseId}/token")
    public ResponseEntity<ApiResponse<Map<String, String>>> getCaseTrackingToken(
            @PathVariable Long caseId,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        String token = qrService.getOrCreateCaseTrackingQr(caseId, caller);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("qrTrackingToken", token), "Case tracking QR token retrieved"));
    }

    @PostMapping("/case/verify")
    public ResponseEntity<ApiResponse<QrDTO.CaseQrVerifyResponse>> verifyCaseQr(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        String token = body != null ? body.get("token") : null;
        User caller = principal != null ? principal.getUser() : null;
        QrDTO.CaseQrVerifyResponse response = qrService.verifyCaseQr(token, caller);
        return ResponseEntity.ok(ApiResponse.ok(response, response.getMessage()));
    }

    // =========================================================================
    // 4. EVIDENCE CUSTODY QR
    // =========================================================================

    @GetMapping("/evidence/{evidenceId}/token")
    public ResponseEntity<ApiResponse<Map<String, String>>> getEvidenceCustodyToken(
            @PathVariable Long evidenceId,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        String token = qrService.getOrCreateEvidenceCustodyQr(evidenceId, caller);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("qrCustodyToken", token), "Evidence custody QR token retrieved"));
    }

    @PostMapping("/evidence/verify")
    public ResponseEntity<ApiResponse<QrDTO.EvidenceCustodyResponse>> verifyEvidenceCustody(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        String token = body != null ? body.get("token") : null;
        User caller = principal != null ? principal.getUser() : null;
        QrDTO.EvidenceCustodyResponse response = qrService.verifyEvidenceCustody(token, caller);
        return ResponseEntity.ok(ApiResponse.ok(response, response.getMessage()));
    }

    @PostMapping("/evidence/custody-action")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD', 'FACULTY', 'STAFF', 'COORDINATOR', 'COMMITTEE_MEMBER')")
    public ResponseEntity<ApiResponse<QrDTO.EvidenceCustodyResponse>> recordEvidenceCustodyAction(
            @RequestParam("token") String token,
            @Valid @RequestBody QrDTO.EvidenceCustodyActionRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User caller = principal != null ? principal.getUser() : null;
        QrDTO.EvidenceCustodyResponse response = qrService.recordEvidenceCustodyAction(token, request, caller);
        return ResponseEntity.ok(ApiResponse.ok(response, "Evidence custody action logged successfully"));
    }
}
