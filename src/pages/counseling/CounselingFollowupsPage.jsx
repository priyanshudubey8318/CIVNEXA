import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  UserCheck,
  CalendarHeart,
  AlertCircle,
  Search,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/feedback/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import counselingService from '../../services/counselingService';

export const CounselingFollowupsPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Complete Followup Modal
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadFollowups = async () => {
    setIsLoading(true);
    try {
      const items = await counselingService.getReferrals({
        currentUser,
        searchQuery,
      });
      setReferrals(items);
    } catch (err) {
      toast.error('Unable to load follow-up records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFollowups();
  }, [searchQuery, currentUser]);

  const allFollowups = [];
  referrals.forEach((ref) => {
    (ref.followups || []).forEach((fw) => {
      allFollowups.push({
        ...fw,
        referralId: ref.id,
        caseNumber: ref.caseNumber,
        studentName: ref.studentName,
        studentRoll: ref.studentRoll,
        studentDepartment: ref.studentDepartment,
      });
    });
  });

  const openCompleteModal = (fw) => {
    const parentRef = referrals.find((r) => r.id === fw.referralId);
    setSelectedReferral(parentRef);
    setSelectedFollowup(fw);
    setOutcomeNotes(fw.outcome || '');
    setIsCompleteModalOpen(true);
  };

  const handleCompleteFollowup = async (e) => {
    e.preventDefault();
    if (!selectedReferral || !selectedFollowup) return;
    if (!outcomeNotes || outcomeNotes.trim().length < 5) {
      toast.error('Outcome notes must be at least 5 characters.');
      return;
    }

    setIsActionLoading(true);
    try {
      await counselingService.completeFollowup(selectedReferral.id, selectedFollowup.id, {
        outcomeNotes,
        counselor: currentUser,
      });
      toast.success('Follow-up check completed and logged.');
      setIsCompleteModalOpen(false);
      loadFollowups();
    } catch (err) {
      toast.error(err.message || 'Failed to complete follow-up.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const pendingCount = allFollowups.filter((f) => f.status === 'PENDING').length;

  return (
    <AnimatedPage>
      <PageHeader
        title="Student Welfare Follow-ups & Monitoring Log"
        subtitle="Continued pastoral tracking, post-session compliance checks, and rehabilitation milestones."
        breadcrumbs={[{ label: 'Counseling' }, { label: 'Welfare Follow-ups' }]}
        badge={
          <span className="badge bg-warning-subtle text-warning border px-2 py-1 d-inline-flex align-items-center gap-1.5">
            <ClipboardList size={13} />
            <span>{pendingCount} Pending Follow-ups</span>
          </span>
        }
      />

      {/* Filter and Search Bar */}
      <div className="cx-card p-3 mb-4">
        <div className="input-group">
          <span className="input-group-text bg-white">
            <Search size={16} className="text-muted" />
          </span>
          <input
            type="text"
            className="cx-input rounded-start-0"
            placeholder="Search follow-ups by student name, roll number, case ref, or check objective..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Follow-ups Table */}
      <div className="cx-card">
        <div className="cx-card-header d-flex align-items-center justify-content-between">
          <h2 className="h6 mb-0 fw-bold">Monitoring & Rehabilitation Milestones ({allFollowups.length})</h2>
          <span className="small text-muted">{pendingCount} Active</span>
        </div>

        <div className="cx-card-body p-0">
          {isLoading ? (
            <div className="p-5 text-center text-muted">
              <div className="spinner-border text-teal mb-3" role="status" />
              <div>Loading welfare follow-ups...</div>
            </div>
          ) : allFollowups.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <CheckCircle2 size={36} className="text-success mb-2 mx-auto" />
              <h3 className="h6 fw-bold text-dark">No Follow-ups Pending</h3>
              <p className="small text-muted mb-0">All student welfare checks are currently up to date.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cx-table">
                <thead>
                  <tr>
                    <th>Student & Roll</th>
                    <th>Docket</th>
                    <th>Due Date</th>
                    <th>Check Objective</th>
                    <th>Status</th>
                    <th>Outcome / Result</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allFollowups.map((fw) => (
                    <tr key={fw.id}>
                      <td>
                        <div className="fw-bold text-dark">{fw.studentName}</div>
                        <div className="small text-muted font-monospace">{fw.studentRoll}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {fw.studentDepartment}
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/cases/${fw.caseNumber}`}
                          className="cx-font-mono fw-bold text-decoration-none hover-underline text-teal"
                        >
                          {fw.caseNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="small fw-semibold text-dark font-monospace">{fw.date}</div>
                      </td>
                      <td>
                        <div className="small text-muted" style={{ maxWidth: '280px' }}>
                          {fw.objective}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            fw.status === 'COMPLETED'
                              ? 'bg-success-subtle text-success'
                              : 'bg-warning-subtle text-warning'
                          }`}
                        >
                          {fw.status}
                        </span>
                      </td>
                      <td>
                        <div className="small text-muted text-truncate" style={{ maxWidth: '220px' }}>
                          {fw.outcome || 'Awaiting review observation'}
                        </div>
                      </td>
                      <td>
                        {fw.status === 'PENDING' ? (
                          <button
                            type="button"
                            onClick={() => openCompleteModal(fw)}
                            className="cx-btn cx-btn-teal cx-btn-sm d-inline-flex align-items-center gap-1"
                          >
                            <Check size={13} />
                            <span>Mark Complete</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCompleteModal(fw)}
                            className="cx-btn cx-btn-outline cx-btn-sm"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: COMPLETE FOLLOW-UP */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Complete Student Welfare Follow-up"
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              className="cx-btn cx-btn-outline"
              disabled={isActionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCompleteFollowup}
              className="cx-btn cx-btn-teal"
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Saving...' : 'Save Follow-up Check'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCompleteFollowup}>
          {selectedFollowup && (
            <div className="p-3 bg-light rounded-3 mb-3 small text-muted">
              <div>
                Student: <strong>{selectedFollowup.studentName}</strong> ({selectedFollowup.studentRoll})
              </div>
              <div className="mt-1">
                Objective: <em>"{selectedFollowup.objective}"</em>
              </div>
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="followup-outcome-input" className="cx-form-label">
              Follow-up Observation & Behavioral Findings <span className="text-danger">*</span>
            </label>
            <textarea
              id="followup-outcome-input"
              className="cx-input"
              rows={4}
              placeholder="Record observations from interactions with student, course instructor, or hostel proctor..."
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </AnimatedPage>
  );
};

export default CounselingFollowupsPage;
