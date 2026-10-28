import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  User,
  ArrowRight,
  Eye,
  MessageSquare,
  HelpCircle,
  RotateCcw,
  Check,
  X,
  FileCheck,
  AlertTriangle,
  Lock,
  Calendar,
  Send,
  Building2,
  Shield,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import appealService from '../../services/appealService';
import adminService from '../../services/adminService';

export const AppellateReviewPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [appeals, setAppeals] = useState([]);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);

  // Form states
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [infoQuery, setInfoQuery] = useState('');
  const [infoDeadline, setInfoDeadline] = useState('');
  const [noteText, setNoteText] = useState('');
  const [recommendationProposal, setRecommendationProposal] = useState('MODIFIED');
  const [recommendationText, setRecommendationText] = useState('');
  const [recommendationJustification, setRecommendationJustification] = useState('');
  const [finalOutcomeChoice, setFinalOutcomeChoice] = useState('MODIFIED');
  const [outcomeJustification, setOutcomeJustification] = useState('');
  const [remandInstructions, setRemandInstructions] = useState('');

  const potentialReviewers = adminService.getUsers().filter(
    (u) => ['SUPER_ADMIN', 'DEAN', 'COMMITTEE_MEMBER', 'HOD'].includes(u.role)
  );

  const loadAppeals = async () => {
    setIsLoading(true);
    try {
      const data = await appealService.getAppeals({
        currentUser,
        status: statusFilter,
        search: searchQuery,
        department: departmentFilter,
      });
      setAppeals(data);
      if (selectedAppeal) {
        const refreshed = data.find((a) => a.id === selectedAppeal.id);
        if (refreshed) setSelectedAppeal(refreshed);
      }
    } catch (err) {
      console.error('Failed to load appeals', err);
      toast.error('Unable to retrieve appellate docket.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppeals();
  }, [statusFilter, departmentFilter, searchQuery]);

  const handleBeginReview = async (appeal) => {
    try {
      await appealService.assignReviewer(appeal.id, currentUser, currentUser);
      toast.success(`Appellate review commenced for ${appeal.appealNumber}.`);
      loadAppeals();
    } catch (err) {
      toast.error(err.message || 'Failed to commence review.');
    }
  };

  const handleAssignReviewer = async (e) => {
    e.preventDefault();
    if (!selectedReviewerId) {
      toast.error('Please choose an authorized reviewer.');
      return;
    }
    const reviewer = potentialReviewers.find((u) => u.id === selectedReviewerId);
    if (!reviewer) return;

    try {
      await appealService.assignReviewer(selectedAppeal.id, reviewer, currentUser);
      toast.success(`Assigned ${reviewer.name} to appeal ${selectedAppeal.appealNumber}.`);
      setIsAssignModalOpen(false);
      loadAppeals();
    } catch (err) {
      toast.error(err.message || 'Failed to assign reviewer.');
    }
  };

  const handleRequestInfo = async (e) => {
    e.preventDefault();
    if (!infoQuery.trim()) {
      toast.error('Please specify the required information.');
      return;
    }

    try {
      await appealService.requestAdditionalInfo(
        selectedAppeal.id,
        { query: infoQuery, deadline: infoDeadline },
        currentUser
      );
      toast.success('Information request issued to appellant.');
      setIsRequestInfoModalOpen(false);
      setInfoQuery('');
      setInfoDeadline('');
      loadAppeals();
    } catch (err) {
      toast.error(err.message || 'Failed to request info.');
    }
  };

  const handleAddReviewNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      await appealService.recordReviewNotes(selectedAppeal.id, noteText, currentUser);
      toast.success('Deliberation note recorded.');
      setIsNoteModalOpen(false);
      setNoteText('');
      loadAppeals();
    } catch (err) {
      toast.error(err.message || 'Failed to save note.');
    }
  };

  const handleSubmitRecommendation = async (e) => {
    e.preventDefault();
    if (!recommendationJustification.trim()) {
      toast.error('Please provide a justification for this recommendation.');
      return;
    }

    try {
      await appealService.submitRecommendation(
        selectedAppeal.id,
        {
          recommendationText,
          proposedOutcome: recommendationProposal,
          justification: recommendationJustification,
        },
        currentUser
      );
      toast.success('Appellate recommendation submitted.');
      setIsRecommendModalOpen(false);
      loadAppeals();
    } catch (err) {
      toast.error(err.message || 'Failed to submit recommendation.');
    }
  };

  const handleRecordFinalOutcome = async (e) => {
    e.preventDefault();
    if (!outcomeJustification.trim()) {
      toast.error('Formal outcome justification is required.');
      return;
    }

    try {
      await appealService.recordFinalOutcome(
        selectedAppeal.id,
        {
          outcome: finalOutcomeChoice,
          justification: outcomeJustification,
          authorizedBy: currentUser.name,
          remandInstructions: finalOutcomeChoice === 'REMANDED_FOR_REVIEW' ? remandInstructions : null,
        },
        currentUser
      );
      toast.success(`Final determination recorded: ${finalOutcomeChoice.replace(/_/g, ' ')}.`);
      setIsOutcomeModalOpen(false);
      loadAppeals();
    } catch (err) {
      toast.error(err.message || 'Failed to authorize outcome.');
    }
  };

  const isConflictReviewer = (reviewer) => {
    if (!selectedAppeal?.originalDecision?.decidedBy || !reviewer?.name) return false;
    return selectedAppeal.originalDecision.decidedBy.toLowerCase().includes(reviewer.name.toLowerCase());
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Appellate Review & Ombudsman Docket"
        subtitle="Independent reconsideration, procedural review, and appellate determinations for disciplinary cases."
        breadcrumbs={[{ label: 'Governance' }, { label: 'Appeals Review' }]}
        badge={
          <span className="badge bg-teal text-white px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            Appellate Jurisdiction Active
          </span>
        }
      />

      {/* Filter and Search Bar */}
      <div className="cx-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={14} className="text-secondary" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by appeal ref, case, student, or grounds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Appellate Statuses</option>
              <option value="SUBMITTED">Submitted (New)</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ADDITIONAL_INFORMATION_REQUESTED">Info Requested</option>
              <option value="REVIEW_COMPLETED">Review Completed</option>
              <option value="UPHELD">Upheld</option>
              <option value="MODIFIED">Modified</option>
              <option value="REMANDED_FOR_REVIEW">Remanded</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Mechanical Engineering">ME</option>
              <option value="Electronics & Communication">ECE</option>
              <option value="Civil Engineering">CE</option>
              <option value="Department of Management Studies">MGMT</option>
            </select>
          </div>

          <div className="col-12 col-md-1 text-end">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setDepartmentFilter('ALL');
              }}
              className="btn btn-sm btn-outline-secondary w-100"
              title="Reset Filters"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Workspace Layout: Table on Left, Docket Inspector on Right */}
      <div className="row g-4">
        <div className={selectedAppeal ? 'col-12 col-lg-7' : 'col-12'}>
          <div className="cx-card">
            <div className="cx-card-header d-flex justify-content-between align-items-center">
              <h2 className="h6 mb-0 fw-bold">Active Appellate Review Petitions</h2>
              <span className="badge bg-light text-dark border">{appeals.length} Dockets</span>
            </div>

            <div className="cx-card-body p-0">
              {isLoading ? (
                <div className="p-4 text-center text-muted">
                  <div className="spinner-border spinner-border-sm text-teal me-2" role="status" />
                  <span>Loading appellate petitions...</span>
                </div>
              ) : appeals.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <FileCheck size={32} className="opacity-50 mb-2" />
                  <p className="small mb-0">No appellate petitions match the selected criteria.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="cx-table align-middle">
                    <thead>
                      <tr>
                        <th>Appeal Ref</th>
                        <th>Appellant</th>
                        <th>Challenged Decision</th>
                        <th>Reviewer</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appeals.map((appeal) => (
                        <tr
                          key={appeal.id}
                          className={selectedAppeal?.id === appeal.id ? 'table-active' : ''}
                        >
                          <td>
                            <span className="fw-bold cx-font-mono text-dark">{appeal.appealNumber}</span>
                            <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                              Case {appeal.caseNumber}
                            </div>
                          </td>
                          <td>
                            <strong className="text-dark small d-block">{appeal.appellant?.name}</strong>
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                              {appeal.appellant?.rollNo} ({appeal.appellant?.departmentCode})
                            </span>
                          </td>
                          <td>
                            <span className="small text-secondary text-truncate d-inline-block" style={{ maxWidth: '180px' }}>
                              {appeal.groundsSummary}
                            </span>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              Preserved on record
                            </div>
                          </td>
                          <td>
                            {appeal.assignedReviewer ? (
                              <span className="small text-dark fw-medium">
                                {appeal.assignedReviewer.name}
                              </span>
                            ) : (
                              <span className="badge bg-warning-subtle text-warning-emphasis" style={{ fontSize: '0.65rem' }}>
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td>
                            <StatusBadge status={appeal.status} label={appeal.statusLabel} />
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedAppeal(appeal)}
                                className={`btn btn-sm py-1 px-2 ${
                                  selectedAppeal?.id === appeal.id ? 'btn-teal' : 'btn-outline-secondary'
                                }`}
                                style={{ fontSize: '0.75rem' }}
                              >
                                <Eye size={12} className="me-1" />
                                <span>Inspect</span>
                              </button>

                              {appeal.status === 'SUBMITTED' && (
                                <button
                                  type="button"
                                  onClick={() => handleBeginReview(appeal)}
                                  className="btn btn-sm btn-teal py-1 px-2"
                                  style={{ fontSize: '0.75rem' }}
                                  title="Begin Review"
                                >
                                  Begin
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Appeal Docket Detailed Workspace */}
        {selectedAppeal && (
          <div className="col-12 col-lg-5">
            <div className="cx-card shadow-sm border-0 sticky-top" style={{ top: '80px' }}>
              <div className="cx-card-header bg-light d-flex justify-content-between align-items-center py-2.5">
                <div>
                  <strong className="text-dark small">{selectedAppeal.appealNumber}</strong>
                  <span className="text-muted small ms-2">({selectedAppeal.caseNumber})</span>
                </div>
                <button
                  type="button"
                  className="btn-close btn-sm"
                  onClick={() => setSelectedAppeal(null)}
                  aria-label="Close"
                />
              </div>

              <div className="cx-card-body p-3.5" style={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="h6 fw-bold text-dark mb-0">Appellate Docket Summary</h3>
                  <StatusBadge status={selectedAppeal.status} label={selectedAppeal.statusLabel} />
                </div>

                {/* Original Preserved Decision Alert */}
                <div className="p-2.5 bg-light rounded border mb-3">
                  <div className="d-flex align-items-center gap-1 text-secondary mb-1">
                    <Lock size={13} />
                    <strong style={{ fontSize: '0.75rem' }}>Original Sanction (Preserved)</strong>
                  </div>
                  <p className="text-dark small mb-0" style={{ fontSize: '0.78rem' }}>
                    {selectedAppeal.originalDecision?.decisionSummary}
                  </p>
                  <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                    Decided by {selectedAppeal.originalDecision?.decidedBy}
                  </div>
                </div>

                {/* Appellant & Reviewer Info */}
                <div className="row g-2 mb-3 small">
                  <div className="col-6">
                    <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Appellant:</span>
                    <strong className="text-dark">{selectedAppeal.appellant?.name}</strong>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {selectedAppeal.appellant?.rollNo} • {selectedAppeal.appellant?.departmentCode}
                    </div>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Assigned Reviewer:</span>
                    {selectedAppeal.assignedReviewer ? (
                      <div>
                        <strong className="text-dark">{selectedAppeal.assignedReviewer.name}</strong>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {selectedAppeal.assignedReviewer.role}
                        </div>
                      </div>
                    ) : (
                      <span className="text-warning fw-semibold">Unassigned</span>
                    )}
                  </div>
                </div>

                {/* Grounds & Explanation */}
                <div className="mb-3">
                  <span className="text-muted small d-block" style={{ fontSize: '0.7rem' }}>Grounds:</span>
                  <span className="badge bg-teal-subtle text-teal mb-2">{selectedAppeal.groundsSummary}</span>

                  <span className="text-muted small d-block" style={{ fontSize: '0.7rem' }}>Appellant Statement:</span>
                  <div className="p-2.5 bg-light rounded border text-secondary small" style={{ fontSize: '0.78rem' }}>
                    {selectedAppeal.explanation}
                  </div>
                </div>

                {/* Relief Sought */}
                <div className="mb-3">
                  <span className="text-muted small d-block" style={{ fontSize: '0.7rem' }}>Relief Sought:</span>
                  <p className="text-dark small mb-0" style={{ fontSize: '0.78rem' }}>
                    {selectedAppeal.reliefSought}
                  </p>
                </div>

                {/* Supporting Exhibits */}
                {selectedAppeal.supportingDocuments?.length > 0 && (
                  <div className="mb-3">
                    <span className="text-muted small d-block mb-1" style={{ fontSize: '0.7rem' }}>Attached Exhibits:</span>
                    <div className="d-flex flex-wrap gap-1.5">
                      {selectedAppeal.supportingDocuments.map((doc) => (
                        <span key={doc.id} className="badge bg-white text-dark border p-1.5" style={{ fontSize: '0.72rem' }}>
                          <FileText size={11} className="text-teal me-1" />
                          <span>{doc.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Toolbar for Authorized Reviewers */}
                <div className="border-top pt-3 mb-3">
                  <h4 className="small fw-bold text-dark mb-2">Authorized Appellate Review Actions:</h4>
                  <div className="d-grid gap-2">
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReviewerId(selectedAppeal.assignedReviewer?.id || '');
                          setIsAssignModalOpen(true);
                        }}
                        className="btn btn-sm btn-outline-secondary flex-grow-1"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <UserCheck size={13} className="me-1" />
                        <span>Assign Reviewer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsRequestInfoModalOpen(true)}
                        className="btn btn-sm btn-outline-warning text-dark flex-grow-1"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <MessageSquare size={13} className="me-1" />
                        <span>Request Info</span>
                      </button>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNoteModalOpen(true)}
                        className="btn btn-sm btn-outline-primary flex-grow-1"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <FileText size={13} className="me-1" />
                        <span>Deliberation Note</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRecommendationProposal('MODIFIED');
                          setRecommendationJustification('');
                          setIsRecommendModalOpen(true);
                        }}
                        className="btn btn-sm btn-outline-teal flex-grow-1"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <Scale size={13} className="me-1" />
                        <span>Recommend</span>
                      </button>
                    </div>

                    {/* Authorize Final Determination Button (Executive action) */}
                    <button
                      type="button"
                      onClick={() => {
                        setFinalOutcomeChoice('MODIFIED');
                        setOutcomeJustification('');
                        setIsOutcomeModalOpen(true);
                      }}
                      className="btn btn-sm btn-teal"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <CheckCircle2 size={14} className="me-1" />
                      <span>Authorize Final Outcome</span>
                    </button>
                  </div>
                </div>

                {/* Recommendation Notice (if present) */}
                {selectedAppeal.recommendation && (
                  <div className="p-2.5 bg-info-subtle rounded border border-info mb-3 small">
                    <div className="d-flex align-items-center gap-1 text-info-emphasis fw-bold mb-1">
                      <Scale size={13} />
                      <span>Review Recommendation on File</span>
                    </div>
                    <div>Proposes: <strong>{selectedAppeal.recommendation.proposedOutcome.replace(/_/g, ' ')}</strong></div>
                    <p className="mb-0 text-secondary" style={{ fontSize: '0.75rem' }}>
                      {selectedAppeal.recommendation.justification}
                    </p>
                    <div className="text-muted mt-1" style={{ fontSize: '0.68rem' }}>
                      By {selectedAppeal.recommendation.submittedBy}
                    </div>
                  </div>
                )}

                {/* Final Authorized Outcome (if present) */}
                {selectedAppeal.finalOutcome && (
                  <div className="p-2.5 bg-success-subtle rounded border border-success mb-3 small">
                    <div className="d-flex align-items-center gap-1 text-success fw-bold mb-1">
                      <CheckCircle2 size={13} />
                      <span>Final Outcome Authorized: {selectedAppeal.statusLabel}</span>
                    </div>
                    <p className="mb-0 text-dark" style={{ fontSize: '0.75rem' }}>
                      {selectedAppeal.finalOutcome.justification}
                    </p>
                    <div className="text-muted mt-1" style={{ fontSize: '0.68rem' }}>
                      Authorized by {selectedAppeal.finalOutcome.authorizedBy} on{' '}
                      {new Date(selectedAppeal.finalOutcome.authorizedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Audit Timeline */}
                <h4 className="small fw-bold text-dark mb-2">Chronological Docket Timeline:</h4>
                <div className="border-start border-2 border-teal ps-3 ms-1">
                  {(selectedAppeal.timeline || []).map((tl) => (
                    <div key={tl.id} className="mb-2 position-relative" style={{ fontSize: '0.75rem' }}>
                      <div
                        className="position-absolute rounded-circle bg-teal"
                        style={{ width: '6px', height: '6px', left: '-16px', top: '5px' }}
                      />
                      <div className="fw-bold text-dark">{tl.title}</div>
                      <div className="text-secondary" style={{ fontSize: '0.72rem' }}>{tl.explanation}</div>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                        {tl.actor} • {new Date(tl.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reassign Reviewer Modal */}
      {isAssignModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">Assign Appellate Reviewer</h5>
                <button type="button" className="btn-close" onClick={() => setIsAssignModalOpen(false)} />
              </div>

              <form onSubmit={handleAssignReviewer}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Select Authorized Reviewer:</label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedReviewerId}
                      onChange={(e) => setSelectedReviewerId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Reviewer Persona --</option>
                      {potentialReviewers.map((u) => {
                        const isConflict = isConflictReviewer(u);
                        return (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role}) — {u.department} {isConflict ? '⚠️ [Original Decision Maker Conflict]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedReviewerId && isConflictReviewer(potentialReviewers.find((u) => u.id === selectedReviewerId)) && (
                    <div className="p-2.5 bg-warning-subtle text-dark border border-warning rounded small mb-2">
                      <AlertTriangle size={14} className="text-warning-emphasis me-1" />
                      <strong>Due Process Conflict Warning:</strong> This reviewer participated in the original disciplinary finding. Best practice recommends assigning an independent authority.
                    </div>
                  )}
                </div>

                <div className="modal-footer border-top py-2 px-4">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAssignModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-teal btn-sm">
                    Confirm Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Request Additional Info Modal */}
      {isRequestInfoModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">Request Supplementary Information</h5>
                <button type="button" className="btn-close" onClick={() => setIsRequestInfoModalOpen(false)} />
              </div>

              <form onSubmit={handleRequestInfo}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Specific Clarification or Document Requested:</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="e.g. Please furnish verified train delay certificate or witness statement..."
                      value={infoQuery}
                      onChange={(e) => setInfoQuery(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Response Deadline:</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={infoDeadline}
                      onChange={(e) => setInfoDeadline(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-4">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsRequestInfoModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning text-dark fw-semibold btn-sm">
                    Issue Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Internal Deliberation Note Modal */}
      {isNoteModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">Record Review Deliberation Note</h5>
                <button type="button" className="btn-close" onClick={() => setIsNoteModalOpen(false)} />
              </div>

              <form onSubmit={handleAddReviewNote}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Confidential Review Note:</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Enter internal review observations, statutory policy checks, or witness analysis..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-4">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsNoteModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-teal btn-sm">
                    Save Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Modal */}
      {isRecommendModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">Submit Review Recommendation</h5>
                <button type="button" className="btn-close" onClick={() => setIsRecommendModalOpen(false)} />
              </div>

              <form onSubmit={handleSubmitRecommendation}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Proposed Determination:</label>
                    <select
                      className="form-select form-select-sm"
                      value={recommendationProposal}
                      onChange={(e) => setRecommendationProposal(e.target.value)}
                    >
                      <option value="MODIFIED">Modify Disciplinary Sanction</option>
                      <option value="UPHELD">Uphold Original Decision in Full</option>
                      <option value="REMANDED_FOR_REVIEW">Remand for Fresh Committee Hearing</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Justification & Grounds Analysis:</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Detail why the proposed outcome satisfies proportionality and due process..."
                      value={recommendationJustification}
                      onChange={(e) => setRecommendationJustification(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-4">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsRecommendModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-teal btn-sm">
                    Submit Recommendation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Final Outcome Authorization Modal */}
      {isOutcomeModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">Authorize Final Appellate Outcome</h5>
                <button type="button" className="btn-close" onClick={() => setIsOutcomeModalOpen(false)} />
              </div>

              <form onSubmit={handleRecordFinalOutcome}>
                <div className="modal-body p-4">
                  <div className="p-2.5 bg-light rounded border mb-3 small">
                    <div className="text-muted">Authorizing Authority:</div>
                    <strong>{currentUser?.name} ({currentUser?.role})</strong>
                  </div>

                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Authorized Appellate Determination:</label>
                    <select
                      className="form-select form-select-sm"
                      value={finalOutcomeChoice}
                      onChange={(e) => setFinalOutcomeChoice(e.target.value)}
                    >
                      <option value="MODIFIED">Modify Sanction (Proportionality Granted)</option>
                      <option value="UPHELD">Uphold Original Sanction (Appeal Dismissed)</option>
                      <option value="REMANDED_FOR_REVIEW">Remand Case for Re-Hearing</option>
                      <option value="WITHDRAWN">Appellate Petition Withdrawn</option>
                    </select>
                  </div>

                  {finalOutcomeChoice === 'REMANDED_FOR_REVIEW' && (
                    <div className="mb-3">
                      <label className="cx-form-label fw-bold">Remand Instructions for Ethics Board:</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Reconvene hearing with faculty proctor witness testimony..."
                        value={remandInstructions}
                        onChange={(e) => setRemandInstructions(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Executive Rationale & Order:</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="State the formal appellate finding to be committed to the institutional record..."
                      value={outcomeJustification}
                      onChange={(e) => setOutcomeJustification(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-4">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsOutcomeModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-teal btn-sm">
                    Commit Authorized Determination
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
};

export default AppellateReviewPage;
