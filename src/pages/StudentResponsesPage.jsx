import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  Eye,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import Modal from '../components/feedback/Modal';
import { FileUploader } from '../components/forms/FileUploader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import caseService from '../services/caseService';

export const StudentResponsesPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [responseCases, setResponseCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Response submission modal state
  const [selectedCase, setSelectedCase] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [explanationText, setExplanationText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCasesRequiringResponse = async () => {
    setIsLoading(true);
    try {
      const res = await caseService.getCases({
        currentUser,
        pageSize: 50,
      });

      // Filter cases awaiting student response
      const awaiting = res.items.filter((c) => c.status === 'AWAITING_RESPONSE' || (c.responses && c.responses.length > 0));
      setResponseCases(awaiting);
    } catch (err) {
      toast.error('Unable to load pending explanations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCasesRequiringResponse();
  }, [currentUser]);

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;

    if (!explanationText || explanationText.trim().length < 15) {
      toast.error('Explanation text must be at least 15 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await caseService.submitStudentResponse(selectedCase.id, {
        explanationText,
        attachments,
        student: currentUser,
      });

      toast.success(`Formal explanation submitted for case ${selectedCase.caseNumber}!`);
      setIsSubmitModalOpen(false);
      setSelectedCase(null);
      setExplanationText('');
      setAttachments([]);
      loadCasesRequiringResponse();
    } catch (err) {
      toast.error(err.message || 'Failed to submit response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Student Inquiry Summons & Explanations"
        subtitle="Review official proctorial summons, review permitted allegations, and lodge your formal defense representation."
        breadcrumbs={[{ label: 'Student Portal' }, { label: 'Inquiry Explanations' }]}
        badge={
          <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
            Official Inquiry Responses
          </span>
        }
      />

      <div className="cx-card mb-4 p-4 border-start border-4 border-warning bg-light bg-opacity-50">
        <div className="d-flex align-items-start gap-3">
          <AlertTriangle size={24} className="text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="h6 fw-bold text-dark mb-1">Student Rights & Response Protocol</h3>
            <p className="small text-muted mb-0">
              Under university procedural fairness statutes, you have the right to inspect permitted allegation summaries,
              submit a written explanation of the facts, and attach supporting documentation. Original incident reports
              filed by invigilators or proctors cannot be modified or deleted.
            </p>
          </div>
        </div>
      </div>

      <div className="cx-card">
        <div className="cx-card-header d-flex align-items-center justify-content-between">
          <h2 className="h6 mb-0 fw-bold">Active Summons & Prior Responses</h2>
          <span className="small text-muted">{responseCases.length} Registered Records</span>
        </div>

        <div className="cx-card-body p-0">
          {isLoading ? (
            <div className="p-5 text-center text-muted">
              <div className="spinner-border text-teal mb-3" role="status" />
              <div>Loading student responses docket...</div>
            </div>
          ) : responseCases.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <CheckCircle2 size={36} className="text-success mb-2 mx-auto" />
              <h3 className="h6 fw-bold text-dark">No Pending Inquiries</h3>
              <p className="small text-muted mb-0">
                You currently have no active cases awaiting your written explanation or defense statement.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cx-table">
                <thead>
                  <tr>
                    <th>Case Ref</th>
                    <th>Allegation / Matter</th>
                    <th>Category</th>
                    <th>Deadline</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {responseCases.map((c) => (
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
                        <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '300px' }}>
                          {c.title}
                        </div>
                        <div className="small text-muted mt-0.5">Location: {c.location}</div>
                      </td>
                      <td>
                        <span className="small text-muted">{c.category}</span>
                      </td>
                      <td>
                        <span className="small font-monospace text-danger fw-semibold">
                          {c.nextActionDeadline
                            ? new Date(c.nextActionDeadline).toLocaleDateString()
                            : 'Within 48 hours'}
                        </span>
                      </td>
                      <td>
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td>
                        <StatusBadge status={c.status} label={c.statusLabel} />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1.5">
                          {c.status === 'AWAITING_RESPONSE' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCase(c);
                                setIsSubmitModalOpen(true);
                              }}
                              className="cx-btn cx-btn-primary cx-btn-sm py-1 px-2.5 d-flex align-items-center gap-1"
                            >
                              <Send size={13} />
                              <span>Submit Defense</span>
                            </button>
                          ) : (
                            <Link
                              to={`/cases/${c.caseNumber}`}
                              className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2.5 d-flex align-items-center gap-1 text-decoration-none"
                            >
                              <Eye size={13} />
                              <span>Inspect File</span>
                            </Link>
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

      {/* DEFENSE SUBMISSION MODAL */}
      {selectedCase && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => {
            setIsSubmitModalOpen(false);
            setSelectedCase(null);
          }}
          title={`Lodge Official Defense: ${selectedCase.caseNumber}`}
          size="lg"
          footer={
            <div className="d-flex align-items-center justify-content-end gap-2 w-100">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="cx-btn cx-btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitResponse}
                disabled={isSubmitting}
                className="cx-btn cx-btn-primary d-flex align-items-center gap-1.5"
              >
                <Send size={15} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Official Defense'}</span>
              </button>
            </div>
          }
        >
          {/* Summary of permitted allegation information */}
          <div className="p-3 bg-light rounded-3 border mb-3">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="badge bg-secondary-subtle text-secondary">{selectedCase.category}</span>
              <span className="small text-muted font-monospace">Case: {selectedCase.caseNumber}</span>
            </div>
            <h4 className="h6 fw-bold text-dark mb-1">{selectedCase.title}</h4>
            <p className="small text-muted mb-0">{selectedCase.summary}</p>
          </div>

          <form onSubmit={handleSubmitResponse}>
            <div className="mb-3">
              <label htmlFor="defense-statement" className="cx-form-label">
                Your Written Defense Statement <span className="text-danger">*</span>
              </label>
              <textarea
                id="defense-statement"
                className="cx-input"
                rows={6}
                placeholder="Explain the events, chronological timeline, your actions, witnesses present, or any mitigating circumstances..."
                value={explanationText}
                onChange={(e) => setExplanationText(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="cx-form-label">Supporting Evidence / Testimonials (Optional)</label>
              <FileUploader
                onFilesSelected={(files) => setAttachments(files)}
                maxFiles={3}
                maxSizeMB={10}
                acceptedTypes=".pdf,.jpg,.jpeg,.png,.docx"
              />
            </div>
          </form>
        </Modal>
      )}
    </AnimatedPage>
  );
};

export default StudentResponsesPage;
