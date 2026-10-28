import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  UserPlus,
  Paperclip,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  AlertCircle,
  FileText,
  User,
  MapPin,
} from 'lucide-react';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import PriorityBadge from '../components/common/PriorityBadge';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/feedback/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import caseService from '../services/caseService';
import { MOCK_USERS } from '../constants/demoUsers';

export const VerificationQueuePage = () => {
  const navigate = useNavigate();
  const { currentUser, isDean, isHod } = useAuth();
  const toast = useToast();

  const [pendingCases, setPendingCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);

  // Action Modals State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('VERIFY'); // 'VERIFY' | 'RETURN' | 'REJECT' | 'ASSIGN'
  const [actionNotes, setActionNotes] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const deptFilter = isHod && currentUser?.department ? currentUser.department : null;
      const queue = await caseService.getVerificationQueue(deptFilter);
      setPendingCases(queue);
    } catch (err) {
      toast.error('Unable to fetch verification queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [currentUser]);

  // Execute verification decision
  const handleConfirmDecision = async () => {
    if (!selectedCase) return;

    try {
      if (actionType === 'ASSIGN') {
        const targetUser = MOCK_USERS.find((u) => u.id === assigneeId);
        if (!targetUser) {
          toast.error('Please pick a reviewer to assign.');
          return;
        }
        await caseService.assignCase(selectedCase.id, {
          assignee: targetUser,
          assignedBy: currentUser,
          notes: actionNotes,
        });
        toast.success(`Case ${selectedCase.caseNumber} assigned to ${targetUser.name}`);
      } else {
        await caseService.verifyCase(selectedCase.id, {
          action: actionType,
          notes: actionNotes,
          reason: actionReason,
          verifiedBy: currentUser,
        });
        toast.success(
          `Case ${selectedCase.caseNumber} ${
            actionType === 'VERIFY' ? 'verified' : actionType === 'RETURN' ? 'returned for info' : 'rejected'
          }`
        );
      }

      setIsActionModalOpen(false);
      setSelectedCase(null);
      setActionNotes('');
      setActionReason('');
      setAssigneeId('');
      loadQueue();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  // Filtered queue items
  const filteredCases = pendingCases.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.caseNumber.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.student?.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    );
  });

  const criticalCount = pendingCases.filter((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH').length;

  return (
    <AnimatedPage>
      <PageHeader
        title={isHod ? 'Departmental Verification Queue' : 'Dean & Proctorial Verification Queue'}
        subtitle="Review reported incidents before approving for formal inquiry or resolution."
        breadcrumbs={[{ label: 'Cases', to: '/cases' }, { label: 'Verification Queue' }]}
        badge={
          <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
            {pendingCases.length} Pending Review
          </span>
        }
      />

      {/* Metrics Banner */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="cx-card p-3 border-start border-4 border-warning">
            <div className="small text-muted fw-bold text-uppercase">Pending Verification</div>
            <div className="h3 fw-bold mt-1 text-dark mb-0">{pendingCases.length}</div>
            <div className="small text-muted mt-1">Dockets awaiting initial administrative review</div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="cx-card p-3 border-start border-4 border-danger">
            <div className="small text-muted fw-bold text-uppercase">Critical / High Priority</div>
            <div className="h3 fw-bold mt-1 text-danger mb-0">{criticalCount}</div>
            <div className="small text-muted mt-1">Requiring immediate proctorial review (&lt; 24h)</div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="cx-card p-3 border-start border-4 border-success">
            <div className="small text-muted fw-bold text-uppercase">Turnaround SLA</div>
            <div className="h3 fw-bold mt-1 text-dark mb-0">98.4%</div>
            <div className="small text-muted mt-1">Average verification within 48-hour protocol</div>
          </div>
        </div>
      </div>

      {/* Policy Notice Box */}
      <div className="p-3 rounded-3 bg-light border mb-4 d-flex align-items-start gap-2.5">
        <AlertCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="small text-muted">
          <strong>Institutional Governance Principle:</strong> Verification checks whether an incident report is
          complete, plausible, and ready for investigation. <em>Verifying a case does not establish student guilt</em> or
          prescribe penalties.
        </div>
      </div>

      {/* Queue Table Card */}
      <div className="cx-card">
        <div className="p-3 border-bottom d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3">
          <div className="position-relative" style={{ minWidth: '320px' }}>
            <input
              type="text"
              className="cx-input ps-5"
              placeholder="Filter queue by reference, student, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              size={16}
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
            />
          </div>
          <span className="small text-muted">
            Showing <strong>{filteredCases.length}</strong> pending incident dockets
          </span>
        </div>

        {isLoading ? (
          <div className="p-5 text-center text-muted">
            <div className="spinner-border text-teal mb-3" role="status" />
            <div>Loading verification queue items...</div>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <CheckCircle2 size={36} className="text-success mb-2 mx-auto" />
            <h3 className="h6 fw-bold text-dark">Queue Clear</h3>
            <p className="small mb-0">All pending incident dockets have been verified and processed.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="cx-table">
              <thead>
                <tr>
                  <th>Case Ref</th>
                  <th>Incident Title</th>
                  <th>Student Details</th>
                  <th>Department</th>
                  <th>Submission Date</th>
                  <th>Priority</th>
                  <th>Evidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        to={`/cases/${c.caseNumber}`}
                        className="cx-font-mono fw-bold text-decoration-none"
                        style={{ color: 'var(--cx-teal-700)' }}
                      >
                        {c.caseNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '280px' }}>
                        {c.title}
                      </div>
                      <div className="small text-muted mt-0.5">{c.category}</div>
                    </td>
                    <td>
                      <div className="small fw-semibold text-dark">{c.student?.name}</div>
                      <div className="small text-muted font-monospace">{c.student?.rollNo}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace">
                        {c.departmentCode || 'CSE'}
                      </span>
                    </td>
                    <td className="small text-muted font-monospace">
                      {new Date(c.reportedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td>
                      <span className="badge bg-light text-muted border d-inline-flex align-items-center gap-1">
                        <Paperclip size={12} />
                        <span>{c.evidenceCount || 0}</span>
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCase(c);
                            setActionType('VERIFY');
                            setIsActionModalOpen(true);
                          }}
                          className="cx-btn cx-btn-teal cx-btn-sm py-1 px-2.5"
                          title="Verify Docket"
                        >
                          <CheckCircle2 size={13} />
                          <span>Action</span>
                        </button>
                        <Link
                          to={`/cases/${c.caseNumber}`}
                          className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2 text-muted"
                          title="Open Full Details"
                        >
                          <Eye size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VERIFICATION ACTION MODAL */}
      {selectedCase && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => {
            setIsActionModalOpen(false);
            setSelectedCase(null);
          }}
          title={`Verification Action: ${selectedCase.caseNumber}`}
          size="lg"
          footer={
            <div className="d-flex align-items-center justify-content-between w-100">
              <Link to={`/cases/${selectedCase.caseNumber}`} className="small text-teal text-decoration-none">
                Open Full Case File →
              </Link>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="cx-btn cx-btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  className={`cx-btn ${
                    actionType === 'REJECT'
                      ? 'btn-danger text-white'
                      : actionType === 'VERIFY'
                      ? 'cx-btn-teal'
                      : 'cx-btn-primary'
                  }`}
                >
                  Confirm Decision
                </button>
              </div>
            </div>
          }
        >
          {/* Incident summary header */}
          <div className="p-3 rounded-3 bg-light border mb-4">
            <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
              <div>
                <span className="badge bg-secondary-subtle text-secondary me-2">{selectedCase.category}</span>
                <PriorityBadge priority={selectedCase.priority} />
              </div>
              <span className="small text-muted font-monospace">
                Reported {new Date(selectedCase.reportedAt).toLocaleString()}
              </span>
            </div>
            <h4 className="h6 fw-bold text-dark mb-1">{selectedCase.title}</h4>
            <p className="small text-muted mb-0">{selectedCase.summary}</p>
          </div>

          {/* Action Selector Pills */}
          <div className="mb-4">
            <label className="cx-form-label">Select Administrative Determination</label>
            <div className="row g-2">
              <div className="col-12 col-md-3">
                <button
                  type="button"
                  onClick={() => setActionType('VERIFY')}
                  className={`btn w-100 text-start p-2.5 h-100 ${
                    actionType === 'VERIFY' ? 'btn-success text-white' : 'btn-outline-success'
                  }`}
                >
                  <div className="fw-bold small d-flex align-items-center gap-1.5">
                    <CheckCircle2 size={15} />
                    <span>Verify Case</span>
                  </div>
                  <div className={actionType === 'VERIFY' ? 'text-white text-opacity-75' : 'text-muted'} style={{ fontSize: '0.7rem' }}>
                    Valid incident; forward to inquiry
                  </div>
                </button>
              </div>

              <div className="col-12 col-md-3">
                <button
                  type="button"
                  onClick={() => setActionType('ASSIGN')}
                  className={`btn w-100 text-start p-2.5 h-100 ${
                    actionType === 'ASSIGN' ? 'btn-primary text-white' : 'btn-outline-primary'
                  }`}
                >
                  <div className="fw-bold small d-flex align-items-center gap-1.5">
                    <UserPlus size={15} />
                    <span>Assign Reviewer</span>
                  </div>
                  <div className={actionType === 'ASSIGN' ? 'text-white text-opacity-75' : 'text-muted'} style={{ fontSize: '0.7rem' }}>
                    Appoint inquiry officer
                  </div>
                </button>
              </div>

              <div className="col-12 col-md-3">
                <button
                  type="button"
                  onClick={() => setActionType('RETURN')}
                  className={`btn w-100 text-start p-2.5 h-100 ${
                    actionType === 'RETURN' ? 'btn-warning text-dark' : 'btn-outline-warning'
                  }`}
                >
                  <div className="fw-bold small d-flex align-items-center gap-1.5">
                    <RotateCcw size={15} />
                    <span>Return for Info</span>
                  </div>
                  <div className={actionType === 'RETURN' ? 'text-dark text-opacity-75' : 'text-muted'} style={{ fontSize: '0.7rem' }}>
                    Request missing evidence
                  </div>
                </button>
              </div>

              <div className="col-12 col-md-3">
                <button
                  type="button"
                  onClick={() => setActionType('REJECT')}
                  className={`btn w-100 text-start p-2.5 h-100 ${
                    actionType === 'REJECT' ? 'btn-danger text-white' : 'btn-outline-danger'
                  }`}
                >
                  <div className="fw-bold small d-flex align-items-center gap-1.5">
                    <XCircle size={15} />
                    <span>Reject Incident</span>
                  </div>
                  <div className={actionType === 'REJECT' ? 'text-white text-opacity-75' : 'text-muted'} style={{ fontSize: '0.7rem' }}>
                    Does not meet criteria
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Conditional Input based on action */}
          {actionType === 'ASSIGN' && (
            <div className="mb-3">
              <label htmlFor="modal-assignee-select" className="cx-form-label">
                Assign Inquiry Officer <span className="text-danger">*</span>
              </label>
              <select
                id="modal-assignee-select"
                className="cx-input mb-3"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">-- Choose Reviewer / Proctorial Officer --</option>
                {MOCK_USERS.filter((u) => u.role !== 'STUDENT').map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleLabel} • {u.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          {actionType === 'REJECT' ? (
            <div className="mb-3">
              <label htmlFor="modal-action-reason" className="cx-form-label">
                Mandatory Policy Rejection Reason <span className="text-danger">*</span>
              </label>
              <textarea
                id="modal-action-reason"
                className="cx-input"
                rows={3}
                placeholder="State the institutional grounds for rejecting this report (e.g. outside proctorial jurisdiction, lack of prima facie evidence)..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          ) : (
            <div className="mb-3">
              <label htmlFor="modal-action-notes" className="cx-form-label">
                Verification Directives & Required Information Notes
              </label>
              <textarea
                id="modal-action-notes"
                className="cx-input"
                rows={3}
                placeholder={
                  actionType === 'RETURN'
                    ? 'Explicitly specify what additional documentation or statements are required...'
                    : 'Add instructions for the inquiry panel or terms of review...'
                }
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
          )}
        </Modal>
      )}
    </AnimatedPage>
  );
};

export default VerificationQueuePage;
