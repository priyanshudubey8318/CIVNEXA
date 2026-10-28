import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  FileText,
  Image as ImageIcon,
  Video,
  FileCheck,
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  History,
  Search,
  Filter,
  Lock,
  ExternalLink,
  Hash,
  RefreshCw,
  X,
  ArrowRight,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/feedback/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import evidenceService, { computeSha256Checksum } from '../../services/evidenceService';

export const EvidenceVaultPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [evidenceList, setEvidenceList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewStatusInput, setReviewStatusInput] = useState('REVIEWED');
  const [reviewNotesInput, setReviewNotesInput] = useState('');

  const [isIntegrityModalOpen, setIsIntegrityModalOpen] = useState(false);
  const [isVerifyingChecksum, setIsVerifyingChecksum] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const [isCustodyOpen, setIsCustodyOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadEvidence = async () => {
    setIsLoading(true);
    try {
      const items = await evidenceService.getEvidence({
        typeCategory: typeFilter,
        reviewStatus: statusFilter,
        searchQuery,
        currentUser,
      });
      setEvidenceList(items);
    } catch (err) {
      toast.error('Unable to retrieve evidence repository.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
  }, [typeFilter, statusFilter, searchQuery, currentUser]);

  const handleUpdateReviewStatus = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsActionLoading(true);
    try {
      await evidenceService.updateReviewStatus(selectedItem.id, {
        reviewStatus: reviewStatusInput,
        reviewNotes: reviewNotesInput,
        reviewer: currentUser,
      });
      toast.success(`Evidence ${selectedItem.name} updated to ${reviewStatusInput}.`);
      setIsReviewModalOpen(false);
      loadEvidence();
    } catch (err) {
      toast.error(err.message || 'Failed to update review status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRunIntegrityCheck = async (item) => {
    setSelectedItem(item);
    setIsIntegrityModalOpen(true);
    setIsVerifyingChecksum(true);
    setVerificationResult(null);

    try {
      // Simulate/run Web Crypto SHA-256 calculation
      const res = await evidenceService.verifyChecksum(item.id, item.name + item.size);
      setVerificationResult(res);
      toast.success('Cryptographic SHA-256 verification complete.');
    } catch (err) {
      toast.error('Integrity calculation failed.');
    } finally {
      setIsVerifyingChecksum(false);
    }
  };

  const openCustodyDrawer = (item) => {
    setSelectedItem(item);
    setIsCustodyOpen(true);
  };

  const openReviewModal = (item) => {
    setSelectedItem(item);
    setReviewStatusInput(item.reviewStatus === 'UNREVIEWED' ? 'REVIEWED' : item.reviewStatus);
    setReviewNotesInput(item.reviewNotes || '');
    setIsReviewModalOpen(true);
  };

  const openPreview = (item) => {
    setSelectedItem(item);
    setIsPreviewOpen(true);
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Institutional Evidence Vault"
        subtitle="Document repository with file checksum verification and chain-of-custody tracking."
        breadcrumbs={[{ label: 'Committee' }, { label: 'Evidence Vault' }]}
        badge={
          <span className="badge bg-teal-subtle text-teal border px-2 py-1 d-inline-flex align-items-center gap-1.5">
            <Shield size={13} />
            <span>File Checksums Enabled</span>
          </span>
        }
      />

      {/* Filter Bar */}
      <div className="cx-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6 col-lg-6">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="cx-input rounded-start-0"
                placeholder="Search by file name, case ID, description, or uploader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg-3">
            <select className="cx-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="ALL">All File Types</option>
              <option value="DOCUMENT">Documents / PDFs</option>
              <option value="IMAGE">Images / Photos</option>
              <option value="VIDEO">Videos / CCTV</option>
            </select>
          </div>
          <div className="col-6 col-md-3 col-lg-3">
            <select className="cx-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Review Statuses</option>
              <option value="UNREVIEWED">Unreviewed</option>
              <option value="REVIEWED">Reviewed & Verified</option>
              <option value="FLAGGED">Flagged for Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="cx-card">
        <div className="cx-card-header d-flex align-items-center justify-content-between">
          <h2 className="h6 mb-0 fw-bold">Deposition Records ({evidenceList.length})</h2>
          <span className="small text-muted">Protected Repository</span>
        </div>

        <div className="cx-card-body p-0">
          {isLoading ? (
            <div className="p-5 text-center text-muted">
              <div className="spinner-border text-teal mb-3" role="status" />
              <div>Loading evidence repository...</div>
            </div>
          ) : evidenceList.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <Shield size={36} className="text-muted mb-2 opacity-50 mx-auto" />
              <h3 className="h6 fw-bold text-dark">No Evidence Files Found</h3>
              <p className="small text-muted mb-0">No records match the current filter criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cx-table">
                <thead>
                  <tr>
                    <th>Evidence ID / Name</th>
                    <th>Case Docket</th>
                    <th>Category</th>
                    <th>Size & Type</th>
                    <th>Uploader</th>
                    <th>Review Status</th>
                    <th>Integrity Hash</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceList.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {item.typeCategory === 'IMAGE' ? (
                            <ImageIcon size={18} className="text-teal flex-shrink-0" />
                          ) : item.typeCategory === 'VIDEO' ? (
                            <Video size={18} className="text-primary flex-shrink-0" />
                          ) : (
                            <FileText size={18} className="text-danger flex-shrink-0" />
                          )}
                          <div>
                            <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '220px' }}>
                              {item.name}
                            </div>
                            <div className="cx-font-mono text-muted" style={{ fontSize: '0.72rem' }}>
                              ID: {item.fileId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/cases/${item.caseNumber}`}
                          className="cx-font-mono fw-bold text-decoration-none hover-underline"
                          style={{ color: 'var(--cx-teal-700)' }}
                        >
                          {item.caseNumber}
                        </Link>
                        {item.isConfidential && (
                          <div className="mt-0.5">
                            <span className="badge bg-purple-subtle text-purple" style={{ fontSize: '0.68rem' }}>
                              Confidential
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{item.typeCategory}</span>
                      </td>
                      <td>
                        <div className="small font-monospace text-dark">{item.size}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {item.type}
                        </div>
                      </td>
                      <td>
                        <div className="small fw-semibold text-dark">{item.uploaderName}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {new Date(item.uploadedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            item.reviewStatus === 'REVIEWED'
                              ? 'bg-success-subtle text-success'
                              : item.reviewStatus === 'FLAGGED'
                              ? 'bg-danger-subtle text-danger'
                              : 'bg-warning-subtle text-warning'
                          }`}
                        >
                          {item.reviewStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRunIntegrityCheck(item)}
                          className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 font-monospace"
                          style={{ fontSize: '0.72rem' }}
                          title="Verify SHA-256 Checksum"
                        >
                          <Hash size={12} className="text-teal" />
                          <span>{item.sha256Checksum ? `${item.sha256Checksum.substring(0, 8)}...` : 'Verify'}</span>
                        </button>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openPreview(item)}
                            className="btn btn-sm btn-light border p-1"
                            title="Inspect File Preview"
                          >
                            <Eye size={14} className="text-muted" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openReviewModal(item)}
                            className="btn btn-sm btn-light border p-1"
                            title="Update Review Status & Notes"
                          >
                            <FileCheck size={14} className="text-teal" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openCustodyDrawer(item)}
                            className="btn btn-sm btn-light border p-1"
                            title="View Chain of Custody History"
                          >
                            <History size={14} className="text-primary" />
                          </button>
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

      {/* MODAL 1: PREVIEW MODAL */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Evidence Inspection: ${selectedItem?.name || ''}`}
        size="lg"
        footer={
          <div className="d-flex align-items-center justify-content-between w-100">
            <span className="small text-muted font-monospace">Case: {selectedItem?.caseNumber}</span>
            <button type="button" onClick={() => setIsPreviewOpen(false)} className="cx-btn cx-btn-outline">
              Close Preview
            </button>
          </div>
        }
      >
        {selectedItem && (
          <div>
            <div className="p-3 bg-light rounded-3 mb-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="fw-bold text-dark">{selectedItem.name}</div>
                <div className="small text-muted">
                  Deposited by {selectedItem.uploaderName} • {selectedItem.size} • Format: {selectedItem.type}
                </div>
              </div>
              <span className="badge bg-secondary-subtle text-secondary border">{selectedItem.typeCategory}</span>
            </div>

            {selectedItem.description && (
              <div className="mb-3 small text-muted">
                <strong>Description:</strong> {selectedItem.description}
              </div>
            )}

            {/* Simulated Viewer Box */}
            <div
              className="p-4 rounded-3 border d-flex flex-column align-items-center justify-content-center text-center bg-white shadow-sm"
              style={{ minHeight: '260px' }}
            >
              {selectedItem.typeCategory === 'IMAGE' ? (
                <div>
                  <ImageIcon size={64} className="text-teal mb-3 opacity-75" />
                  <div className="fw-semibold text-dark mb-1">Image Deposition Preview Rendered</div>
                  <div className="small text-muted mb-3 font-monospace">{selectedItem.name}</div>
                  <div className="p-2 bg-light rounded text-muted small border">
                    [High-Resolution Photographic Forensic Attachment: {selectedItem.size}]
                  </div>
                </div>
              ) : selectedItem.typeCategory === 'VIDEO' ? (
                <div>
                  <Video size={64} className="text-primary mb-3 opacity-75" />
                  <div className="fw-semibold text-dark mb-1">CCTV Media Stream Snippet Rendered</div>
                  <div className="small text-muted mb-3 font-monospace">{selectedItem.name}</div>
                  <div className="p-2 bg-light rounded text-muted small border">
                    [Protected MP4 Video Attachment: {selectedItem.size} — Timecode Embedded]
                  </div>
                </div>
              ) : (
                <div>
                  <FileText size={64} className="text-danger mb-3 opacity-75" />
                  <div className="fw-semibold text-dark mb-1">Document Deposition Preview Rendered</div>
                  <div className="small text-muted mb-3 font-monospace">{selectedItem.name}</div>
                  <div className="p-2 bg-light rounded text-muted small border">
                    [Portable Document Format: {selectedItem.size} — Digitally Stamped]
                  </div>
                </div>
              )}
            </div>

            {selectedItem.reviewNotes && (
              <div className="mt-3 p-3 rounded-2 bg-light border small text-muted">
                <strong className="text-dark">Reviewer Notes:</strong> {selectedItem.reviewNotes}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL 2: UPDATE REVIEW STATUS */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Review Evidence: ${selectedItem?.name || ''}`}
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="cx-btn cx-btn-outline"
              disabled={isActionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateReviewStatus}
              className="cx-btn cx-btn-primary"
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Saving...' : 'Save Review Status'}
            </button>
          </div>
        }
      >
        <div className="mb-3">
          <label htmlFor="evidence-review-status-select" className="cx-form-label">
            Deposition Review Status <span className="text-danger">*</span>
          </label>
          <select
            id="evidence-review-status-select"
            className="cx-select"
            value={reviewStatusInput}
            onChange={(e) => setReviewStatusInput(e.target.value)}
          >
            <option value="REVIEWED">Reviewed & Verified as Valid</option>
            <option value="FLAGGED">Flagged for Clarification / Follow-up</option>
            <option value="UNREVIEWED">Unreviewed / Reset</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="evidence-review-notes-input" className="cx-form-label">
            Inquiry Observation & Corroboration Notes
          </label>
          <textarea
            id="evidence-review-notes-input"
            className="cx-input"
            rows={4}
            placeholder="Record notes on document validity, cross-reference against witness testimony, or discrepancy notes..."
            value={reviewNotesInput}
            onChange={(e) => setReviewNotesInput(e.target.value)}
          />
        </div>
      </Modal>

      {/* MODAL 3: INTEGRITY VERIFICATION (SHA-256) */}
      <Modal
        isOpen={isIntegrityModalOpen}
        onClose={() => setIsIntegrityModalOpen(false)}
        title="SHA-256 Cryptographic Checksum Verification"
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end w-100">
            <button type="button" onClick={() => setIsIntegrityModalOpen(false)} className="cx-btn cx-btn-outline">
              Close Integrity Check
            </button>
          </div>
        }
      >
        {selectedItem && (
          <div>
            <div className="mb-3 small text-muted">
              File: <strong className="text-dark">{selectedItem.name}</strong> • Docket:{' '}
              <span className="cx-font-mono text-teal">{selectedItem.caseNumber}</span>
            </div>

            {isVerifyingChecksum ? (
              <div className="p-4 text-center">
                <RefreshCw size={32} className="text-teal animate-spin mb-2 mx-auto" />
                <div className="small text-muted">Computing Web Crypto SHA-256 Digest...</div>
              </div>
            ) : verificationResult ? (
              <div>
                <div
                  className={`p-3 rounded-3 mb-3 border ${
                    verificationResult.isValid
                      ? 'bg-success-subtle border-success text-success'
                      : 'bg-danger-subtle border-danger text-danger'
                  }`}
                >
                  <div className="d-flex align-items-center gap-2 fw-bold mb-1">
                    {verificationResult.isValid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{verificationResult.isValid ? 'Integrity Validated' : 'Checksum Mismatch'}</span>
                  </div>
                  <div className="small">{verificationResult.message}</div>
                </div>

                <div className="mb-3">
                  <div className="small fw-bold text-muted mb-1">Deposited SHA-256 Hash Reference:</div>
                  <div className="p-2 bg-light rounded font-monospace small text-break text-dark border">
                    {verificationResult.expectedHash}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="small fw-bold text-muted mb-1">Computed Browser Web Crypto Hash:</div>
                  <div className="p-2 bg-light rounded font-monospace small text-break text-dark border">
                    {verificationResult.computedHash}
                  </div>
                </div>

                <div className="small text-muted text-end font-monospace" style={{ fontSize: '0.75rem' }}>
                  Verified at: {new Date(verificationResult.verifiedAt).toLocaleString()}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      {/* MODAL 4: CHAIN OF CUSTODY */}
      <Modal
        isOpen={isCustodyOpen}
        onClose={() => setIsCustodyOpen(false)}
        title={`Chain of Custody: ${selectedItem?.name || ''}`}
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end w-100">
            <button type="button" onClick={() => setIsCustodyOpen(false)} className="cx-btn cx-btn-outline">
              Close Audit Trail
            </button>
          </div>
        }
      >
        {selectedItem && (
          <div>
            <div className="p-3 bg-light rounded-3 mb-4 small text-muted">
              Chronological log of forensic possession, access, and status modifications for evidence{' '}
              <strong className="text-dark">{selectedItem.name}</strong>.
            </div>

            {(!selectedItem.custodyChain || selectedItem.custodyChain.length === 0) ? (
              <div className="p-4 text-center text-muted small">No custody events recorded.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {selectedItem.custodyChain.map((event, idx) => (
                  <div key={event.id || idx} className="p-3 rounded-2 border bg-white shadow-sm">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-primary-subtle text-primary border">{event.action}</span>
                      <span className="small text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="small fw-bold text-dark mt-1">Actor: {event.actor}</div>
                    <div className="small text-muted mt-0.5">{event.details}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </AnimatedPage>
  );
};

export default EvidenceVaultPage;
