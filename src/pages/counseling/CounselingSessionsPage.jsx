import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarHeart,
  Clock,
  UserCheck,
  Plus,
  CheckCircle,
  Calendar,
  AlertTriangle,
  FileText,
  User,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/feedback/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import counselingService from '../../services/counselingService';

export const CounselingSessionsPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Attendance & Notes Modal State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('ATTENDED');
  const [sessionStatus, setSessionStatus] = useState('COMPLETED');
  const [sessionNotes, setSessionNotes] = useState('');
  const [followupRequired, setFollowupRequired] = useState(false);
  const [followupDate, setFollowupDate] = useState('2026-10-30');

  // Schedule Session Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [targetReferralId, setTargetReferralId] = useState('');
  const [sessionDate, setSessionDate] = useState('2026-10-26');
  const [sessionTime, setSessionTime] = useState('11:00');
  const [sessionVenue, setSessionVenue] = useState('Counseling Center, Suite B');
  const [sessionType, setSessionType] = useState('Behavioral Support & Reflection');
  const [scheduleNotes, setScheduleNotes] = useState('');

  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const items = await counselingService.getReferrals({
        status: statusFilter,
        searchQuery,
        currentUser,
      });
      setReferrals(items);
    } catch (err) {
      toast.error('Unable to load counseling records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, searchQuery, currentUser]);

  const openAttendanceModal = (ref, session) => {
    setSelectedReferral(ref);
    setSelectedSession(session);
    setAttendanceStatus(session.attendanceStatus === 'SCHEDULED' ? 'ATTENDED' : session.attendanceStatus);
    setSessionStatus(session.sessionStatus === 'SCHEDULED' ? 'COMPLETED' : session.sessionStatus);
    setSessionNotes(session.summary || '');
    setFollowupRequired(session.followupRequired || false);
    setFollowupDate(session.followupDate || '2026-10-30');
    setIsAttendanceModalOpen(true);
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!selectedReferral || !selectedSession) return;
    if (!sessionNotes || sessionNotes.trim().length < 5) {
      toast.error('Session observation notes must be at least 5 characters.');
      return;
    }

    setIsActionLoading(true);
    try {
      await counselingService.recordSessionAttendance(selectedReferral.id, selectedSession.id, {
        attendanceStatus,
        sessionStatus,
        summary: sessionNotes,
        followupRequired,
        followupDate: followupRequired ? followupDate : null,
        counselor: currentUser,
      });
      toast.success('Counseling session attendance and notes recorded.');
      setIsAttendanceModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to record session.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openScheduleModal = (referralId = '') => {
    setTargetReferralId(referralId || (referrals[0]?.id || ''));
    setSessionDate('2026-10-26');
    setSessionTime('11:00');
    setSessionVenue('Counseling Center, Suite B');
    setSessionType('Behavioral Support & Reflection');
    setScheduleNotes('');
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    if (!targetReferralId || !sessionDate || !sessionTime) {
      toast.error('Referral, date, and time are required.');
      return;
    }

    setIsActionLoading(true);
    try {
      await counselingService.scheduleSession(targetReferralId, {
        date: sessionDate,
        time: sessionTime,
        venue: sessionVenue,
        counselor: currentUser?.name || 'Pooja Nambiar',
        type: sessionType,
        notes: scheduleNotes,
      });
      toast.success('New counseling session successfully scheduled.');
      setIsScheduleModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule session.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Extract all sessions across referrals
  const allSessions = [];
  referrals.forEach((ref) => {
    (ref.sessions || []).forEach((sess) => {
      allSessions.push({
        ...sess,
        referralId: ref.id,
        caseNumber: ref.caseNumber,
        studentName: ref.studentName,
        studentRoll: ref.studentRoll,
        studentDepartment: ref.studentDepartment,
        referralReason: ref.reason,
      });
    });
  });

  return (
    <AnimatedPage>
      <PageHeader
        title="Student Counseling & Mentorship Sessions"
        subtitle="Individual behavioral interventions, pastoral support records, and clinical welfare appointment management."
        breadcrumbs={[{ label: 'Counseling' }, { label: 'Active Sessions' }]}
        badge={
          <span className="badge bg-success-subtle text-success border px-2 py-1 d-inline-flex align-items-center gap-1.5">
            <CalendarHeart size={13} />
            <span>{referrals.length} Active Referrals</span>
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => openScheduleModal()}
            className="cx-btn cx-btn-teal d-flex align-items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Schedule Session</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="cx-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="cx-input rounded-start-0"
                placeholder="Search referrals by student name, roll number, case ref, or referral reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <select className="cx-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Referral Statuses</option>
              <option value="ACTIVE">Active Referrals</option>
              <option value="SCHEDULED">Intake Scheduled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="cx-card mb-4">
        <div className="cx-card-header d-flex align-items-center justify-content-between">
          <h2 className="h6 mb-0 fw-bold">Active Counseling Appointments & Clinical Logs</h2>
          <span className="small text-muted">{allSessions.length} Total Sessions</span>
        </div>

        <div className="cx-card-body p-0">
          {isLoading ? (
            <div className="p-5 text-center text-muted">
              <div className="spinner-border text-teal mb-3" role="status" />
              <div>Loading counseling appointments...</div>
            </div>
          ) : allSessions.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <CalendarHeart size={36} className="text-muted mb-2 opacity-50 mx-auto" />
              <h3 className="h6 fw-bold text-dark">No appointments available</h3>
              <p className="small text-muted mb-0">Use "Schedule Session" to record a new mentorship appointment.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cx-table">
                <thead>
                  <tr>
                    <th>Student & Department</th>
                    <th>Related Docket</th>
                    <th>Date & Time</th>
                    <th>Session Focus</th>
                    <th>Counselor</th>
                    <th>Attendance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allSessions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="fw-bold text-dark">{s.studentName}</div>
                        <div className="small text-muted font-monospace">{s.studentRoll}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {s.studentDepartment}
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/cases/${s.caseNumber}`}
                          className="cx-font-mono fw-bold text-decoration-none hover-underline text-teal"
                        >
                          {s.caseNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{s.date}</div>
                        <div className="small text-muted">{s.time}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {s.venue}
                        </div>
                      </td>
                      <td>
                        <div className="small fw-semibold text-dark">{s.type}</div>
                        <div className="small text-muted text-truncate" style={{ maxWidth: '200px' }}>
                          {s.summary}
                        </div>
                      </td>
                      <td>
                        <div className="small text-dark">{s.counselor}</div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            s.attendanceStatus === 'ATTENDED'
                              ? 'bg-success-subtle text-success'
                              : s.attendanceStatus === 'MISSED'
                              ? 'bg-danger-subtle text-danger'
                              : 'bg-primary-subtle text-primary'
                          }`}
                        >
                          {s.attendanceStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            s.sessionStatus === 'COMPLETED'
                              ? 'bg-success-subtle text-success'
                              : s.sessionStatus === 'FOLLOW_UP_REQUIRED'
                              ? 'bg-warning-subtle text-warning'
                              : 'bg-light text-dark border'
                          }`}
                        >
                          {s.sessionStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            const ref = referrals.find((r) => r.id === s.referralId);
                            openAttendanceModal(ref, s);
                          }}
                          className="cx-btn cx-btn-outline cx-btn-sm"
                        >
                          Update Notes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Referrals Dossier List */}
      <h2 className="h6 fw-bold text-dark mb-3">Institutional Counseling Referrals ({referrals.length})</h2>
      <div className="row g-3">
        {referrals.map((ref) => (
          <div key={ref.id} className="col-12 col-md-6 col-lg-4">
            <div className="cx-card p-3 h-100 d-flex flex-column justify-content-between border-start border-4 border-success">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="cx-font-mono fw-bold text-dark">{ref.id}</span>
                  <span
                    className={`badge ${
                      ref.status === 'COMPLETED'
                        ? 'bg-success-subtle text-success'
                        : 'bg-primary-subtle text-primary'
                    }`}
                  >
                    {ref.status}
                  </span>
                </div>

                <div className="fw-bold text-dark">{ref.studentName}</div>
                <div className="small text-muted font-monospace mb-1">{ref.studentRoll} • {ref.studentDepartment}</div>

                <div className="small text-muted mb-2">
                  <strong>Referral Reason:</strong> {ref.reason}
                </div>

                <div className="p-2 bg-light rounded text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                  <strong>Confidential Clinical Note:</strong>
                  <div className="mt-0.5">{ref.confidentialNotes}</div>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                <span className="small text-muted">{ref.sessions?.length || 0} Session(s)</span>
                <button
                  type="button"
                  onClick={() => openScheduleModal(ref.id)}
                  className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2"
                >
                  <Plus size={13} />
                  <span>Add Session</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: RECORD ATTENDANCE & CLINICAL NOTES */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Record Session Attendance & Clinical Notes"
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsAttendanceModalOpen(false)}
              className="cx-btn cx-btn-outline"
              disabled={isActionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAttendance}
              className="cx-btn cx-btn-teal"
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Saving...' : 'Save Clinical Record'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveAttendance}>
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label htmlFor="attendance-status-select" className="cx-form-label">
                Attendance <span className="text-danger">*</span>
              </label>
              <select
                id="attendance-status-select"
                className="cx-select"
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value)}
              >
                <option value="ATTENDED">Attended</option>
                <option value="MISSED">Missed / Unexcused</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
            </div>
            <div className="col-6">
              <label htmlFor="session-status-select" className="cx-form-label">
                Session Outcome
              </label>
              <select
                id="session-status-select"
                className="cx-select"
                value={sessionStatus}
                onChange={(e) => setSessionStatus(e.target.value)}
              >
                <option value="COMPLETED">Completed</option>
                <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                <option value="MISSED">Missed</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="session-notes-input" className="cx-form-label">
              Psychologist / Mentor Session Notes <span className="text-danger">*</span>
            </label>
            <textarea
              id="session-notes-input"
              className="cx-input"
              rows={4}
              placeholder="Record therapeutic observations, coping strategies discussed, and behavioral progress..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
            />
            <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
              Restricted visibility: Accessible only to assigned Welfare Coordinator & Dean.
            </div>
          </div>

          <div className="form-check form-switch mb-3">
            <input
              id="followup-check"
              className="form-check-input"
              type="checkbox"
              checked={followupRequired}
              onChange={(e) => setFollowupRequired(e.target.checked)}
            />
            <label className="form-check-label small fw-bold text-dark" htmlFor="followup-check">
              Schedule Follow-up Welfare Check
            </label>
          </div>

          {followupRequired && (
            <div className="mb-3">
              <label htmlFor="followup-date-input" className="cx-form-label">
                Follow-up Target Date
              </label>
              <input
                id="followup-date-input"
                type="date"
                className="cx-input"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
              />
            </div>
          )}
        </form>
      </Modal>

      {/* MODAL 2: SCHEDULE NEW SESSION */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Counseling Appointment"
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="cx-btn cx-btn-outline"
              disabled={isActionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleScheduleSession}
              className="cx-btn cx-btn-teal"
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleScheduleSession}>
          <div className="mb-3">
            <label htmlFor="referral-select" className="cx-form-label">
              Select Student Referral <span className="text-danger">*</span>
            </label>
            <select
              id="referral-select"
              className="cx-select"
              value={targetReferralId}
              onChange={(e) => setTargetReferralId(e.target.value)}
            >
              {referrals.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}: {r.studentName} ({r.studentRoll}) — {r.reason.substring(0, 40)}...
                </option>
              ))}
            </select>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6">
              <label htmlFor="session-date-input" className="cx-form-label">
                Date <span className="text-danger">*</span>
              </label>
              <input
                id="session-date-input"
                type="date"
                className="cx-input"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <div className="col-6">
              <label htmlFor="session-time-input" className="cx-form-label">
                Time <span className="text-danger">*</span>
              </label>
              <input
                id="session-time-input"
                type="time"
                className="cx-input"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="session-venue-input" className="cx-form-label">
              Venue / Suite
            </label>
            <input
              id="session-venue-input"
              type="text"
              className="cx-input"
              value={sessionVenue}
              onChange={(e) => setSessionVenue(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="session-type-input" className="cx-form-label">
              Session Focus / Domain
            </label>
            <input
              id="session-type-input"
              type="text"
              className="cx-input"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </AnimatedPage>
  );
};

export default CounselingSessionsPage;
