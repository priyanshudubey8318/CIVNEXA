import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Eye, ArrowRight, ShieldAlert } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';

/**
 * CaseSummaryTable Component
 * Compact, role-filtered summary table of cases with direct inspection routes.
 */
export const CaseSummaryTable = ({
  cases = [],
  title = 'Case Summary Dossier',
  subtitle = 'Prioritized active cases requiring immediate review',
  viewAllLink = '/cases',
  onInspectCase = null,
  emptyMessage = 'No active cases in this queue.',
  maxRows = 6,
}) => {
  const displayCases = cases.slice(0, maxRows);

  return (
    <div className="cx-card h-100 shadow-sm border-0">
      <div className="cx-card-header d-flex align-items-center justify-content-between p-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <FolderKanban size={16} className="text-teal" />
          <div>
            <h2 className="h6 mb-0 fw-bold text-dark">{title}</h2>
            {subtitle && <p className="text-muted small mb-0" style={{ fontSize: '0.72rem' }}>{subtitle}</p>}
          </div>
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-decoration-none small text-teal fw-medium d-inline-flex align-items-center gap-1"
            style={{ fontSize: '0.75rem' }}
          >
            <span>Complete Registry</span>
            <ArrowRight size={12} />
          </Link>
        )}
      </div>

      <div className="cx-card-body p-0">
        {displayCases.length === 0 ? (
          <div className="p-4 text-center text-muted small">
            <FolderKanban size={20} className="mb-2 text-secondary opacity-50" />
            <p className="mb-0">{emptyMessage}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.8125rem' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '120px' }}>Case Ref</th>
                  <th>Incident Details</th>
                  <th>Subject Student</th>
                  <th style={{ width: '130px' }}>Status</th>
                  <th style={{ width: '100px' }}>Priority</th>
                  <th style={{ width: '80px' }} className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayCases.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <Link
                          to={`/cases/${c.id}`}
                          className="cx-font-mono fw-bold text-decoration-none"
                          style={{ color: 'var(--cx-teal-700)', fontSize: '0.8rem' }}
                        >
                          {c.caseNumber || c.id}
                        </Link>
                        {c.isConfidential && (
                          <span
                            className="badge bg-danger-subtle text-danger border border-danger-subtle"
                            style={{ fontSize: '0.6rem', padding: '2px 4px' }}
                            title="Restricted"
                          >
                            Confidential
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="fw-medium text-dark text-truncate" style={{ maxWidth: '240px' }} title={c.title}>
                        {c.title}
                      </div>
                      <div className="text-muted small d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem' }}>
                        <span>{c.category}</span>
                        <span>•</span>
                        <span>{c.departmentCode || c.department}</span>
                      </div>
                    </td>
                    <td>
                      <div className="fw-medium text-dark" style={{ fontSize: '0.8rem' }}>
                        {c.student?.name || 'Unassigned'}
                      </div>
                      <div className="cx-font-mono text-muted" style={{ fontSize: '0.7rem' }}>
                        {c.student?.rollNo || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>
                    <td className="text-end">
                      {onInspectCase ? (
                        <button
                          type="button"
                          onClick={() => onInspectCase(c)}
                          className="cx-btn cx-btn-ghost cx-btn-sm py-1 px-2"
                          title="Inspect Case"
                        >
                          <Eye size={13} />
                        </button>
                      ) : (
                        <Link
                          to={`/cases/${c.id}`}
                          className="cx-btn cx-btn-ghost cx-btn-sm py-1 px-2 text-decoration-none"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseSummaryTable;
