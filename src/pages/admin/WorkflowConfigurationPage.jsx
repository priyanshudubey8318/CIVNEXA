import React, { useState } from 'react';
import {
  GitFork,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Scale,
  FolderKanban,
  RotateCcw,
  Shield,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';

export const WorkflowConfigurationPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [activeWorkflowTab, setActiveWorkflowTab] = useState('disciplinary'); // 'disciplinary' | 'appeals'
  const config = adminService.getWorkflowConfig();

  // Transition Validator Sandbox State
  const [testCurrentStatus, setTestCurrentStatus] = useState('SUBMITTED');
  const [testTargetStatus, setTestTargetStatus] = useState('VERIFIED');
  const [validationResult, setValidationResult] = useState(null);

  const activeWorkflow =
    activeWorkflowTab === 'disciplinary'
      ? config.disciplinaryWorkflow
      : config.appealsWorkflow;

  const handleTestTransition = (e) => {
    e.preventDefault();
    try {
      adminService.validateStateTransition(
        testCurrentStatus,
        testTargetStatus,
        activeWorkflowTab === 'disciplinary' ? 'disciplinaryWorkflow' : 'appealsWorkflow'
      );
      setValidationResult({
        success: true,
        message: `Valid State Transition: "${testCurrentStatus}" can directly transition to "${testTargetStatus}".`,
      });
      toast.success('Transition permitted by institutional workflow rule.');
    } catch (err) {
      setValidationResult({
        success: false,
        message: err.message,
      });
      toast.error('Transition rejected: Invalid workflow progression.');
    }
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Workflow Configuration"
        subtitle="Inspect case status transitions, review requirements, and appellate steps."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Workflows' }]}
        badge={
          <span className="badge bg-light text-secondary border px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            Workflow Rules
          </span>
        }
      />

      {/* Workflow Tabs */}
      <div className="mb-4">
        <ul className="nav nav-pills gap-2 bg-light p-1.5 rounded-3 border d-inline-flex">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-1.5 px-3 small fw-bold ${
                activeWorkflowTab === 'disciplinary' ? 'active bg-teal text-white' : 'text-secondary'
              }`}
              onClick={() => {
                setActiveWorkflowTab('disciplinary');
                setTestCurrentStatus('SUBMITTED');
                setTestTargetStatus('VERIFIED');
                setValidationResult(null);
              }}
            >
              <FolderKanban size={14} className="me-1.5 d-inline" />
              <span>Standard Disciplinary & Hearing Workflow</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-1.5 px-3 small fw-bold ${
                activeWorkflowTab === 'appeals' ? 'active bg-teal text-white' : 'text-secondary'
              }`}
              onClick={() => {
                setActiveWorkflowTab('appeals');
                setTestCurrentStatus('SUBMITTED');
                setTestTargetStatus('UNDER_REVIEW');
                setValidationResult(null);
              }}
            >
              <Scale size={14} className="me-1.5 d-inline" />
              <span>Appellate Reconsideration Workflow</span>
            </button>
          </li>
        </ul>
      </div>

      <div className="row g-4">
        {/* Left Side: Visual State Transition Matrix */}
        <div className="col-12 col-lg-8">
          <div className="cx-card mb-4">
            <div className="cx-card-header d-flex justify-content-between align-items-center">
              <h2 className="h6 mb-0 fw-bold">{activeWorkflow.name}</h2>
              <span className="badge bg-light text-dark border">
                {activeWorkflow.availableStatuses.length} Defined States
              </span>
            </div>

            <div className="cx-card-body p-0">
              <div className="table-responsive">
                <table className="cx-table align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: '220px' }}>Current State</th>
                      <th>Permitted Target Next States</th>
                      <th>Terminal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeWorkflow.availableStatuses.map((st) => {
                      const nextStates = activeWorkflow.allowedTransitions[st] || [];
                      const isTerminal = nextStates.length === 0;

                      return (
                        <tr key={st}>
                          <td>
                            <strong className="text-dark small cx-font-mono">{st}</strong>
                          </td>
                          <td>
                            {isTerminal ? (
                              <span className="badge bg-light text-muted border" style={{ fontSize: '0.7rem' }}>
                                Terminal State (No outgoing transitions)
                              </span>
                            ) : (
                              <div className="d-flex flex-wrap gap-1">
                                {nextStates.map((ns) => (
                                  <span
                                    key={ns}
                                    className="badge bg-teal-subtle text-teal border border-teal-subtle py-1 px-2 cx-font-mono"
                                    style={{ fontSize: '0.68rem' }}
                                  >
                                    → {ns}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            {isTerminal ? (
                              <span className="badge bg-secondary text-white" style={{ fontSize: '0.65rem' }}>
                                Yes
                              </span>
                            ) : (
                              <span className="badge bg-light text-muted border" style={{ fontSize: '0.65rem' }}>
                                No
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Transition Rule Tester */}
        <div className="col-12 col-lg-4">
          <div className="cx-card p-4">
            <h3 className="h6 fw-bold text-dark mb-1">State Transition Validator</h3>
            <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
              Test whether a specific state change complies with the current workflow configuration rules.
            </p>

            <form onSubmit={handleTestTransition}>
              <div className="mb-3">
                <label className="cx-form-label fw-bold">Current State:</label>
                <select
                  className="form-select form-select-sm"
                  value={testCurrentStatus}
                  onChange={(e) => {
                    setTestCurrentStatus(e.target.value);
                    setValidationResult(null);
                  }}
                >
                  {activeWorkflow.availableStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="cx-form-label fw-bold">Desired Target State:</label>
                <select
                  className="form-select form-select-sm"
                  value={testTargetStatus}
                  onChange={(e) => {
                    setTestTargetStatus(e.target.value);
                    setValidationResult(null);
                  }}
                >
                  {activeWorkflow.availableStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="cx-btn cx-btn-teal w-100 mb-3">
                <GitFork size={14} />
                <span>Evaluate Transition Rule</span>
              </button>
            </form>

            {validationResult && (
              <div
                className={`p-3 rounded border small ${
                  validationResult.success ? 'bg-success-subtle border-success text-success-emphasis' : 'bg-danger-subtle border-danger text-danger-emphasis'
                }`}
              >
                <div className="d-flex align-items-center gap-1.5 fw-bold mb-1">
                  {validationResult.success ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{validationResult.success ? 'Permitted Transition' : 'Prohibited Transition'}</span>
                </div>
                <div style={{ fontSize: '0.75rem' }}>{validationResult.message}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default WorkflowConfigurationPage;
