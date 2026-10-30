import React, { useState } from 'react';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Settings, Shield, User, Bell, Database, Check } from 'lucide-react';
import caseService from '../services/caseService';

export const SettingsPage = () => {
  const { currentUser, currentRole, roles } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('account');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);

  const handleReset = () => {
    caseService.resetMockData();
    toast.success('Demonstration database reset to initial state.');
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="System Governance & Settings"
        subtitle="Manage user profile details, role permissions, and notification preferences."
        breadcrumbs={[{ label: 'Settings' }]}
      />

      <div className="row g-4">
        {/* Left Settings Navigation */}
        <div className="col-12 col-md-4">
          <div className="cx-card p-2">
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`w-100 text-start p-2.5 rounded-2 border-0 d-flex align-items-center gap-2 mb-1 ${
                activeTab === 'account' ? 'bg-primary text-white' : 'bg-transparent text-dark'
              }`}
              style={{ fontSize: '0.85rem', fontWeight: activeTab === 'account' ? 700 : 500 }}
            >
              <User size={16} />
              <span>User Profile & Credentials</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`w-100 text-start p-2.5 rounded-2 border-0 d-flex align-items-center gap-2 mb-1 ${
                activeTab === 'roles' ? 'bg-primary text-white' : 'bg-transparent text-dark'
              }`}
              style={{ fontSize: '0.85rem', fontWeight: activeTab === 'roles' ? 700 : 500 }}
            >
              <Shield size={16} />
              <span>Role Permissions & Authority</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`w-100 text-start p-2.5 rounded-2 border-0 d-flex align-items-center gap-2 ${
                activeTab === 'notifications' ? 'bg-primary text-white' : 'bg-transparent text-dark'
              }`}
              style={{ fontSize: '0.85rem', fontWeight: activeTab === 'notifications' ? 700 : 500 }}
            >
              <Bell size={16} />
              <span>Notification Dispatch</span>
            </button>
          </div>
        </div>

        {/* Right Settings Body */}
        <div className="col-12 col-md-8">
          <div className="cx-card p-4">
            {activeTab === 'account' && (
              <div>
                <h2 className="h6 fw-bold mb-3 text-dark">Active Institutional Profile</h2>
                <div className="mb-3">
                  <label className="cx-form-label">Full Name</label>
                  <input type="text" readOnly value={currentUser?.name || ''} className="cx-input bg-light" />
                </div>
                <div className="mb-3">
                  <label className="cx-form-label">Official Email</label>
                  <input type="text" readOnly value={currentUser?.email || ''} className="cx-input bg-light" />
                </div>
                <div className="mb-3">
                  <label className="cx-form-label">Assigned Department</label>
                  <input type="text" readOnly value={currentUser?.department || ''} className="cx-input bg-light" />
                </div>
                <div className="mb-3">
                  <label className="cx-form-label">Active Role</label>
                  <input type="text" readOnly value={currentRole?.label || currentUser?.role || ''} className="cx-input bg-light" />
                </div>
                <div className="mb-3">
                  <label className="cx-form-label">Institutional Reference</label>
                  <input type="text" readOnly value={currentUser?.userReference || currentUser?.id || ''} className="cx-input bg-light" />
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div>
                <h2 className="h6 fw-bold mb-1 text-dark">Institutional Role & Permissions</h2>
                <p className="text-muted small mb-3">
                  Your active role is bound to your backend credentials and institutional directory entry.
                </p>
                <div className="d-flex flex-column gap-2">
                  {Object.values(roles).map((r) => {
                    const isSelected = r.key === (currentUser?.role || currentRole?.key);
                    return (
                      <div
                        key={r.key}
                        className={`p-3 rounded-2 border d-flex align-items-center justify-content-between ${
                          isSelected ? 'bg-light border-primary' : 'bg-white'
                        }`}
                      >
                        <div>
                          <div className="fw-bold small text-dark d-flex align-items-center gap-2">
                            <span>{r.label}</span>
                            {isSelected && (
                              <span className="badge bg-primary text-white" style={{ fontSize: '0.65rem' }}>
                                Your Active Role
                              </span>
                            )}
                          </div>
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            {r.description}
                          </div>
                        </div>
                        {isSelected && (
                          <Check size={16} className="text-primary flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="h6 fw-bold mb-3 text-dark">Notification Dispatch Preferences</h2>
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailAlerts"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                  />
                  <label className="form-check-label small fw-semibold" htmlFor="emailAlerts">
                    Real-time incident dispatch alerts (SMS & University Email)
                  </label>
                </div>
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="auditLog"
                    checked={auditLogging}
                    onChange={(e) => setAuditLogging(e.target.checked)}
                  />
                  <label className="form-check-label small fw-semibold" htmlFor="auditLog">
                    Immutable activity log capture for proctorial committee compliance
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Dispatch preferences saved.')}
                  className="cx-btn cx-btn-teal mt-2"
                >
                  Save Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default SettingsPage;
