import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Plus,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FolderKanban,
  FileCheck,
  Send,
  Eye,
  X,
  UploadCloud,
  FileUp,
  MessageSquare,
  Lock,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import appealService from '../../services/appealService';

/**
 * StudentAppealsPage Component (/student/appeals)
 * Full interactive appellate review and reconsideration management portal for students.
 */
export const StudentAppealsPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [appeals, setAppeals] = useState([]);
  const [eligibleCases, setEligibleCases] = useState([]);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Appeal Submission Wizard Form State
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedGrounds, setSelectedGrounds] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [reliefSought, setReliefSought] = useState('');
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groundsList = appealService.getGrounds();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appealsData, casesData] = await Promise.all([
        appealService.getAppeals({ currentUser }),
        appealService.getEligibleCasesForAppeal(currentUser?.id, currentUser),
      ]);
      setAppeals(appealsData);
      setEligibleCases(casesData);
      if (casesData.length > 0 && !selectedCaseId) {
        setSelectedCaseId(casesData[0].id);
      }
    } catch (err) {
      console.error('Failed to load appeals data', err);
      toast.error('Unable to retrieve appellate records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleToggleGround = (groundKey) => {
    setSelectedGrounds((prev) =>
      prev.includes(groundKey)
        ? prev.filter((k) => k !== groundKey)
        : [...prev, groundKey]
    );
  };

  const handleSimulateFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const newDoc = {
        id: `DOC-${Date.now()}`,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        type: file.type || 'application/pdf',
        uploadedAt: new Date().toISOString(),
      };
      setSupportingDocs((prev) => [...prev, newDoc]);
      toast.success(`Attached exhibit: ${file.name}`);
    }
  };

  const handleRemoveDoc = (docId) => {
    setSupportingDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    if (!selectedCaseId) {
      toast.error('Please select an eligible disciplinary matter to appeal.');
      return;
    }
    if (selectedGrounds.length === 0) {
      toast.error('Please select at least one ground for appeal.');
      return;
    }
    if (explanation.trim().length < 20) {
      toast.error('Detailed explanation of at least 20 characters is required.');
      return;
    }
    if (!declarationAccepted) {
      toast.error('Please confirm the formal accuracy declaration.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetCase = eligibleCases.find((c) => c.id === selectedCaseId);
      const newAppeal = await appealService.submitAppeal({
        caseId: selectedCaseId,
        caseNumber: targetCase?.caseNumber || selectedCaseId,
        caseTitle: targetCase?.title || 'Disciplinary Inquiry',
        originalDecision: {
          decisionDate: targetCase?.updatedAt || new Date().toISOString(),
          decisionSummary: targetCase?.investigation?.nextAction || 'Proctorial reprimand and ongoing disciplinary inquiry.',
          sanctionType: 'FORMAL_SANCTION',
          decidedBy: targetCase?.investigation?.investigator || 'Disciplinary Committee',
        },
        grounds: selectedGrounds,
        explanation,
        reliefSought,
        supportingDocuments: supportingDocs,
        appellant: {
          id: currentUser?.id || 'STU-8821',
          name: currentUser?.name || 'Aarav Sharma',
          rollNo: currentUser?.rollNo || '22CSE041',
          email: currentUser?.email || 'aarav.sharma@civnexa.edu',
          department: currentUser?.department || 'Computer Science & Engineering',
          departmentCode: currentUser?.departmentCode || 'CSE',
        },
        currentUser,
      });

      setSubmissionResult(newAppeal);
      setWizardStep(4); // Confirmation screen
      toast.success(`Appellate petition ${newAppeal.appealNumber} lodged successfully.`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit appeal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenInfoResponse = (appeal, req) => {
    setSelectedAppeal(appeal);
    setActiveRequest(req);
    setResponseText('');
    setIsResponseModalOpen(true);
  };

  const handleSubmitInfoResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      toast.error('Please provide a clarification statement.');
      return;
    }

    try {
      await appealService.submitAdditionalInfo(
        selectedAppeal.id,
        activeRequest.id,
        { responseText: responseText.trim(), documents: [] },
        currentUser
      );
      toast.success('Clarification statement delivered to Appellate Reviewer.');
      setIsResponseModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit response.');
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedGrounds([]);
    setExplanation('');
    setReliefSought('');
    setSupportingDocs([]);
    setDeclarationAccepted(false);
    setSubmissionResult(null);
    setIsSubmitModalOpen(false);
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Institutional Decision Appeals & Appellate Review"
        subtitle="Independent administrative and ombudsman review of proctorial and disciplinary determinations."
        breadcrumbs={[{ label: 'Student Portal' }, { label: 'Appeals' }]}
        badge={
          <span className="badge bg-teal text-white px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            Student Appeals
          </span>
        }
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link to="/policies" className="cx-btn cx-btn-outline text-decoration-none">
              <FileText size={15} />
              <span>Appellate Code of Practice</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                resetWizard();
                setIsSubmitModalOpen(true);
              }}
              className="cx-btn cx-btn-teal"
            >
              <Plus size={15} />
              <span>Lodge New Appeal</span>
            </button>
          </div>
        }
      />

      {/* Prominent Architectural Banner */}
      <div className="cx-card mb-4 border-0 shadow-sm" style={{ borderLeft: '4px solid #0D9488' }}>
        <div className="cx-card-body p-4">
          <div className="d-flex align-items-start gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-teal"
              style={{ width: '48px', height: '48px', backgroundColor: 'rgba(13, 148, 136, 0.12)', flexShrink: 0 }}
            >
              <Scale size={24} />
            </div>

            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h2 className="h5 fw-bold text-dark mb-0">Appeals & Reconsideration</h2>
                <span className="badge bg-success-subtle text-success border px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                  Appellate Inquiries
                </span>
              </div>
              <p className="text-secondary small mb-3" style={{ fontSize: '0.825rem', lineHeight: '1.5' }}>
                Students may lodge structured appeals against proctorial determinations within 14 calendar days of sanction issue. The appellate process preserves the original case record while assigning an independent authority for substantive review.
              </p>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetWizard();
                    setIsSubmitModalOpen(true);
                  }}
                  className="cx-btn cx-btn-teal cx-btn-sm"
                >
                  <Plus size={13} />
                  <span>File Appeal Petition</span>
                </button>
                <Link to="/cases" className="cx-btn cx-btn-outline cx-btn-sm text-decoration-none">
                  <span>View Original Case Dockets</span>
                  <ArrowRight size={13} />
                </Link>
                <Link to="/student/support" className="cx-btn cx-btn-outline cx-btn-sm text-decoration-none">
                  <span>Contact Student Welfare Desk</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Grounds for Appeal Guide */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="cx-card h-100 p-3.5 border bg-white shadow-sm">
            <div className="d-flex align-items-center gap-2 mb-2">
              <Scale size={18} className="text-teal" />
              <h3 className="h6 fw-bold text-dark mb-0">Grounds for Appeal</h3>
            </div>
            <p className="text-muted small mb-0" style={{ fontSize: '0.78rem', lineHeight: '1.45' }}>
              Appeals may be lodged on substantiated grounds of procedural irregularity, demonstrable bias, new evidentiary discoveries not previously available, or manifestly disproportionate sanctions.
            </p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="cx-card h-100 p-3.5 border bg-white shadow-sm">
            <div className="d-flex align-items-center gap-2 mb-2">
              <Clock size={18} className="text-warning" />
              <h3 className="h6 fw-bold text-dark mb-0">Appellate Timelines</h3>
            </div>
            <p className="text-muted small mb-0" style={{ fontSize: '0.78rem', lineHeight: '1.45' }}>
              Appeals must be submitted within 14 calendar days of receiving formal sanction determination from the Disciplinary Committee. Automatic stays of execution apply during review.
            </p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="cx-card h-100 p-3.5 border bg-white shadow-sm">
            <div className="d-flex align-items-center gap-2 mb-2">
              <ShieldCheck size={18} className="text-primary" />
              <h3 className="h6 fw-bold text-dark mb-0">Independent Review</h3>
            </div>
            <p className="text-muted small mb-0" style={{ fontSize: '0.78rem', lineHeight: '1.45' }}>
              All petitions are reviewed by the Appellate Tribunal or Office of the Dean. Conflict-of-interest safeguards ensure the original investigator cannot sit as the sole appeal authority.
            </p>
          </div>
        </div>
      </div>

      {/* Active Student Appeals List */}
      <div className="cx-card mb-4">
        <div className="cx-card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Scale size={18} className="text-teal" />
            <h2 className="h6 mb-0 fw-bold">My Filed Appellate Dockets & Inquiries</h2>
          </div>
          <span className="badge bg-light text-dark border">{appeals.length} Petitions on Record</span>
        </div>

        <div className="cx-card-body p-0">
          {isLoading ? (
            <div className="p-4 text-center text-muted">
              <div className="spinner-border spinner-border-sm text-teal me-2" role="status" />
              <span>Loading appellate records...</span>
            </div>
          ) : appeals.length === 0 ? (
            <div className="p-5 text-center">
              <FileCheck size={36} className="text-muted mb-2 opacity-50" />
              <h3 className="h6 fw-bold text-dark mb-1">No Active Appeals Filed</h3>
              <p className="text-muted small mb-3" style={{ maxWidth: '420px', margin: '0 auto' }}>
                You have not lodged any appeals against campus disciplinary decisions. You can initiate a petition if you have received a formal sanction.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetWizard();
                  setIsSubmitModalOpen(true);
                }}
                className="cx-btn cx-btn-teal cx-btn-sm"
              >
                <Plus size={14} />
                <span>Lodge an Appeal</span>
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cx-table align-middle">
                <thead>
                  <tr>
                    <th>Appeal Ref</th>
                    <th>Related Case</th>
                    <th>Grounds</th>
                    <th>Submission Date</th>
                    <th>Reviewer</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appeals.map((appeal) => {
                    const pendingInfoRequest = (appeal.additionalInfoRequests || []).find(
                      (r) => r.status === 'PENDING_STUDENT_SUBMISSION'
                    );

                    return (
                      <tr key={appeal.id}>
                        <td>
                          <span className="fw-bold cx-font-mono text-dark">{appeal.appealNumber}</span>
                        </td>
                        <td>
                          <div>
                            <span className="badge bg-secondary-subtle text-secondary me-1">
                              {appeal.caseNumber}
                            </span>
                            <span className="small text-dark fw-medium text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                              {appeal.caseTitle}
                            </span>
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Challenging: {appeal.originalDecision?.sanctionType?.replace(/_/g, ' ') || 'Sanction'}
                          </div>
                        </td>
                        <td>
                          <span className="small text-secondary" style={{ fontSize: '0.78rem' }}>
                            {appeal.groundsSummary}
                          </span>
                        </td>
                        <td>
                          <span className="small text-muted">
                            {new Date(appeal.submittedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          {appeal.assignedReviewer ? (
                            <span className="small text-dark fw-medium">
                              {appeal.assignedReviewer.name}
                            </span>
                          ) : (
                            <span className="small text-muted fst-italic">Pending Assignment</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={appeal.status} label={appeal.statusLabel} />
                          {pendingInfoRequest && (
                            <div className="mt-1">
                              <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
                                Action Required
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedAppeal(appeal)}
                              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 py-1 px-2"
                              style={{ fontSize: '0.75rem' }}
                            >
                              <Eye size={12} />
                              <span>View File</span>
                            </button>

                            {pendingInfoRequest && (
                              <button
                                type="button"
                                onClick={() => handleOpenInfoResponse(appeal, pendingInfoRequest)}
                                className="btn btn-sm btn-warning d-flex align-items-center gap-1 py-1 px-2 fw-semibold"
                                style={{ fontSize: '0.75rem' }}
                              >
                                <MessageSquare size={12} />
                                <span>Respond</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Appeal Detail Inspection Modal */}
      {selectedAppeal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      Appellate Docket: {selectedAppeal.appealNumber}
                    </h5>
                    <StatusBadge status={selectedAppeal.status} label={selectedAppeal.statusLabel} />
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Challenging Decision in Case {selectedAppeal.caseNumber} • Preserved on Record
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedAppeal(null)}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Original Preserved Decision Box */}
                <div className="p-3 bg-light rounded border mb-3">
                  <div className="d-flex align-items-center gap-2 text-secondary mb-1">
                    <Lock size={14} />
                    <strong style={{ fontSize: '0.8rem' }}>Original Decision on Record (Preserved)</strong>
                  </div>
                  <p className="text-dark small mb-1">
                    {selectedAppeal.originalDecision?.decisionSummary}
                  </p>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Issued by: {selectedAppeal.originalDecision?.decidedBy} on{' '}
                    {new Date(selectedAppeal.originalDecision?.decisionDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Appeal Grounds & Statement */}
                <div className="mb-3">
                  <h6 className="fw-bold text-dark small mb-1">Grounds for Appeal:</h6>
                  <p className="text-teal fw-semibold small mb-2">{selectedAppeal.groundsSummary}</p>

                  <h6 className="fw-bold text-dark small mb-1">Appellant Explanation & Procedural Concern:</h6>
                  <div className="p-3 bg-white rounded border small text-secondary mb-3">
                    {selectedAppeal.explanation}
                  </div>

                  <h6 className="fw-bold text-dark small mb-1">Relief Sought:</h6>
                  <p className="small text-dark mb-3">{selectedAppeal.reliefSought}</p>

                  {/* Supporting Documents */}
                  {selectedAppeal.supportingDocuments?.length > 0 && (
                    <div className="mb-3">
                      <h6 className="fw-bold text-dark small mb-1">Supporting Documentation / Exhibits:</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedAppeal.supportingDocuments.map((doc) => (
                          <span
                            key={doc.id}
                            className="badge bg-light text-dark border d-flex align-items-center gap-1.5 py-1.5 px-2"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <FileText size={12} className="text-teal" />
                            <span>{doc.name}</span>
                            <span className="text-muted">({doc.size})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Authorized Outcome (if completed) */}
                {selectedAppeal.finalOutcome && (
                  <div className="p-3 bg-success-subtle rounded border border-success mb-3">
                    <div className="d-flex align-items-center gap-2 text-success fw-bold mb-1">
                      <CheckCircle2 size={16} />
                      <span>Final Authorized Outcome: {selectedAppeal.statusLabel}</span>
                    </div>
                    <p className="small text-dark mb-1">{selectedAppeal.finalOutcome.justification}</p>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Authorized by: {selectedAppeal.finalOutcome.authorizedBy} on{' '}
                      {new Date(selectedAppeal.finalOutcome.authorizedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Chronological Audit Timeline */}
                <h6 className="fw-bold text-dark small mb-2">Chronological Appellate History:</h6>
                <div className="border-start border-2 border-teal ps-3 ms-2">
                  {(selectedAppeal.timeline || []).map((tl) => (
                    <div key={tl.id} className="mb-3 position-relative">
                      <div
                        className="position-absolute rounded-circle bg-teal"
                        style={{ width: '8px', height: '8px', left: '-17px', top: '5px' }}
                      />
                      <div className="d-flex align-items-center justify-content-between">
                        <strong className="text-dark small">{tl.title}</strong>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {new Date(tl.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-secondary small mb-0" style={{ fontSize: '0.78rem' }}>
                        {tl.explanation}
                      </p>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        Actor: {tl.actor}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer border-top py-2 px-4">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedAppeal(null)}
                >
                  Close File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Step Appeal Submission Wizard Modal */}
      {isSubmitModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    Lodge an Appellate Review Petition
                  </h5>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Step {wizardStep} of 4 • CIVNEXA Disciplinary Dispute Resolution
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsSubmitModalOpen(false)}
                  aria-label="Close"
                />
              </div>

              {/* Wizard Steps Indicator */}
              <div className="px-4 pt-3 pb-2 bg-light border-bottom">
                <div className="d-flex align-items-center justify-content-between">
                  <div className={`small fw-bold ${wizardStep === 1 ? 'text-teal' : 'text-muted'}`}>
                    1. Select Matter
                  </div>
                  <div className="text-muted small">→</div>
                  <div className={`small fw-bold ${wizardStep === 2 ? 'text-teal' : 'text-muted'}`}>
                    2. Grounds & Details
                  </div>
                  <div className="text-muted small">→</div>
                  <div className={`small fw-bold ${wizardStep === 3 ? 'text-teal' : 'text-muted'}`}>
                    3. Review & Declare
                  </div>
                  <div className="text-muted small">→</div>
                  <div className={`small fw-bold ${wizardStep === 4 ? 'text-teal' : 'text-muted'}`}>
                    4. Confirmation
                  </div>
                </div>
              </div>

              <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                {wizardStep === 1 && (
                  <div>
                    <h6 className="fw-bold text-dark mb-2">Select Disciplinary Matter Being Challenged:</h6>
                    <p className="text-muted small mb-3">
                      Select an eligible case where you have received a formal sanction, reprimand, or interim measure.
                    </p>

                    {eligibleCases.length === 0 ? (
                      <div className="p-4 text-center bg-light rounded border">
                        <AlertTriangle size={32} className="text-warning mb-2" />
                        <h6 className="text-dark fw-bold">No Eligible Disciplinary Decisions Found</h6>
                        <p className="text-muted small mb-0">
                          You do not currently have any closed or sanctioned matters on your student profile.
                        </p>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2 mb-3">
                        {eligibleCases.map((c) => (
                          <label
                            key={c.id}
                            className={`p-3 rounded border d-flex align-items-start gap-3 cursor-pointer ${
                              selectedCaseId === c.id ? 'border-teal bg-teal-subtle' : 'bg-white'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <input
                              type="radio"
                              name="appealCase"
                              className="form-check-input mt-1"
                              checked={selectedCaseId === c.id}
                              onChange={() => setSelectedCaseId(c.id)}
                            />
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="fw-bold text-dark small">{c.caseNumber}: {c.title}</span>
                                <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>
                                  {c.category}
                                </span>
                              </div>
                              <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>
                                Priority: {c.priority} • Status: {c.statusLabel || c.status}
                              </p>
                              <div className="text-secondary small fst-italic" style={{ fontSize: '0.72rem' }}>
                                Original Decision Preserved: {c.investigation?.nextAction || 'Proctorial disciplinary sanction.'}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {wizardStep === 2 && (
                  <div>
                    <h6 className="fw-bold text-dark mb-2">Statutory Grounds for Appeal:</h6>
                    <p className="text-muted small mb-3">
                      Select all grounds that apply to your appeal (at least one is required):
                    </p>

                    <div className="row g-2 mb-4">
                      {groundsList.map((g) => (
                        <div key={g.key} className="col-12 col-md-6">
                          <label
                            className={`p-2.5 rounded border d-flex align-items-start gap-2 h-100 ${
                              selectedGrounds.includes(g.key) ? 'border-teal bg-teal-subtle' : 'bg-white'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input mt-1"
                              checked={selectedGrounds.includes(g.key)}
                              onChange={() => handleToggleGround(g.key)}
                            />
                            <div>
                              <strong className="text-dark small d-block">{g.label}</strong>
                              <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                                {g.description}
                              </span>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="mb-3">
                      <label className="cx-form-label fw-bold">
                        Detailed Explanation of Concern / Procedural Flaw <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows="4"
                        placeholder="State clearly why the original decision was flawed, disproportionate, or procedurally irregular (minimum 20 characters)..."
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                      />
                      <div className="d-flex justify-content-between text-muted small mt-1" style={{ fontSize: '0.7rem' }}>
                        <span>Provide specific factual points and dates</span>
                        <span>{explanation.length} characters</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="cx-form-label fw-bold">Specific Reconsideration or Relief Sought</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Exoneration, reduction of suspension period, or waiver of fine"
                        value={reliefSought}
                        onChange={(e) => setReliefSought(e.target.value)}
                      />
                    </div>

                    {/* Supporting Documents Upload */}
                    <div className="mb-3">
                      <label className="cx-form-label fw-bold">Supporting Documentation & Evidentiary Exhibits</label>
                      <div className="p-3 border border-dashed rounded text-center bg-light">
                        <UploadCloud size={24} className="text-teal mb-1" />
                        <div className="small text-muted mb-2">Upload train tickets, medical receipts, witness statements (PDF, JPG, PNG)</div>
                        <label className="btn btn-sm btn-outline-secondary mb-0">
                          <span>Browse Files</span>
                          <input type="file" className="d-none" onChange={handleSimulateFileUpload} />
                        </label>
                      </div>

                      {supportingDocs.length > 0 && (
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {supportingDocs.map((doc) => (
                            <span key={doc.id} className="badge bg-white text-dark border d-flex align-items-center gap-1.5 p-1.5">
                              <FileText size={12} className="text-teal" />
                              <span>{doc.name}</span>
                              <button
                                type="button"
                                className="btn-close btn-close-white ms-1"
                                style={{ width: '8px', height: '8px' }}
                                onClick={() => handleRemoveDoc(doc.id)}
                              />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div>
                    <h6 className="fw-bold text-dark mb-2">Pre-Submission Review & Formal Declaration:</h6>
                    <div className="p-3 bg-light rounded border mb-3 small">
                      <div className="row g-2">
                        <div className="col-sm-4 text-muted">Challenged Case:</div>
                        <div className="col-sm-8 fw-semibold text-dark">{selectedCaseId}</div>

                        <div className="col-sm-4 text-muted">Selected Grounds:</div>
                        <div className="col-sm-8 fw-semibold text-teal">
                          {groundsList
                            .filter((g) => selectedGrounds.includes(g.key))
                            .map((g) => g.label)
                            .join(', ')}
                        </div>

                        <div className="col-sm-4 text-muted">Appellant:</div>
                        <div className="col-sm-8 text-dark">
                          {currentUser?.name || 'Aarav Sharma'} ({currentUser?.rollNo || '22CSE041'})
                        </div>

                        <div className="col-sm-4 text-muted">Relief Sought:</div>
                        <div className="col-sm-8 text-dark">{reliefSought || 'General Reconsideration'}</div>

                        <div className="col-sm-4 text-muted">Attached Exhibits:</div>
                        <div className="col-sm-8 text-dark">{supportingDocs.length} file(s) attached</div>
                      </div>
                    </div>

                    <div className="p-3 border rounded bg-white mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="appellateDeclaration"
                          className="form-check-input"
                          checked={declarationAccepted}
                          onChange={(e) => setDeclarationAccepted(e.target.checked)}
                        />
                        <label htmlFor="appellateDeclaration" className="form-check-label small text-secondary">
                          <strong>Formal Truthfulness & Due Process Declaration:</strong> I hereby declare that the grounds and facts presented in this petition are truthful to the best of my knowledge. I understand that submitting fraudulent or fabricated exhibits constitutes a distinct breach of the Student Code of Conduct.
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 4 && submissionResult && (
                  <div className="p-4 text-center">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-success text-white mx-auto mb-3"
                      style={{ width: '56px', height: '56px' }}
                    >
                      <CheckCircle2 size={32} />
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Appellate Petition Lodged Successfully!</h5>
                    <p className="text-muted small mb-3">
                      Your appeal reference has been generated and queued for independent ombudsman assessment.
                    </p>

                    <div className="p-3 bg-light rounded border text-start mb-3 small" style={{ maxWidth: '450px', margin: '0 auto' }}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Appeal Docket Number:</span>
                        <strong className="text-teal cx-font-mono">{submissionResult.appealNumber}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Challenged Case:</span>
                        <span className="text-dark fw-medium">{submissionResult.caseNumber}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Original Sanction Record:</span>
                        <span className="badge bg-secondary-subtle text-secondary">Preserved Intact</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Submission Date:</span>
                        <span className="text-dark">{new Date(submissionResult.submittedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top py-2 px-4 d-flex justify-content-between">
                {wizardStep > 1 && wizardStep < 4 ? (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setWizardStep((prev) => prev - 1)}
                  >
                    Back
                  </button>
                ) : <div />}

                <div>
                  {wizardStep < 3 && (
                    <button
                      type="button"
                      className="btn btn-teal btn-sm"
                      onClick={() => {
                        if (wizardStep === 1 && !selectedCaseId) {
                          toast.error('Please select a case to proceed.');
                          return;
                        }
                        if (wizardStep === 2) {
                          if (selectedGrounds.length === 0) {
                            toast.error('Select at least one ground for appeal.');
                            return;
                          }
                          if (explanation.trim().length < 20) {
                            toast.error('Please provide an explanation of at least 20 characters.');
                            return;
                          }
                        }
                        setWizardStep((prev) => prev + 1);
                      }}
                    >
                      <span>Continue</span>
                      <ArrowRight size={13} className="ms-1" />
                    </button>
                  )}

                  {wizardStep === 3 && (
                    <button
                      type="button"
                      disabled={isSubmitting || !declarationAccepted}
                      onClick={handleSubmitAppeal}
                      className="btn btn-teal btn-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} className="me-1" />
                          <span>Submit Official Appeal</span>
                        </>
                      )}
                    </button>
                  )}

                  {wizardStep === 4 && (
                    <button
                      type="button"
                      className="btn btn-teal btn-sm"
                      onClick={() => setIsSubmitModalOpen(false)}
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information Response Modal */}
      {isResponseModalOpen && activeRequest && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  Respond to Appellate Inquiry
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsResponseModalOpen(false)}
                  aria-label="Close"
                />
              </div>

              <form onSubmit={handleSubmitInfoResponse}>
                <div className="modal-body p-4">
                  <div className="p-3 bg-warning-subtle rounded border border-warning mb-3">
                    <strong className="text-warning-emphasis small d-block mb-1">Reviewer Request:</strong>
                    <p className="text-dark small mb-0">{activeRequest.query}</p>
                    <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                      Requested by {activeRequest.requestedBy}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Your Written Clarification:</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Type your response or explanation..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-4">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsResponseModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-teal btn-sm">
                    Submit Clarification
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

export default StudentAppealsPage;
