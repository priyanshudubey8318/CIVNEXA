import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { Sparkles, FileText, CheckCircle, Clock, ShieldAlert, X } from 'lucide-react';

export const AiCaseSummaryModal = ({ caseId, caseNumber, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.summarizeCase(caseId);
      setSummary(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate AI case synopsis.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (caseId) {
      fetchSummary();
    }
  }, [caseId]);

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          <div className="modal-header border-bottom py-3">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              AI Case Docket Synopsis • {caseNumber}
            </h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="text-muted small mt-2">
                  Analyzing docket evidence, proctor notes, and defense statements...
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger small py-2 d-flex align-items-center gap-2">
                <ShieldAlert size={16} />
                <div>{error}</div>
              </div>
            )}

            {!loading && summary && (
              <div>
                {/* Executive Summary */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-2">Executive Incident Synopsis</h6>
                  <p className="text-dark bg-light p-3 rounded border mb-0" style={{ lineHeight: '1.6', fontSize: '14px' }}>
                    {summary.summary}
                  </p>
                </div>

                {/* Key Findings */}
                {summary.keyFindings && summary.keyFindings.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark mb-2">Key Docket Findings</h6>
                    <ul className="list-group list-group-flush border rounded small">
                      {summary.keyFindings.map((finding, idx) => (
                        <li key={idx} className="list-group-item d-flex align-items-start gap-2 py-2">
                          <CheckCircle size={16} className="text-success mt-1 flex-shrink-0" />
                          <div>{finding}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timeline Highlights */}
                {summary.timelineHighlights && summary.timelineHighlights.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark mb-2">Timeline Highlights</h6>
                    <div className="p-3 bg-light rounded border small">
                      {summary.timelineHighlights.map((t, idx) => (
                        <div key={idx} className="d-flex align-items-center gap-2 mb-1">
                          <Clock size={14} className="text-muted flex-shrink-0" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preserved Source Citations */}
                {summary.citations && summary.citations.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold text-dark mb-2">Preserved Source Citations</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {summary.citations.map((c, idx) => (
                        <span key={idx} className="badge bg-light text-dark border font-monospace px-2 py-1">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statutory Disclaimer */}
                <div className="alert alert-warning small py-2 mb-0" style={{ fontSize: '11px' }}>
                  <strong>Statutory Notice:</strong> {summary.disclaimers}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer border-top py-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close Synopsis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiCaseSummaryModal;
