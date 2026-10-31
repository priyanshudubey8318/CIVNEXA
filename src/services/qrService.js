import { apiClient } from './apiClient';

export const qrService = {
  /**
   * Fetch authenticated user's digital identity card & QR token
   */
  async getStudentCard() {
    const response = await apiClient.get('/qr/student-card');
    return response.data?.data || response.data;
  },

  /**
   * Verify a scanned student identity QR token
   * @param {string} qrToken
   */
  async verifyStudentQr(qrToken) {
    const response = await apiClient.post('/qr/verify-student', { qrToken });
    return response.data?.data || response.data;
  },

  /**
   * Revoke student QR token (admin/dean authority)
   * @param {number|string} userId
   */
  async revokeStudentQr(userId) {
    const response = await apiClient.post(`/qr/revoke-student/${userId}`);
    return response.data?.data || response.data;
  },

  /**
   * Reissue student QR token (admin/dean authority)
   * @param {number|string} userId
   */
  async reissueStudentQr(userId) {
    const response = await apiClient.post(`/qr/reissue-student/${userId}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a dynamic attendance session (hearings, classes, campus events)
   * @param {{ title: string, eventType: string, caseId?: number, hearingId?: number }} data
   */
  async createAttendanceSession(data) {
    const response = await apiClient.post('/qr/attendance/sessions', data);
    return response.data?.data || response.data;
  },

  /**
   * Retrieve live rotating 60s attendance QR challenge
   * @param {string} sessionCode
   */
  async getSessionChallenge(sessionCode) {
    const response = await apiClient.get(`/qr/attendance/sessions/${sessionCode}/live`);
    return response.data?.data || response.data;
  },

  /**
   * Student check-in via scanned challenge token
   * @param {string} sessionCode
   * @param {string} challengeToken
   */
  async checkInAttendance(sessionCode, challengeToken) {
    const response = await apiClient.post(`/qr/attendance/sessions/${sessionCode}/check-in`, { challengeToken });
    return response.data?.data || response.data;
  },

  /**
   * Retrieve attendance records log for a session
   * @param {string} sessionCode
   */
  async getSessionRecords(sessionCode) {
    const response = await apiClient.get(`/qr/attendance/sessions/${sessionCode}/records`);
    return response.data?.data || response.data;
  },

  /**
   * Conclude and close an attendance session
   * @param {string} sessionCode
   */
  async closeAttendanceSession(sessionCode) {
    const response = await apiClient.post(`/qr/attendance/sessions/${sessionCode}/close`);
    return response.data?.data || response.data;
  },

  /**
   * Retrieve or generate case tracking QR token
   * @param {number|string} caseId
   */
  async getCaseTrackingToken(caseId) {
    const response = await apiClient.get(`/qr/case/${caseId}/token`);
    return response.data?.data?.qrTrackingToken || response.data?.qrTrackingToken;
  },

  /**
   * Verify case tracking QR token
   * @param {string} token
   */
  async verifyCaseQr(token) {
    const response = await apiClient.post('/qr/case/verify', { token });
    return response.data?.data || response.data;
  },

  /**
   * Retrieve or generate evidence custody QR token
   * @param {number|string} evidenceId
   */
  async getEvidenceCustodyToken(evidenceId) {
    const response = await apiClient.get(`/qr/evidence/${evidenceId}/token`);
    return response.data?.data?.qrCustodyToken || response.data?.qrCustodyToken;
  },

  /**
   * Verify evidence custody token & retrieve chain-of-custody audit log
   * @param {string} token
   */
  async verifyEvidenceCustody(token) {
    const response = await apiClient.post('/qr/evidence/verify', { token });
    return response.data?.data || response.data;
  },

  /**
   * Record custody transfer / inspection action via QR scan
   * @param {string} token
   * @param {{ action: string, details?: string }} data
   */
  async recordEvidenceCustodyAction(token, data) {
    const response = await apiClient.post(`/qr/evidence/custody-action?token=${encodeURIComponent(token)}`, data);
    return response.data?.data || response.data;
  },
};
