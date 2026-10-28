import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Plus,
  Send,
  HelpCircle,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Search,
  Filter,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Modal from '../../components/feedback/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import committeeService from '../../services/committeeService';
import hearingService from '../../services/hearingService';

export const CommitteeDashboardPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'reviews');
  const [metrics, setMetrics] = useState({
    awaitingReview: 0,
    underReview: 0,
    upcomingHearings: 0,
    awaitingMinutes: 0,
    pendingRecommendations: 0,
    flaggedEvidence: 0,
    completedReviews: 0,
  });

  const [reviews, setReviews] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [selectedReview, setSelectedReview] = useState(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);
  const [recCategory, setRecCategory] = useState('Counseling or mentoring recommended');
  const [recRationale, setRecRationale] = useState('');
  const [recSanction, setRecSanction] = useState('');
  const [recFollowUp, setRecFollowUp] = useState('');
  const [recMembers, setRecMembers] = useState('');

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoDetails, setInfoDetails] = useState('');
  const [infoTarget, setInfoTarget] = useState('investigator');

  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [m, rList, hList] = await Promise.all([
        committeeService.getCommitteeMetrics(currentUser),
        committeeService.getReviews({ status: statusFilter, searchQuery, currentUser }),
        hearingService.getHearings({ currentUser }),
      ]);
      setMetrics(m);
      setReviews(rList);
      setHearings(hList);
    } catch (err) {
      toast.error('Failed to load committee workspace data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, searchQuery, currentUser]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const handleStartReview = async (review) => {
    try {
      await committeeService.startReview(review.id, currentUser);
      toast.success(`Formal inquiry review initiated for ${review.caseNumber}.`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to start review.');
    }
  };

  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteText || noteText.trim().length < 5) {
      toast.error('Note text must be at least 5 characters.');
      return;
    }
    setIsActionLoading(true);
    try {
      await committeeService.addReviewNote(selectedReview.id, {
        noteText,
        author: currentUser,
      });
      toast.success('Deliberation note logged to committee record.');
      setIsNoteModalOpen(false);
      setNoteText('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to add note.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveRecommendation = async (isFormalSubmit) => {
    if (!recCategory) {
      toast.error('Please select a recommendation category.');
      return;
    }
    if (!recRationale || recRationale.trim().length < 15) {
      toast.error('Supporting rationale must be at least 15 characters.');
      return;
    }

    setIsActionLoading(true);
    const membersList = recMembers
      ? recMembers.split(',').map((m) => m.trim())
      : ['Dr. Alok Nath', 'Prof. Ananya Sen'];

    try {
      if (isFormalSubmit) {
        await committeeService.submitRecommendation(selectedReview.id, {
          category: recCategory,
          rationale: recRationale,
          proposedSanction: recSanction,
          followUp: recFollowUp,
          participatingMembers: membersList,
          submittedBy: currentUser,
        });
        toast.success(`Formal committee recommendation submitted for ${selectedReview.caseNumber}!`);
      } else {
        await committeeService.saveRecommendationDraft(selectedReview.id, {
          category: recCategory,
          rationale: recRationale,
          proposedSanction: recSanction,
          followUp: recFollowUp,
          participatingMembers: membersList,
        });
        toast.success('Recommendation draft saved.');
      }
      setIsRecommendationModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save recommendation.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRequestInfoSubmit = async (e) => {
    e.preventDefault();
    if (!infoDetails || infoDetails.trim().length < 10) {
      toast.error('Please describe what information or evidence is required.');
      return;
    }
    setIsActionLoading(true);
    try {
      await committeeService.requestAdditionalInfo(selectedReview.id, {
        details: infoDetails,
        requestedFrom: infoTarget,
        requestedBy: currentUser,
      });
      toast.success('Formal information request logged and dispatched.');
      setIsInfoModalOpen(false);
      setInfoDetails('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to request information.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openRecommendationModal = (rev) => {
    setSelectedReview(rev);
    const existing = rev.submittedRecommendation || rev.recommendationDraft;
    if (existing) {
      setRecCategory(existing.category || 'Counseling or mentoring recommended');
      setRecRationale(existing.rationale || '');
      setRecSanction(existing.proposedSanction || '');
      setRecFollowUp(existing.followUp || '');
      setRecMembers(rev.participatingMembers ? rev.participatingMembers.join(', ') : '');
    } else {
      setRecCategory('Counseling or mentoring recommended');
      setRecRationale('');
      setRecSanction('');
      setRecFollowUp('');
      setRecMembers('Dr. Alok Nath, Prof. Sunita Mehta');
    }
    setIsRecommendationModalOpen(true);
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Disciplinary Committee Workspace"
        subtitle="Proctorial board deliberations, evidence evaluation, hearing oversight, and institutional sanction recommendations."
        breadcrumbs={[{ label: 'Committee' }, { label: 'Review Workspace' }]}
        badge={
          <span className="badge bg-purple-subtle text-purple border px-2 py-1 d-inline-flex align-items-center gap-1.5">
            <Scale size={13} />
            <span>Proctorial Board Active</span>
          </span>
        }
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link to="/committee/evidence" className="cx-btn cx-btn-outline">
              <Eye size={15} />
              <span>Evidence Vault</span>
            </Link>
            <Link to="/committee/timeline" className="cx-btn cx-btn-teal">
              <Calendar size={15} />
              <span>Hearing Calendar</span>
            </Link>
          </div>
        }
      />

      {/* Metrics Banner */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="cx-card p-3 border-start border-4 border-warning">
            <div className="small text-muted fw-bold text-uppercase">Awaiting Review</div>
            <div className="h4 fw-bold mt-1 text-dark">{metrics.awaitingReview}</div>
            <div className="small text-muted">Initial board inspection pending</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="cx-card p-3 border-start border-4 border-info">
            <div className="small text-muted fw-bold text-uppercase">Upcoming Hearings</div>
            <div className="h4 fw-bold mt-1 text-dark">{metrics.upcomingHearings}</div>
            <div className="small text-muted">Formal summons scheduled</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="cx-card p-3 border-start border-4 border-primary">
            <div className="small text-muted fw-bold text-uppercase">Hearings Awaiting Minutes</div>
            <div className="h4 fw-bold mt-1 text-dark">{metrics.awaitingMinutes}</div>
            <div className="small text-muted">Official proceedings drafting</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="cx-card p-3 border-start border-4 border-success">
            <div className="small text-muted fw-bold text-uppercase">Pending Recommendations</div>
            <div className="h4 fw-bold mt-1 text-dark">{metrics.pendingRecommendations}</div>
            <div className="small text-muted">Sanction proposals for Dean review</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="cx-tabs-wrapper mb-4">
        <button
          type="button"
          onClick={() => handleTabChange('reviews')}
          className={`cx-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
        >
          <Scale size={16} />
          <span>Case Review Queue ({reviews.length})</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('deliberations')}
          className={`cx-tab-btn ${activeTab === 'deliberations' ? 'active' : ''}`}
        >
          <FileCheck size={16} />
          <span>Recommendations & Sanctions</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('hearings')}
          className={`cx-tab-btn ${activeTab === 'hearings' ? 'active' : ''}`}
        >
          <Calendar size={16} />
          <span>Scheduled Hearings ({hearings.length})</span>
        </button>
      </div>

      {/* TAB 1: CASE REVIEW QUEUE */}
      {activeTab === 'reviews' && (
        <div>
          {/* Filter Bar */}
          <div className="cx-card p-3 mb-4">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-6 col-lg-8">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <Search size={16} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="cx-input rounded-start-0"
                    placeholder="Search reviews by case number, headline title, category, or assigned member..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <select
                  className="cx-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Review Statuses</option>
                  <option value="AWAITING_REVIEW">Awaiting Review</option>
                  <option value="UNDER_REVIEW">Under Active Review</option>
                  <option value="RECOMMENDATION_DRAFTED">Recommendation Drafted</option>
                  <option value="RECOMMENDATION_SUBMITTED">Recommendation Submitted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          {isLoading ? (
            <div className="cx-card p-5 text-center text-muted">
              <div className="spinner-border text-teal mb-3" role="status" />
              <div>Loading committee review dockets...</div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="cx-card p-5 text-center text-muted">
              <Scale size={42} className="mx-auto mb-2 text-muted opacity-50" />
              <h3 className="h6 fw-bold text-dark">No Committee Reviews Found</h3>
              <p className="small text-muted mb-0">No active cases match the selected review criteria.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="cx-card p-4 border-start border-4 border-primary hover-shadow">
                  <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-3 pb-3 border-bottom mb-3">
                    <div>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1.5">
                        <Link
                          to={`/cases/${rev.caseNumber}`}
                          className="cx-font-mono fw-bold fs-6 text-decoration-none hover-underline"
                          style={{ color: 'var(--cx-teal-700)' }}
                        >
                          {rev.caseNumber}
                        </Link>
                        <span className="badge bg-secondary-subtle text-secondary border">{rev.category}</span>
                        <PriorityBadge priority={rev.priority} />
                        <span
                          className={`badge ${
                            rev.status === 'RECOMMENDATION_SUBMITTED'
                              ? 'bg-success-subtle text-success'
                              : rev.status === 'UNDER_REVIEW'
                              ? 'bg-primary-subtle text-primary'
                              : 'bg-warning-subtle text-warning'
                          }`}
                        >
                          {rev.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h2 className="h6 fw-bold text-dark mb-1">{rev.title}</h2>
                      <div className="small text-muted">
                        Assigned Lead: <strong className="text-dark">{rev.assignedTo}</strong> • Review Started:{' '}
                        {new Date(rev.startDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      {rev.status === 'AWAITING_REVIEW' && (
                        <button
                          type="button"
                          onClick={() => handleStartReview(rev)}
                          className="cx-btn cx-btn-teal cx-btn-sm"
                        >
                          <Scale size={14} />
                          <span>Begin Review</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReview(rev);
                          setIsNoteModalOpen(true);
                        }}
                        className="cx-btn cx-btn-outline cx-btn-sm"
                      >
                        <MessageSquare size={14} />
                        <span>Add Deliberation Note</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openRecommendationModal(rev)}
                        className="cx-btn cx-btn-primary cx-btn-sm"
                      >
                        <FileCheck size={14} />
                        <span>
                          {rev.submittedRecommendation
                            ? 'View Recommendation'
                            : rev.recommendationDraft
                            ? 'Edit Draft'
                            : 'Draft Recommendation'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReview(rev);
                          setIsInfoModalOpen(true);
                        }}
                        className="cx-btn cx-btn-outline cx-btn-sm"
                      >
                        <HelpCircle size={14} />
                        <span>Request Info</span>
                      </button>
                      <Link to={`/cases/${rev.caseNumber}`} className="btn btn-sm btn-light border" title="Inspect Docket">
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* Panel Details: Considered Documents & Notes */}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="small fw-bold text-muted mb-1.5">Documents & Evidence Under Inspection:</div>
                      {(!rev.documentsConsidered || rev.documentsConsidered.length === 0) ? (
                        <div className="small text-muted fst-italic">No documents tagged yet.</div>
                      ) : (
                        <div className="d-flex flex-wrap gap-1.5">
                          {rev.documentsConsidered.map((doc, idx) => (
                            <span key={idx} className="badge bg-light text-dark border">
                              <FileText size={11} className="me-1 text-muted" />
                              {doc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="small fw-bold text-muted mb-1.5">
                        Deliberation Notes ({rev.notes?.length || 0}):
                      </div>
                      {(!rev.notes || rev.notes.length === 0) ? (
                        <div className="small text-muted fst-italic">No confidential committee notes recorded yet.</div>
                      ) : (
                        <div className="p-2.5 rounded-2 bg-light border text-muted small" style={{ fontSize: '0.8rem' }}>
                          <strong className="text-dark">{rev.notes[rev.notes.length - 1].author}:</strong> "
                          {rev.notes[rev.notes.length - 1].text}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recommendation preview if submitted */}
                  {rev.submittedRecommendation && (
                    <div className="mt-3 p-3 rounded-2 bg-success-subtle border border-success-subtle text-success small">
                      <div className="fw-bold mb-1 d-flex align-items-center gap-1.5">
                        <ShieldCheck size={15} />
                        <span>Formal Recommendation Submitted to Dean of Student Affairs:</span>
                      </div>
                      <div>
                        <strong>Category:</strong> {rev.submittedRecommendation.category}
                      </div>
                      <div className="mt-0.5">
                        <strong>Sanction / Action:</strong> {rev.submittedRecommendation.proposedSanction}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DELIBERATIONS & RECOMMENDATIONS */}
      {activeTab === 'deliberations' && (
        <div className="cx-card p-4">
          <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
            <div>
              <h2 className="h6 fw-bold text-dark mb-1">Committee Sanctions & Institutional Recommendations</h2>
              <p className="small text-muted mb-0">
                Formal recommendations prepared under institutional statutory guidelines. All submissions require Dean
                or Proctorial Board final executive ratification.
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="cx-table">
              <thead>
                <tr>
                  <th>Case Ref</th>
                  <th>Incident Matter</th>
                  <th>Recommendation Category</th>
                  <th>Proposed Sanction</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((rev) => {
                  const rec = rev.submittedRecommendation || rev.recommendationDraft;
                  return (
                    <tr key={rev.id}>
                      <td>
                        <Link
                          to={`/cases/${rev.caseNumber}`}
                          className="cx-font-mono fw-bold text-decoration-none"
                          style={{ color: 'var(--cx-teal-700)' }}
                        >
                          {rev.caseNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '240px' }}>
                          {rev.title}
                        </div>
                        <div className="small text-muted">{rev.category}</div>
                      </td>
                      <td>
                        {rec ? (
                          <span className="small fw-semibold text-dark">{rec.category}</span>
                        ) : (
                          <span className="small text-muted fst-italic">Pending Deliberation</span>
                        )}
                      </td>
                      <td>
                        <div className="small text-muted text-truncate" style={{ maxWidth: '280px' }}>
                          {rec ? rec.proposedSanction || rec.rationale : '—'}
                        </div>
                      </td>
                      <td>
                        {rev.submittedRecommendation ? (
                          <span className="badge bg-success-subtle text-success">Submitted</span>
                        ) : rev.recommendationDraft ? (
                          <span className="badge bg-warning-subtle text-warning">Draft</span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary">Awaiting Draft</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => openRecommendationModal(rev)}
                          className="cx-btn cx-btn-outline cx-btn-sm"
                        >
                          {rec ? 'Review / Edit' : 'Draft'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULED HEARINGS */}
      {activeTab === 'hearings' && (
        <div className="cx-card p-4">
          <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
            <div>
              <h2 className="h6 fw-bold text-dark mb-1">Active Committee Hearings Roster</h2>
              <p className="small text-muted mb-0">
                Formally scheduled summons and hearings where Disciplinary Committee presence is mandated.
              </p>
            </div>
            <Link to="/committee/timeline" className="cx-btn cx-btn-teal cx-btn-sm">
              <Calendar size={14} />
              <span>Open Hearing Calendar</span>
            </Link>
          </div>

          <div className="table-responsive">
            <table className="cx-table">
              <thead>
                <tr>
                  <th>Hearing ID</th>
                  <th>Case Ref</th>
                  <th>Date & Time</th>
                  <th>Venue & Mode</th>
                  <th>Presiding Authority</th>
                  <th>Status</th>
                  <th>Minutes</th>
                </tr>
              </thead>
              <tbody>
                {hearings.map((h) => (
                  <tr key={h.id}>
                    <td className="cx-font-mono fw-bold text-dark">{h.hearingNumber}</td>
                    <td>
                      <Link
                        to={`/cases/${h.caseNumber}`}
                        className="cx-font-mono fw-semibold text-decoration-none"
                        style={{ color: 'var(--cx-teal-700)' }}
                      >
                        {h.caseNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{h.date}</div>
                      <div className="small text-muted">
                        {h.time} – {h.endTime || 'Close'}
                      </div>
                    </td>
                    <td>
                      <div className="small text-dark">{h.venue}</div>
                      <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.7rem' }}>
                        {h.mode}
                      </span>
                    </td>
                    <td>
                      <div className="small text-dark">{h.presidingAuthority}</div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          h.status === 'COMPLETED'
                            ? 'bg-success-subtle text-success'
                            : h.status === 'AWAITING_MINUTES'
                            ? 'bg-warning-subtle text-warning'
                            : 'bg-primary-subtle text-primary'
                        }`}
                      >
                        {h.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {h.minutes ? (
                        <span className="badge bg-success-subtle text-success">
                          {h.minutes.draft ? 'Draft Saved' : 'Submitted'}
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD DELIBERATION NOTE */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={`Add Deliberation Note: ${selectedReview?.caseNumber || ''}`}
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(false)}
              className="cx-btn cx-btn-outline"
              disabled={isActionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddNoteSubmit}
              className="cx-btn cx-btn-primary"
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Saving...' : 'Save Deliberation Note'}
            </button>
          </div>
        }
      >
        <div className="p-3 bg-light rounded-3 mb-3 small text-muted">
          Deliberation notes are recorded into the confidential proctorial board session log and attributed to{' '}
          <strong>{currentUser?.name}</strong>.
        </div>
        <div className="mb-3">
          <label htmlFor="deliberation-note-input" className="cx-form-label">
            Inquiry Observation / Deliberation Note <span className="text-danger">*</span>
          </label>
          <textarea
            id="deliberation-note-input"
            className="cx-input"
            rows={4}
            placeholder="Record observations, witness testimony inconsistencies, or procedural remarks..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
        </div>
      </Modal>

      {/* MODAL 2: DRAFT / SUBMIT RECOMMENDATION */}
      <Modal
        isOpen={isRecommendationModalOpen}
        onClose={() => setIsRecommendationModalOpen(false)}
        title={`Committee Recommendation: ${selectedReview?.caseNumber || ''}`}
        size="lg"
        footer={
          <div className="d-flex align-items-center justify-content-between w-100">
            <button
              type="button"
              onClick={() => setIsRecommendationModalOpen(false)}
              className="cx-btn cx-btn-outline"
              disabled={isActionLoading}
            >
              Cancel
            </button>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveRecommendation(false)}
                className="cx-btn cx-btn-outline"
                disabled={isActionLoading}
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveRecommendation(true)}
                className="cx-btn cx-btn-teal"
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Submitting...' : 'Submit Formal Recommendation'}
              </button>
            </div>
          </div>
        }
      >
        <div className="p-3 bg-light rounded-3 mb-3 small text-muted">
          Under CIVNEXA governance, the Disciplinary Committee's formal recommendation serves as statutory counsel to
          the Dean of Student Affairs. Submitting this recommendation marks the review as{' '}
          <code>RECOMMENDATION_SUBMITTED</code>.
        </div>

        <div className="mb-3">
          <label htmlFor="rec-category-select" className="cx-form-label">
            Recommendation Category <span className="text-danger">*</span>
          </label>
          <select
            id="rec-category-select"
            className="cx-select"
            value={recCategory}
            onChange={(e) => setRecCategory(e.target.value)}
          >
            <option value="No further action recommended">No further action recommended (Exoneration)</option>
            <option value="Additional investigation required">Additional investigation required</option>
            <option value="Counseling or mentoring recommended">Counseling or mentoring recommended</option>
            <option value="Further administrative review recommended">Further administrative review recommended</option>
            <option value="Institutional policy-based action recommended">
              Institutional policy-based action recommended
            </option>
            <option value="Other authorized recommendation">Other authorized recommendation</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="rec-rationale-input" className="cx-form-label">
            Supporting Rationale & Findings <span className="text-danger">*</span>
          </label>
          <textarea
            id="rec-rationale-input"
            className="cx-input"
            rows={4}
            placeholder="Document the evidential basis, mitigating circumstances, and justification..."
            value={recRationale}
            onChange={(e) => setRecRationale(e.target.value)}
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="rec-sanction-input" className="cx-form-label">
              Proposed Sanction / Remedy
            </label>
            <input
              id="rec-sanction-input"
              type="text"
              className="cx-input"
              placeholder="e.g. Course credit cancel, Community service, Warning letter"
              value={recSanction}
              onChange={(e) => setRecSanction(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="rec-followup-input" className="cx-form-label">
              Required Follow-up / Monitoring
            </label>
            <input
              id="rec-followup-input"
              type="text"
              className="cx-input"
              placeholder="e.g. Counseling compliance report in 30 days"
              value={recFollowUp}
              onChange={(e) => setRecFollowUp(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="rec-members-input" className="cx-form-label">
            Participating Committee Members (Comma-separated)
          </label>
          <input
            id="rec-members-input"
            type="text"
            className="cx-input"
            placeholder="Dr. Alok Nath, Prof. Sunita Mehta, Rajesh Verma"
            value={recMembers}
            onChange={(e) => setRecMembers(e.target.value)}
          />
        </div>
      </Modal>

      {/* MODAL 3: REQUEST ADDITIONAL INFO */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title={`Request Additional Information: ${selectedReview?.caseNumber || ''}`}
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsInfoModalOpen(false)}
              className="cx-btn cx-btn-outline"
              disabled={isActionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRequestInfoSubmit}
              className="cx-btn cx-btn-primary"
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Dispatching...' : 'Dispatch Request'}
            </button>
          </div>
        }
      >
        <div className="mb-3">
          <label htmlFor="info-target-select" className="cx-form-label">
            Request Directed To
          </label>
          <select
            id="info-target-select"
            className="cx-select"
            value={infoTarget}
            onChange={(e) => setInfoTarget(e.target.value)}
          >
            <option value="Lead Investigator">Lead Investigator / Proctor</option>
            <option value="Subject Student">Subject Student</option>
            <option value="Complainant / Reporter">Complainant / Reporter</option>
            <option value="Hostel Warden">Hostel Warden</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="info-details-input" className="cx-form-label">
            Specific Clarification or Document Required <span className="text-danger">*</span>
          </label>
          <textarea
            id="info-details-input"
            className="cx-input"
            rows={4}
            placeholder="Specify what additional laboratory logs, witness clarification, or medical receipts are required..."
            value={infoDetails}
            onChange={(e) => setInfoDetails(e.target.value)}
          />
        </div>
      </Modal>
    </AnimatedPage>
  );
};

export default CommitteeDashboardPage;
