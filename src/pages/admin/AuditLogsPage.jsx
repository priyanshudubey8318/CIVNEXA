import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  RotateCcw,
  Clock,
  User,
  Lock,
  Info,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';
import { ROLES } from '../../constants/roles';

export const AuditLogsPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const loadLogs = () => {
    const data = adminService.getAuditLogs({
      actionType: actionFilter,
      actorRole: roleFilter,
      search: searchQuery,
    });
    setLogs(data);
  };

  useEffect(() => {
    loadLogs();
  }, [searchQuery, actionFilter, roleFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setActionFilter('ALL');
    setRoleFilter('ALL');
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="System Audit Logs"
        subtitle="Activity history capturing case transitions, user actions, and administrative changes."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Audit Logs' }]}
        badge={
          <span className="badge bg-light text-secondary border px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            {logs.length} Events Logged
          </span>
        }
      />

      {/* Filters and Search Console */}
      <div className="cx-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={14} className="text-secondary" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search audit trail by description, action code, actor, or entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Actor Roles</option>
              {Object.keys(ROLES).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="col-5 col-md-2">
            <select
              className="form-select form-select-sm"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="ALL">All Actions</option>
              <option value="USER_CREATED">User Created</option>
              <option value="PERMISSION_TOGGLED">Permission Toggled</option>
              <option value="APPEAL_REGISTERED">Appeal Registered</option>
              <option value="CASE_VERIFIED">Case Verified</option>
              <option value="EVIDENCE_HASH_VERIFIED">Evidence Hash Verified</option>
              <option value="DEPARTMENT_CREATED">Department Created</option>
            </select>
          </div>

          <div className="col-1 col-md-1 text-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-sm btn-outline-secondary w-100"
              title="Reset"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Entries Ledger */}
      <div className="cx-card mb-4">
        <div className="cx-card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <History size={16} className="text-teal" />
            <h2 className="h6 mb-0 fw-bold">Audit Event Ledger ({logs.length} Events Logged)</h2>
          </div>
          <span className="badge bg-light text-dark border">
            Append-Only Immutable Ledger
          </span>
        </div>

        <div className="cx-card-body p-0">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-muted small">
              No activity recorded
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cx-table align-middle">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Entity Type</th>
                    <th>Associated ID</th>
                    <th>Event Description</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className="small cx-font-mono text-dark">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary fw-semibold cx-font-mono" style={{ fontSize: '0.7rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <strong className="text-dark small d-block">{log.actor?.name}</strong>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {log.actor?.role}
                        </span>
                      </td>
                      <td>
                        <span className="small text-secondary fw-medium">{log.entityType}</span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border cx-font-mono" style={{ fontSize: '0.7rem' }}>
                          {log.entityId}
                        </span>
                      </td>
                      <td>
                        <span className="small text-secondary" style={{ fontSize: '0.78rem' }}>
                          {log.description}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default AuditLogsPage;
