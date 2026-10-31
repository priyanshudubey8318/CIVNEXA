import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { Sparkles, Check, AlertTriangle, Copy, ShieldAlert, ArrowRight } from 'lucide-react';

export const AiComplaintClassifier = ({ title, description, onApplySuggestion }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [classification, setClassification] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!title?.trim() || !description?.trim()) {
      setError('Please provide both a Title and Description before requesting AI analysis.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setApplied(false);

    try {
      const [classResult, dupResult] = await Promise.all([
        aiService.classifyComplaint({ title, description }),
        aiService.detectDuplicates({ title, description }),
      ]);

      setClassification(classResult);
      setDuplicates(dupResult || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'AI analysis temporarily unavailable. Manual classification active.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (classification && onApplySuggestion) {
      onApplySuggestion(classification);
      setApplied(true);
    }
  };

  return (
    <div className="card border shadow-sm mb-4" style={{ borderRadius: '12px', backgroundColor: '#fdfcfe' }}>
      <div className="card-body p-3 p-md-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h6 className="fw-bold mb-0">AI Complaint Classification & Duplicate Detection</h6>
          </div>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Analyzing Complaint...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Analyze Complaint with AI
              </>
            )}
          </button>
        </div>

        <p className="text-muted small mb-0">
          Evaluates incident text to recommend appropriate categorization, priority level, and checks for duplicate reports.
        </p>

        {error && (
          <div className="alert alert-warning small py-2 mt-3 mb-0 d-flex align-items-center gap-2">
            <AlertTriangle size={15} />
            <div>{error}</div>
          </div>
        )}

        {/* Duplicate Warning */}
        {duplicates.length > 0 && (
          <div className="alert alert-danger small py-2 mt-3 mb-0">
            <div className="fw-bold d-flex align-items-center gap-1">
              <ShieldAlert size={15} /> Potential Duplicate Complaints Detected ({duplicates.length})
            </div>
            <div className="text-muted mt-1">
              Notice: Similar cases are already registered. Review existing records to prevent duplicate administrative dockets:
            </div>
            <ul className="mb-0 mt-1 ps-3">
              {duplicates.slice(0, 3).map((d) => (
                <li key={d.caseId}>
                  <strong>{d.caseNumber}</strong>: "{d.title}" ({d.similarityScore}% conceptual match)
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Classification Recommendation */}
        {classification && (
          <div className="mt-3 p-3 bg-white border rounded">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                Suggested Category: {classification.suggestedCategory}
              </span>
              <span className="badge bg-secondary-subtle text-secondary small">
                Confidence: {Math.round((classification.confidence || 0.8) * 100)}%
              </span>
            </div>

            <div className="small text-muted mb-2">
              <div><strong>Suggested Priority:</strong> <span className="text-dark">{classification.suggestedPriority}</span></div>
              <div><strong>Suggested Department:</strong> <span className="text-dark">{classification.suggestedDepartment}</span></div>
              {classification.reasoning && <div><strong>Reasoning:</strong> {classification.reasoning}</div>}
            </div>

            <div className="p-2 bg-light rounded text-muted small mb-3 border" style={{ fontSize: '11px' }}>
              <strong>Human Confirmation Required:</strong> AI recommendations are advisory only. Proctorial committee members make final classification decisions.
            </div>

            <button
              type="button"
              className={`btn btn-sm ${applied ? 'btn-success' : 'btn-primary'} d-flex align-items-center gap-1`}
              onClick={handleApply}
              disabled={applied}
            >
              {applied ? (
                <>
                  <Check size={14} /> Applied to Form
                </>
              ) : (
                <>
                  <ArrowRight size={14} /> Apply Recommendation
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiComplaintClassifier;
