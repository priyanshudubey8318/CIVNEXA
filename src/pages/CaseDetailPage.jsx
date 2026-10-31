import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  ShieldAlert,
  Calendar,
  MapPin,
  User,
  UserCheck,
  FileText,
  Paperclip,
  History,
  MessageSquare,
  Scale,
  Send,
  Plus,
  ArrowLeft,
  Eye,
  FileCheck2,
  XCircle,
  RotateCcw,
  UserPlus,
  AlertCircle,
  FileQuestion,
  Lock,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { qrService } from '../services/qrService';
import AiCaseSummaryModal from '../components/ai/AiCaseSummaryModal';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import Modal from '../components/feedback/Modal';
import ConfirmDialog from '../components/feedback/ConfirmDialog';
import { FileUploader } from '../components/forms/FileUploader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import caseService from '../services/caseService';
import adminService from '../services/adminService';

export const CaseDetailPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [caseData, setCaseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(false);
  const [caseQrToken, setCaseQrToken] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyAction, setVerifyAction] = useState('VERIFY'); // 'VERIFY' | 'RETURN' | 'REJECT'
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyReason, setVerifyReason] = useState('');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const [isHearingModalOpen, setIsHearingModalOpen] = useState(false);
  const [hearingDate, setHearingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [hearingTime, setHearingTime] = useState('15:00');
  const [hearingVenue, setHearingVenue] = useState('Academic Ethics Committee Room 204');
  const [hearingMode, setHearingMode] = useState('In-Person');
  const [hearingNotes, setHearingNotes] = useState('');

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [investigationNoteText, setInvestigationNoteText] = useState('');

  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [studentExplanationText, setStudentExplanationText] = useState('');
  const [responseAttachments, setResponseAttachments] = useState([]);

  const [isRequestResponseModalOpen, setIsRequestResponseModalOpen] = useState(false);
  const [responseDeadline, setResponseDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [responsePrompt, setResponsePrompt] = useState('');

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveReason, setResolveReason] = useState('');

  // Evidence preview modal
  const [previewFile, setPreviewFile] = useState(null);

  const fetchCaseDetails = async () => {
    setIsLoading(true);
    try {
      const data = await caseService.getCaseById(caseId, currentUser);
      setCaseData(data);
      qrService.getCaseTrackingToken(caseId).then(setCaseQrToken).catch(() => {});
    } catch (err) {
      toast.error(err.message || 'Unable to load case record.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId, currentUser]);

  if (isLoading) {
    return (
      <AnimatedPage>
        <div className="p-5 text-center text-muted">
          <div className="spinner-border text-teal mb-3" role="status" />
          <div>Loading case docket {caseId}...</div>
        </div>
      </AnimatedPage>
    );
  }

  if (!caseData) {
    return (
      <AnimatedPage>
        <div className="cx-card p-5 text-center">
          <FileQuestion size={48} className="text-muted mb-3 mx-auto" />
          <h2 className="h5 fw-bold text-dark">Case Record Not Found</h2>
          <p className="text-muted small mb-4">The requested case reference "{caseId}" does not exist in the registry.</p>
          <Link to="/cases" className="cx-btn cx-btn-primary">
            Return to Case Registry
          </Link>
        </div>
      </AnimatedPage>
    );
  }

  // Permission helpers
  const userRole = currentUser?.role || 'STUDENT';
  const isDean = userRole === 'DEAN' || userRole === 'SUPER_ADMIN';
  const isHod = userRole === 'HOD';
  const isCommittee = userRole === 'COMMITTEE_MEMBER';
  const isInvestigator =
    isDean ||
    isHod ||
    isCommittee ||
    (caseData.assignedTo && caseData.assignedTo.id === currentUser?.id);
  const isSubjectStudent =
    userRole === 'STUDENT' &&
    (caseData.student?.id === currentUser?.id || caseData.student?.email === currentUser?.email);

  // Verification Queue Action Handler
  const handleVerifySubmit = async () => {
    try {
      const updated = await caseService.verifyCase(caseData.id, {
        action: verifyAction,
        notes: verifyNotes,
        reason: verifyReason,
        verifiedBy: currentUser,
      });
      setCaseData(updated);
      setIsVerifyModalOpen(false);
      setVerifyNotes('');
      setVerifyReason('');
      toast.success(`Case updated: ${updated.statusLabel}`);
    } catch (err) {
      toast.error(err.message || 'Verification action failed.');
    }
  };

  // Case Assignment Handler
  const handleAssignSubmit = async () => {
    const assignees = adminService.getUsers().filter((u) => u.role !== 'STUDENT');
    const selectedUser = assignees.find((u) => u.id === selectedAssigneeId);
    if (!selectedUser) {
      toast.error('Please choose a valid authority to assign.');
      return;
    }
    try {
      const updated = await caseService.assignCase(caseData.id, {
        assignee: selectedUser,
        assignedBy: currentUser,
        notes: assignNotes,
      });
      setCaseData(updated);
      setIsAssignModalOpen(false);
      setAssignNotes('');
      toast.success(`Case assigned to ${selectedUser.name}`);
    } catch (err) {
      toast.error(err.message || 'Assignment failed.');
    }
  };

  // Schedule Hearing Handler
  const handleScheduleHearingSubmit = async () => {
    try {
      const updated = await caseService.scheduleHearing(caseData.id, {
        date: hearingDate,
        time: hearingTime,
        venue: hearingVenue,
        mode: hearingMode,
        authorities: [currentUser?.name || 'Inquiry Officer'],
        notes: hearingNotes,
        scheduledBy: currentUser,
      });
      setCaseData(updated);
      setIsHearingModalOpen(false);
      setHearingNotes('');
      toast.success('Disciplinary hearing scheduled successfully.');
    } catch (err) {
      toast.error(err.message || 'Scheduling hearing failed.');
    }
  };

  // Add Investigation Note Handler
  const handleAddNoteSubmit = async () => {
    try {
      const updated = await caseService.addInvestigationNote(caseData.id, {
        noteText: investigationNoteText,
        author: currentUser,
      });
      setCaseData(updated);
      setIsNoteModalOpen(false);
      setInvestigationNoteText('');
      toast.success('Investigation note logged.');
    } catch (err) {
      toast.error(err.message || 'Failed to record note.');
    }
  };

  // Student Defense Response Submit Handler
  const handleStudentResponseSubmit = async () => {
    try {
      const updated = await caseService.submitStudentResponse(caseData.id, {
        explanationText: studentExplanationText,
        attachments: responseAttachments,
        student: currentUser,
      });
      setCaseData(updated);
      setIsResponseModalOpen(false);
      setStudentExplanationText('');
      setResponseAttachments([]);
      toast.success('Formal explanation submitted successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to submit response.');
    }
  };

  // Request Student Explanation Handler
  const handleRequestResponseSubmit = async () => {
    try {
      const updated = await caseService.requestStudentExplanation(caseData.id, {
        deadline: responseDeadline,
        promptNotes: responsePrompt,
        requestedBy: currentUser,
      });
      setCaseData(updated);
      setIsRequestResponseModalOpen(false);
      setResponsePrompt('');
      toast.success('Formal explanation summons dispatched to student.');
    } catch (err) {
      toast.error(err.message || 'Failed to request explanation.');
    }
  };

  // Resolve Case Handler
  const handleResolveCaseSubmit = async () => {
    try {
      const updated = await caseService.updateCaseStatus(
        caseData.id,
        'RESOLVED',
        'Resolved',
        currentUser,
        resolveReason || 'Case resolved after proctorial inquiry.'
      );
      setCaseData(updated);
      setIsResolveModalOpen(false);
      setResolveReason('');
      toast.success('Case formally resolved and marked complete.');
    } catch (err) {
      toast.error(err.message || 'Failed to resolve case.');
    }
  };

  return (
    <AnimatedPage>
      {/* Top Breadcrumb & Navigation */}
      <div className="mb-3 d-flex align-items-center justify-content-between">
        <Link
          to="/cases"
          className="text-decoration-none small d-inline-flex align-items-center gap-1.5 text-muted hover-underline"
        >
          <ArrowLeft size={14} />
          <span>Back to Case Registry</span>
        </Link>
        <span className="cx-font-mono small text-muted">ID: {caseData.id}</span>
      </div>

      {/* Case Header Card */}
      <div className="cx-card p-4 mb-4">
        <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className="cx-font-mono fw-bold fs-5" style={{ color: 'var(--cx-teal-700)' }}>
                {caseData.caseNumber}
              </span>
              <span className="badge bg-secondary-subtle text-secondary border">{caseData.category}</span>
              <PriorityBadge priority={caseData.priority} />
              <StatusBadge status={caseData.status} label={caseData.statusLabel} />
              {caseData.isConfidential && (
                <span className="badge bg-purple-subtle text-purple border d-inline-flex align-items-center gap-1">
                  <Lock size={12} />
                  <span>Confidential Case</span>
                </span>
              )}
            </div>

            <h1 className="h4 fw-bold text-dark mb-2">{caseData.title}</h1>

            <div className="d-flex flex-wrap align-items-center gap-3 text-muted small">
              <div className="d-flex align-items-center gap-1">
                <MapPin size={14} />
                <span>{caseData.location}</span>
              </div>
              <div>•</div>
              <div className="d-flex align-items-center gap-1">
                <Calendar size={14} />
                <span>
                  {new Date(caseData.incidentDate || caseData.reportedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div>•</div>
              <div>
                Reported by:{' '}
                <strong className="text-dark">
                  {caseData.reporter?.name} ({caseData.reporter?.role})
                </strong>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar based on Role & State */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* AI Case Synopsis Button */}
            <button
              type="button"
              onClick={() => setIsAiSummaryOpen(true)}
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5"
              title="Generate factual AI synopsis with preserved citations"
            >
              <Sparkles size={15} />
              <span>AI Case Synopsis</span>
            </button>

            {/* Dean/HOD Verification Action */}
            {(isDean || isHod) &&
              (caseData.verificationStatus === 'PENDING' || caseData.status === 'PENDING_VERIFICATION') && (
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="cx-btn cx-btn-primary d-flex align-items-center gap-1.5"
                >
                  <FileCheck2 size={16} />
                  <span>Verify / Action Docket</span>
                </button>
              )}

            {/* Case Assignment Action */}
            {(isDean || isHod) && caseData.status !== 'RESOLVED' && caseData.status !== 'CLOSED' && (
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="cx-btn cx-btn-outline d-flex align-items-center gap-1.5"
              >
                <UserPlus size={15} />
                <span>Assign Reviewer</span>
              </button>
            )}

            {/* Schedule Hearing Action */}
            {isInvestigator && caseData.status !== 'RESOLVED' && (
              <button
                type="button"
                onClick={() => setIsHearingModalOpen(true)}
                className="cx-btn cx-btn-outline d-flex align-items-center gap-1.5"
              >
                <Calendar size={15} />
                <span>Schedule Hearing</span>
              </button>
            )}

            {/* Add Investigation Note */}
            {isInvestigator && caseData.status !== 'RESOLVED' && (
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(true)}
                className="cx-btn cx-btn-outline d-flex align-items-center gap-1.5"
              >
                <Plus size={15} />
                <span>Add Note</span>
              </button>
            )}

            {/* Request Student Response */}
            {isInvestigator && caseData.status !== 'AWAITING_RESPONSE' && caseData.status !== 'RESOLVED' && (
              <button
                type="button"
                onClick={() => setIsRequestResponseModalOpen(true)}
                className="cx-btn cx-btn-outline d-flex align-items-center gap-1.5 text-warning border-warning"
              >
                <MessageSquare size={15} />
                <span>Summon Explanation</span>
              </button>
            )}

            {/* Student Explanation Button */}
            {isSubjectStudent && (
              <button
                type="button"
                onClick={() => setIsResponseModalOpen(true)}
                className="cx-btn cx-btn-primary d-flex align-items-center gap-1.5"
              >
                <Send size={15} />
                <span>Submit Defense Explanation</span>
              </button>
            )}

            {/* Dean Resolve Case */}
            {isDean && caseData.status !== 'RESOLVED' && (
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(true)}
                className="cx-btn cx-btn-teal d-flex align-items-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                <span>Conclude & Resolve</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Overview Cards */}
      <div className="row g-3 mb-4">
        {/* Subject Student */}
        <div className="col-12 col-md-4">
          <div className="cx-card p-3 h-100">
            <div className="small text-muted fw-bold text-uppercase mb-2">Subject Scholar</div>
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                style={{ width: '40px', height: '40px', backgroundColor: 'var(--cx-navy-800)' }}
              >
                {caseData.student?.name?.[0] || 'S'}
              </div>
              <div className="overflow-hidden">
                <div className="fw-bold text-dark text-truncate">{caseData.student?.name}</div>
                <div className="small text-muted font-monospace">{caseData.student?.rollNo}</div>
              </div>
            </div>
            <div className="small text-muted mt-2 border-top pt-2">
              {caseData.student?.department} • {caseData.student?.course}
            </div>
          </div>
        </div>

        {/* Assigned Reviewer */}
        <div className="col-12 col-md-4">
          <div className="cx-card p-3 h-100">
            <div className="small text-muted fw-bold text-uppercase mb-2">Assigned Authority</div>
            {caseData.assignedTo ? (
              <div className="d-flex align-items-center gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                  style={{ width: '40px', height: '40px', backgroundColor: 'var(--cx-teal-700)' }}
                >
                  {caseData.assignedTo.name?.[0] || 'A'}
                </div>
                <div className="overflow-hidden">
                  <div className="fw-bold text-dark text-truncate">{caseData.assignedTo.name}</div>
                  <div className="small text-muted">{caseData.assignedTo.designation || caseData.assignedTo.role}</div>
                </div>
              </div>
            ) : (
              <div className="text-muted small p-2 bg-light rounded text-center">
                Pending assignment by Dean / HOD
              </div>
            )}
            <div className="small text-muted mt-2 border-top pt-2">
              Next Action SLA:{' '}
              <strong className="text-dark">
                {caseData.nextActionDeadline
                  ? new Date(caseData.nextActionDeadline).toLocaleDateString()
                  : 'Under Active Review'}
              </strong>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="col-12 col-md-4">
          <div className="cx-card p-3 h-100">
            <div className="small text-muted fw-bold text-uppercase mb-2">Verification Gate</div>
            <div className="d-flex align-items-center gap-2 mb-1">
              {caseData.verificationStatus === 'VERIFIED' ? (
                <CheckCircle2 size={18} className="text-success" />
              ) : caseData.verificationStatus === 'REJECTED' ? (
                <XCircle size={18} className="text-danger" />
              ) : caseData.verificationStatus === 'RETURNED' ? (
                <RotateCcw size={18} className="text-warning" />
              ) : (
                <Clock size={18} className="text-warning" />
              )}
              <span className="fw-bold text-dark">
                {caseData.verificationStatus === 'VERIFIED'
                  ? 'Officially Verified Docket'
                  : caseData.verificationStatus === 'REJECTED'
                  ? 'Docket Rejected'
                  : caseData.verificationStatus === 'RETURNED'
                  ? 'Returned for Clarification'
                  : 'Pending Verification Queue'}
              </span>
            </div>
            <div className="small text-muted mt-2 border-top pt-2">
              {caseData.verification?.verifiedBy
                ? `Processed by ${caseData.verification.verifiedBy}`
                : 'Awaiting primary review by Dean / Proctorial Board'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="cx-card">
        <div className="border-bottom px-3 pt-2">
          <ul className="nav nav-tabs border-0" role="tablist">
            {[
              { id: 'overview', label: 'Case Overview', icon: FileText },
              { id: 'timeline', label: 'Timeline & Milestones', icon: History, count: caseData.timeline?.length },
              { id: 'evidence', label: 'Evidence & Files', icon: Paperclip, count: caseData.evidence?.length },
              { id: 'investigation', label: 'Investigation & Hearings', icon: Scale, count: caseData.hearings?.length },
              { id: 'responses', label: 'Student Explanations', icon: MessageSquare, count: caseData.responses?.length },
              { id: 'activities', label: 'Audit Activity Log', icon: UserCheck, count: caseData.activities?.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id} className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`nav-link border-0 py-2.5 px-3 fw-semibold d-flex align-items-center gap-2 ${
                      isActive ? 'active text-teal border-bottom border-2 border-teal' : 'text-muted'
                    }`}
                    style={{
                      borderBottom: isActive ? '2px solid var(--cx-teal-600)' : 'none',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {typeof tab.count === 'number' && (
                      <span className="badge bg-light text-muted border" style={{ fontSize: '0.7rem' }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Tab Content Panels */}
        <div className="p-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className="mb-4">
                <h3 className="h6 fw-bold text-dark text-uppercase tracking-wider mb-2">Incident Narrative & Summary</h3>
                <div className="p-3 bg-light rounded-3 border text-dark" style={{ lineHeight: '1.6' }}>
                  {caseData.summary || 'No summary text provided.'}
                </div>
              </div>

              {caseData.remarks && (
                <div className="mb-4">
                  <h3 className="h6 fw-bold text-dark text-uppercase tracking-wider mb-2">Staff Remarks</h3>
                  <div className="p-3 bg-light rounded-3 border text-muted small">{caseData.remarks}</div>
                </div>
              )}

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <h3 className="h6 fw-bold text-dark text-uppercase tracking-wider mb-2">Academic Information</h3>
                  <table className="table table-bordered table-sm small mb-0">
                    <tbody>
                      <tr>
                        <th className="bg-light text-muted" style={{ width: '35%' }}>Course / Degree</th>
                        <td>{caseData.student?.course || 'B.Tech'}</td>
                      </tr>
                      <tr>
                        <th className="bg-light text-muted">Academic Unit</th>
                        <td>{caseData.department}</td>
                      </tr>
                      <tr>
                        <th className="bg-light text-muted">Semester & Section</th>
                        <td>
                          {caseData.student?.semester} • {caseData.student?.section}
                        </td>
                      </tr>
                      <tr>
                        <th className="bg-light text-muted">Enrollment Ref</th>
                        <td className="font-monospace">{caseData.student?.enrollmentNo}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="col-12 col-md-6">
                  <h3 className="h6 fw-bold text-dark text-uppercase tracking-wider mb-2">Administrative Tracking</h3>
                  <table className="table table-bordered table-sm small mb-0">
                    <tbody>
                      <tr>
                        <th className="bg-light text-muted" style={{ width: '35%' }}>Reported On</th>
                        <td>{new Date(caseData.reportedAt).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <th className="bg-light text-muted">Last Updated</th>
                        <td>{new Date(caseData.updatedAt || caseData.reportedAt).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <th className="bg-light text-muted">Subcategory</th>
                        <td>{caseData.subcategory || 'General'}</td>
                      </tr>
                      <tr>
                        <th className="bg-light text-muted">Reporting Staff</th>
                        <td>
                          {caseData.reporter?.name} ({caseData.reporter?.designation || caseData.reporter?.role})
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Case Tracking QR Code */}
              {caseQrToken && (
                <div className="mt-4 p-3 bg-light rounded-3 border d-flex flex-column flex-sm-row align-items-center gap-3">
                  <div className="p-2 bg-white rounded border shadow-sm">
                    <QRCodeSVG value={caseQrToken} size={84} level="M" />
                  </div>
                  <div>
                    <div className="fw-bold text-dark d-flex align-items-center gap-1 small">
                      <QrCode size={16} className="text-primary" /> Case Tracking QR Code
                    </div>
                    <div className="text-muted small">
                      Scan with the CIVNEXA Staff Scanner to instantly verify docket validity and access permissions.
                    </div>
                    <div className="font-monospace text-muted mt-1" style={{ fontSize: '11px' }}>
                      Token: {caseQrToken}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === 'timeline' && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h3 className="h6 fw-bold text-dark mb-0">Case Lifecycle & Investigation Milestones</h3>
                <span className="small text-muted">{caseData.timeline?.length || 0} Recorded Events</span>
              </div>

              <div className="position-relative ps-4 ms-2">
                {/* Timeline vertical bar */}
                <div
                  className="position-absolute top-0 bottom-0 start-0"
                  style={{
                    width: '2px',
                    backgroundColor: 'var(--cx-slate-200)',
                    left: '7px',
                  }}
                />

                {(caseData.timeline || []).map((item, idx) => (
                  <div key={item.id || idx} className="position-relative pb-4">
                    {/* Node Dot */}
                    <div
                      className="position-absolute rounded-circle bg-white border border-2 border-teal d-flex align-items-center justify-content-center"
                      style={{
                        width: '16px',
                        height: '16px',
                        left: '-23px',
                        top: '4px',
                        borderColor: 'var(--cx-teal-600)',
                      }}
                    />

                    <div className="p-3 rounded-3 border bg-light bg-opacity-50">
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                        <span className="fw-bold text-dark">{item.title}</span>
                        <span className="small text-muted font-monospace">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="small text-muted mb-1.5">{item.description}</p>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.72rem' }}>
                          Actor: {item.actor}
                        </span>
                        {item.status && <StatusBadge status={item.status} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE */}
          {activeTab === 'evidence' && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h3 className="h6 fw-bold text-dark mb-0">Attached Evidence & Document Store</h3>
                <span className="small text-muted">{caseData.evidence?.length || 0} Attachments</span>
              </div>

              {(!caseData.evidence || caseData.evidence.length === 0) ? (
                <div className="p-4 text-center text-muted border rounded-3 bg-light">
                  <Paperclip size={24} className="mb-2 text-muted" />
                  <p className="small mb-0">No evidence attachments have been uploaded for this case.</p>
                </div>
              ) : (
                <div className="row g-3">
                  {caseData.evidence.map((file, idx) => (
                    <div key={file.id || idx} className="col-12 col-md-6 col-lg-4">
                      <div className="p-3 rounded-3 border bg-white h-100 d-flex flex-column justify-content-between shadow-sm">
                        <div>
                          <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="p-2 rounded bg-light text-primary d-flex align-items-center justify-content-center"
                                style={{ width: '36px', height: '36px' }}
                              >
                                <FileText size={18} />
                              </div>
                              <div className="overflow-hidden">
                                <div className="fw-semibold text-dark text-truncate small" title={file.name}>
                                  {file.name}
                                </div>
                                <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                                  {file.size} • {file.type || 'Document'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="small text-muted mt-2 border-top pt-2">
                            Uploaded by: <strong>{file.uploaderName || 'Staff'}</strong>
                            <div className="font-monospace text-muted mt-0.5" style={{ fontSize: '0.7rem' }}>
                              {new Date(file.uploadedAt || caseData.reportedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-top d-flex justify-content-end">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2.5 d-flex align-items-center gap-1"
                          >
                            <Eye size={13} />
                            <span>Preview File</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INVESTIGATION & HEARINGS */}
          {activeTab === 'investigation' && (
            <div>
              <div className="row g-4">
                {/* Notes Column */}
                <div className="col-12 col-lg-7">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="h6 fw-bold text-dark mb-0">Confidential Inquiry Notes</h3>
                    {isInvestigator && (
                      <button
                        type="button"
                        onClick={() => setIsNoteModalOpen(true)}
                        className="cx-btn cx-btn-outline cx-btn-sm"
                      >
                        <Plus size={14} />
                        <span>Add Entry</span>
                      </button>
                    )}
                  </div>

                  {(!caseData.investigation?.notes || caseData.investigation.notes.length === 0) ? (
                    <div className="p-3 text-center text-muted small border rounded-3 bg-light">
                      No investigation notes recorded yet.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2.5">
                      {caseData.investigation.notes.map((n, i) => (
                        <div key={n.id || i} className="p-3 rounded-3 border bg-light bg-opacity-50">
                          <div className="d-flex align-items-center justify-content-between mb-1.5">
                            <span className="fw-semibold text-dark small">{n.author}</span>
                            <span className="small text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                              {new Date(n.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="small text-muted mb-0">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scheduled Hearings Column */}
                <div className="col-12 col-lg-5">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="h6 fw-bold text-dark mb-0">Scheduled Hearings</h3>
                    {isInvestigator && (
                      <button
                        type="button"
                        onClick={() => setIsHearingModalOpen(true)}
                        className="cx-btn cx-btn-outline cx-btn-sm"
                      >
                        <Calendar size={14} />
                        <span>Schedule</span>
                      </button>
                    )}
                  </div>

                  {(!caseData.hearings || caseData.hearings.length === 0) ? (
                    <div className="p-3 text-center text-muted small border rounded-3 bg-light">
                      No formal hearings scheduled for this case.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {caseData.hearings.map((h, i) => (
                        <div key={h.id || i} className="p-3 rounded-3 border bg-white shadow-sm">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="badge bg-primary-subtle text-primary border">{h.mode} Hearing</span>
                            <span className="badge bg-success-subtle text-success">{h.status}</span>
                          </div>
                          <div className="fw-bold text-dark mb-1">
                            {h.date} at {h.time}
                          </div>
                          <div className="small text-muted mb-2">Venue: {h.venue}</div>
                          {h.notes && <div className="small text-muted bg-light p-2 rounded">{h.notes}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Case Tracking QR Code */}
              {caseQrToken && (
                <div className="mt-4 p-3 bg-light rounded-3 border d-flex flex-column flex-sm-row align-items-center gap-3">
                  <div className="p-2 bg-white rounded border shadow-sm">
                    <QRCodeSVG value={caseQrToken} size={84} level="M" />
                  </div>
                  <div>
                    <div className="fw-bold text-dark d-flex align-items-center gap-1 small">
                      <QrCode size={16} className="text-primary" /> Case Tracking QR Code
                    </div>
                    <div className="text-muted small">
                      Scan with the CIVNEXA Staff Scanner to instantly verify docket validity and access permissions.
                    </div>
                    <div className="font-monospace text-muted mt-1" style={{ fontSize: '11px' }}>
                      Token: {caseQrToken}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STUDENT RESPONSES */}
          {activeTab === 'responses' && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h3 className="h6 fw-bold text-dark mb-0">Student Defense & Written Explanations</h3>
                  <p className="text-muted small mb-0">
                    Official explanation and representations submitted by the subject student under inquiry rules.
                  </p>
                </div>
                {isSubjectStudent && (
                  <button
                    type="button"
                    onClick={() => setIsResponseModalOpen(true)}
                    className="cx-btn cx-btn-primary"
                  >
                    <Send size={15} />
                    <span>Submit Explanation</span>
                  </button>
                )}
              </div>

              {(!caseData.responses || caseData.responses.length === 0) ? (
                <div className="p-4 text-center text-muted border rounded-3 bg-light">
                  <MessageSquare size={28} className="text-muted mb-2" />
                  <div className="fw-semibold text-dark">No student explanation logged yet.</div>
                  <div className="small text-muted mt-1">
                    {caseData.status === 'AWAITING_RESPONSE'
                      ? 'Case is currently awaiting student defense statement.'
                      : 'No formal explanation was summoned or recorded for this case.'}
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {caseData.responses.map((resp, idx) => (
                    <div key={resp.id || idx} className="p-4 rounded-3 border bg-white shadow-sm">
                      <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                        <div>
                          <div className="fw-bold text-dark">{resp.studentName}</div>
                          <div className="small text-muted font-monospace">{resp.studentRoll}</div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-success-subtle text-success mb-1">Response Recorded</span>
                          <div className="small text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                            {new Date(resp.submittedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-light rounded-3 text-dark small mb-3" style={{ lineHeight: '1.6' }}>
                        {resp.text}
                      </div>

                      {resp.attachments && resp.attachments.length > 0 && (
                        <div>
                          <div className="small fw-bold text-muted mb-1.5">Defense Attachments:</div>
                          <div className="d-flex flex-wrap gap-2">
                            {resp.attachments.map((att, aIdx) => (
                              <div
                                key={att.id || aIdx}
                                className="badge bg-white border text-dark p-2 d-flex align-items-center gap-1.5"
                              >
                                <Paperclip size={13} className="text-muted" />
                                <span>{att.name}</span>
                                <span className="text-muted font-monospace">({att.size})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AUDIT ACTIVITY LOG */}
          {activeTab === 'activities' && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h3 className="h6 fw-bold text-dark mb-0">Audit Trail & Immutable State Log</h3>
                <span className="small text-muted">{caseData.activities?.length || 0} Audit Records</span>
              </div>

              <div className="table-responsive">
                <table className="cx-table">
                  <thead>
                    <tr>
                      <th>Event ID</th>
                      <th>Action</th>
                      <th>Actor</th>
                      <th>Timestamp</th>
                      <th>Status Change</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(caseData.activities || []).map((act, i) => (
                      <tr key={act.id || i}>
                        <td className="cx-font-mono small text-muted">{act.id || `ACT-${i + 1}`}</td>
                        <td className="fw-semibold text-dark">{act.action}</td>
                        <td>
                          <span className="small text-dark">{act.actor?.name}</span>
                          <span className="text-muted small ms-1">({act.actor?.role})</span>
                        </td>
                        <td className="cx-font-mono small text-muted">
                          {new Date(act.timestamp).toLocaleString()}
                        </td>
                        <td>
                          {act.previousStatus && act.newStatus ? (
                            <span className="small text-muted font-monospace">
                              {act.previousStatus} → <strong className="text-dark">{act.newStatus}</strong>
                            </span>
                          ) : (
                            <span className="small text-muted">—</span>
                          )}
                        </td>
                        <td className="small text-muted" style={{ maxWidth: '300px' }}>
                          {act.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: VERIFY DOCKET */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Dean & Proctorial Verification"
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsVerifyModalOpen(false)}
              className="cx-btn cx-btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerifySubmit}
              className={`cx-btn ${
                verifyAction === 'REJECT' ? 'btn-danger text-white' : 'cx-btn-primary'
              }`}
            >
              Confirm Verification Decision
            </button>
          </div>
        }
      >
        <div className="mb-3">
          <label className="cx-form-label">Verification Determination</label>
          <div className="d-flex gap-2">
            {[
              { id: 'VERIFY', label: 'Verify Case (Valid Complaint)', variant: 'outline-success' },
              { id: 'RETURN', label: 'Return for Info', variant: 'outline-warning' },
              { id: 'REJECT', label: 'Reject Incident', variant: 'outline-danger' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setVerifyAction(opt.id)}
                className={`btn btn-sm flex-fill ${
                  verifyAction === opt.id ? `btn-${opt.variant.replace('outline-', '')}` : `btn-${opt.variant}`
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {verifyAction === 'REJECT' ? (
          <div className="mb-3">
            <label htmlFor="verify-reason" className="cx-form-label">
              Mandatory Rejection Reason <span className="text-danger">*</span>
            </label>
            <textarea
              id="verify-reason"
              className="cx-input"
              rows={3}
              placeholder="State the institutional policy reason for rejecting this allegation..."
              value={verifyReason}
              onChange={(e) => setVerifyReason(e.target.value)}
            />
          </div>
        ) : (
          <div className="mb-3">
            <label htmlFor="verify-notes" className="cx-form-label">
              Verification Notes / Instructions
            </label>
            <textarea
              id="verify-notes"
              className="cx-input"
              rows={3}
              placeholder="Provide verification directives or required information..."
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
            />
          </div>
        )}
      </Modal>

      {/* MODAL 2: ASSIGN REVIEWER */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Case Reviewer / Investigator"
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="cx-btn cx-btn-outline"
            >
              Cancel
            </button>
            <button type="button" onClick={handleAssignSubmit} className="cx-btn cx-btn-primary">
              Assign Reviewer
            </button>
          </div>
        }
      >
        <div className="mb-3">
          <label htmlFor="assign-user-select" className="cx-form-label">
            Select Inquiry Officer / Board Member <span className="text-danger">*</span>
          </label>
          <select
            id="assign-user-select"
            className="cx-input"
            value={selectedAssigneeId}
            onChange={(e) => setSelectedAssigneeId(e.target.value)}
          >
            <option value="">-- Choose Reviewer --</option>
            {adminService.getUsers().filter((u) => u.role !== 'STUDENT').map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.roleLabel || user.role} • {user.department})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="assign-notes" className="cx-form-label">
            Assignment Terms / Deadline Notes
          </label>
          <textarea
            id="assign-notes"
            className="cx-input"
            rows={2}
            placeholder="e.g. Conduct preliminary witness interviews and report within 5 business days."
            value={assignNotes}
            onChange={(e) => setAssignNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* MODAL 3: SCHEDULE HEARING */}
      <Modal
        isOpen={isHearingModalOpen}
        onClose={() => setIsHearingModalOpen(false)}
        title="Schedule Disciplinary Committee Hearing"
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsHearingModalOpen(false)}
              className="cx-btn cx-btn-outline"
            >
              Cancel
            </button>
            <button type="button" onClick={handleScheduleHearingSubmit} className="cx-btn cx-btn-primary">
              Confirm & Issue Notice
            </button>
          </div>
        }
      >
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label htmlFor="hearing-date-input" className="cx-form-label">
              Hearing Date <span className="text-danger">*</span>
            </label>
            <input
              id="hearing-date-input"
              type="date"
              className="cx-input"
              value={hearingDate}
              onChange={(e) => setHearingDate(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="hearing-time-input" className="cx-form-label">
              Time <span className="text-danger">*</span>
            </label>
            <input
              id="hearing-time-input"
              type="time"
              className="cx-input"
              value={hearingTime}
              onChange={(e) => setHearingTime(e.target.value)}
            />
          </div>
          <div className="col-12">
            <label htmlFor="hearing-venue-input" className="cx-form-label">
              Venue / Digital Link <span className="text-danger">*</span>
            </label>
            <input
              id="hearing-venue-input"
              type="text"
              className="cx-input"
              value={hearingVenue}
              onChange={(e) => setHearingVenue(e.target.value)}
            />
          </div>
          <div className="col-12">
            <label htmlFor="hearing-mode-select" className="cx-form-label">
              Hearing Mode
            </label>
            <select
              id="hearing-mode-select"
              className="cx-input"
              value={hearingMode}
              onChange={(e) => setHearingMode(e.target.value)}
            >
              <option value="In-Person">In-Person (On-Campus Ethics Chamber)</option>
              <option value="Hybrid">Hybrid (In-Person + Video Conference)</option>
              <option value="Virtual">Virtual Session</option>
            </select>
          </div>
          <div className="col-12">
            <label htmlFor="hearing-notes-input" className="cx-form-label">
              Special Instructions for Appellant / Student
            </label>
            <textarea
              id="hearing-notes-input"
              className="cx-input"
              rows={2}
              placeholder="e.g. Student may bring one registered peer representative or mentor."
              value={hearingNotes}
              onChange={(e) => setHearingNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 4: ADD INVESTIGATION NOTE */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Confidential Investigation Note"
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button type="button" onClick={() => setIsNoteModalOpen(false)} className="cx-btn cx-btn-outline">
              Cancel
            </button>
            <button type="button" onClick={handleAddNoteSubmit} className="cx-btn cx-btn-primary">
              Save Note
            </button>
          </div>
        }
      >
        <div className="mb-3">
          <label htmlFor="investigation-note-input" className="cx-form-label">
            Inquiry Observation / Note <span className="text-danger">*</span>
          </label>
          <textarea
            id="investigation-note-input"
            className="cx-input"
            rows={4}
            placeholder="Record witness statements, evidence verification details, or review deliberations..."
            value={investigationNoteText}
            onChange={(e) => setInvestigationNoteText(e.target.value)}
          />
        </div>
      </Modal>

      {/* MODAL 5: SUBMIT STUDENT DEFENSE */}
      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title="Submit Defense Statement & Explanation"
        size="lg"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button type="button" onClick={() => setIsResponseModalOpen(false)} className="cx-btn cx-btn-outline">
              Cancel
            </button>
            <button type="button" onClick={handleStudentResponseSubmit} className="cx-btn cx-btn-primary">
              Submit Formal Defense
            </button>
          </div>
        }
      >
        <div className="mb-3">
          <label htmlFor="student-explanation-input" className="cx-form-label">
            Written Explanation & Representation <span className="text-danger">*</span>
          </label>
          <textarea
            id="student-explanation-input"
            className="cx-input"
            rows={5}
            placeholder="Enter your detailed chronological explanation, defense, or mitigating circumstances regarding the allegations..."
            value={studentExplanationText}
            onChange={(e) => setStudentExplanationText(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="cx-form-label">Supporting Documents (Optional)</label>
          <FileUploader
            onFilesSelected={(files) => setResponseAttachments(files)}
            maxFiles={3}
            maxSizeMB={10}
            acceptedTypes=".pdf,.jpg,.jpeg,.png,.docx"
          />
        </div>
      </Modal>

      {/* MODAL 6: SUMMON STUDENT RESPONSE */}
      <Modal
        isOpen={isRequestResponseModalOpen}
        onClose={() => setIsRequestResponseModalOpen(false)}
        title="Summon Student Explanation"
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsRequestResponseModalOpen(false)}
              className="cx-btn cx-btn-outline"
            >
              Cancel
            </button>
            <button type="button" onClick={handleRequestResponseSubmit} className="cx-btn cx-btn-primary">
              Dispatch Summons
            </button>
          </div>
        }
      >
        <div className="mb-3">
          <label htmlFor="response-deadline-input" className="cx-form-label">
            Submission Deadline <span className="text-danger">*</span>
          </label>
          <input
            id="response-deadline-input"
            type="date"
            className="cx-input"
            value={responseDeadline}
            onChange={(e) => setResponseDeadline(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="response-prompt-input" className="cx-form-label">
            Specific Clarification Requested
          </label>
          <textarea
            id="response-prompt-input"
            className="cx-input"
            rows={3}
            placeholder="e.g. Please explain why you were present in the laboratory outside of scheduled lab hours..."
            value={responsePrompt}
            onChange={(e) => setResponsePrompt(e.target.value)}
          />
        </div>
      </Modal>

      {/* MODAL 7: RESOLVE CASE */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Conclude & Resolve Case Docket"
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button type="button" onClick={() => setIsResolveModalOpen(false)} className="cx-btn cx-btn-outline">
              Cancel
            </button>
            <button type="button" onClick={handleResolveCaseSubmit} className="cx-btn cx-btn-teal">
              Resolve Docket
            </button>
          </div>
        }
      >
        <div className="p-3 bg-light rounded-3 mb-3 small text-muted">
          Resolving this docket indicates that the proctorial inquiry has reached its conclusion and all required
          sanctions or recommendations have been officially logged.
        </div>
        <div className="mb-3">
          <label htmlFor="resolve-reason-input" className="cx-form-label">
            Resolution Summary & Findings <span className="text-danger">*</span>
          </label>
          <textarea
            id="resolve-reason-input"
            className="cx-input"
            rows={3}
            placeholder="Record the formal disciplinary outcome or resolution terms..."
            value={resolveReason}
            onChange={(e) => setResolveReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* MODAL 8: FILE PREVIEW */}
      {previewFile && (
        <Modal
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
          title={`Attachment Preview: ${previewFile.name}`}
          size="lg"
        >
          <div className="text-center p-4">
            <div className="p-3 bg-light rounded-3 border mb-3">
              <FileText size={48} className="text-primary mb-2 mx-auto" />
              <div className="fw-bold text-dark">{previewFile.name}</div>
              <div className="small text-muted font-monospace">{previewFile.size} • {previewFile.type}</div>
              <div className="small text-muted mt-1">Uploaded by: {previewFile.uploaderName || 'Staff'}</div>
            </div>
            <p className="small text-muted mb-0">
              Document preview active. You can inspect the attached file metadata or proceed with hearing review.
            </p>
          </div>
        </Modal>
      )}

      {/* AI Case Summary Modal */}
      {isAiSummaryOpen && (
        <AiCaseSummaryModal
          caseId={caseData?.id || caseId}
          caseNumber={caseData?.caseNumber}
          onClose={() => setIsAiSummaryOpen(false)}
        />
      )}
    </AnimatedPage>
  );
};

export default CaseDetailPage;
