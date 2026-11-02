import React, { useState, useEffect } from 'react';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Settings,
  Shield,
  User,
  Bell,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export const SettingsPage = () => {
  const { currentUser, currentRole, roles, changePassword } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(
    currentUser?.passwordChangeRequired ? 'security' : 'account'
  );
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (currentUser?.passwordChangeRequired) {
      setActiveTab('security');
    }
  }, [currentUser?.passwordChangeRequired]);

  // Password complexity evaluation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~`]/.test(newPassword);
  const isMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);
  const isComplex = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setFieldErrors({});
    setSuccessMessage('');

    if (!currentPassword) {
      setFieldErrors((prev) => ({ ...prev, currentPassword: 'Current password is required.' }));
      return;
    }
    if (!newPassword) {
      setFieldErrors((prev) => ({ ...prev, newPassword: 'New password is required.' }));
      return;
    }
    if (!confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Confirm password is required.' }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }
    if (!isComplex) {
      setPasswordError('New password does not satisfy all institutional complexity requirements.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password cannot be the same as your current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      const successText = 'Your password has been changed successfully. Initial bootstrap notice cleared.';
      setSuccessMessage(successText);
      toast.success('Account password updated successfully.', 'Password Changed');
    } catch (err) {
      const errMap = err.fieldErrors ? { ...err.fieldErrors } : {};
      const msg = err.message || 'Failed to change password. Please verify current credentials.';

      if (msg.toLowerCase().includes('current password is incorrect')) {
        errMap.currentPassword = 'The current password you entered is incorrect.';
      } else if (msg.toLowerCase().includes('same as the current') || msg.toLowerCase().includes('same as your current')) {
        errMap.newPassword = 'New password cannot be the same as your current password.';
      } else if (msg.toLowerCase().includes('do not match')) {
        errMap.confirmPassword = 'Confirmation password does not match.';
      }

      setFieldErrors(errMap);
      setPasswordError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="System Governance & Settings"
        subtitle="Manage user profile details, credentials, role permissions, and notification preferences."
        breadcrumbs={[{ label: 'Settings' }]}
      />

      {currentUser?.passwordChangeRequired && (
        <div className="alert alert-warning p-3 d-flex align-items-center justify-content-between mb-4 rounded-3 shadow-sm" role="alert">
          <div className="d-flex align-items-center gap-2">
            <ShieldAlert size={20} className="text-warning flex-shrink-0" />
            <div>
              <strong>Initial Bootstrap Security Notice:</strong> This administrator account requires an immediate password update.
            </div>
          </div>
          {activeTab !== 'security' && (
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className="btn btn-sm btn-dark px-3 py-1 fw-semibold"
            >
              Update Password Now
            </button>
          )}
        </div>
      )}

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
              onClick={() => setActiveTab('security')}
              className={`w-100 text-start p-2.5 rounded-2 border-0 d-flex align-items-center justify-content-between mb-1 ${
                activeTab === 'security' ? 'bg-primary text-white' : 'bg-transparent text-dark'
              }`}
              style={{ fontSize: '0.85rem', fontWeight: activeTab === 'security' ? 700 : 500 }}
            >
              <div className="d-flex align-items-center gap-2">
                <KeyRound size={16} />
                <span>Security & Password Update</span>
              </div>
              {currentUser?.passwordChangeRequired && (
                <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
                  Action Required
                </span>
              )}
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
            {/* TAB: ACCOUNT */}
            {activeTab === 'account' && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="h6 fw-bold mb-0 text-dark">Active Institutional Profile</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <Lock size={13} /> Change Password
                  </button>
                </div>
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
                  <input type="text" readOnly value={currentUser?.department || 'General Administration'} className="cx-input bg-light" />
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

            {/* TAB: SECURITY & PASSWORD UPDATE */}
            {activeTab === 'security' && (
              <div>
                <div className="mb-4">
                  <h2 className="h6 fw-bold mb-1 text-dark">Account Password & Security</h2>
                  <p className="text-muted small mb-0">
                    Update your account password. Changes take effect immediately and require new credentials on subsequent sign-ins.
                  </p>
                </div>

                {successMessage && (
                  <div className="alert alert-success p-3 small d-flex align-items-start gap-2 mb-3 rounded-3" role="alert">
                    <CheckCircle2 size={16} className="mt-0.5 text-success flex-shrink-0" />
                    <div>{successMessage}</div>
                  </div>
                )}

                {passwordError && (
                  <div className="alert alert-danger p-2.5 small d-flex align-items-start gap-2 mb-3 rounded-3" role="alert">
                    <AlertCircle size={16} className="mt-0.5 text-danger flex-shrink-0" />
                    <div>{passwordError}</div>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} noValidate>
                  {/* Current Password */}
                  <div className="mb-3">
                    <label htmlFor="current-password-input" className="cx-form-label">
                      Current Password <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <input
                        id="current-password-input"
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, currentPassword: null }));
                          setPasswordError('');
                        }}
                        placeholder="Enter your current password"
                        className={`cx-input pe-5 ${fieldErrors.currentPassword ? 'is-invalid border-danger' : ''}`}
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted p-2"
                        aria-label={showCurrent ? 'Hide current password' : 'Toggle current password visibility'}
                      >
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.currentPassword && (
                      <div className="text-danger small mt-1">{fieldErrors.currentPassword}</div>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="mb-3">
                    <label htmlFor="new-password-input" className="cx-form-label">
                      New Password <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <input
                        id="new-password-input"
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, newPassword: null }));
                          setPasswordError('');
                        }}
                        placeholder="Min. 8 characters with upper, lower, number & symbol"
                        className={`cx-input pe-5 ${fieldErrors.newPassword ? 'is-invalid border-danger' : ''}`}
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted p-2"
                        aria-label={showNew ? 'Hide new password' : 'Toggle new password visibility'}
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.newPassword && (
                      <div className="text-danger small mt-1">{fieldErrors.newPassword}</div>
                    )}

                    {/* Complexity Checklist */}
                    <div className="p-2.5 mt-2 bg-light rounded-2 border">
                      <div className="small fw-bold text-dark mb-1" style={{ fontSize: '0.75rem' }}>
                        Password Requirements Checklist:
                      </div>
                      <div className="row g-1 text-muted" style={{ fontSize: '0.72rem' }}>
                        <div className={`col-6 d-flex align-items-center gap-1 ${hasMinLength ? 'text-success fw-semibold' : ''}`}>
                          {hasMinLength ? <Check size={12} className="text-success" /> : <span style={{ width: 12 }}>•</span>}
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`col-6 d-flex align-items-center gap-1 ${hasUppercase ? 'text-success fw-semibold' : ''}`}>
                          {hasUppercase ? <Check size={12} className="text-success" /> : <span style={{ width: 12 }}>•</span>}
                          <span>One uppercase letter (A-Z)</span>
                        </div>
                        <div className={`col-6 d-flex align-items-center gap-1 ${hasLowercase ? 'text-success fw-semibold' : ''}`}>
                          {hasLowercase ? <Check size={12} className="text-success" /> : <span style={{ width: 12 }}>•</span>}
                          <span>One lowercase letter (a-z)</span>
                        </div>
                        <div className={`col-6 d-flex align-items-center gap-1 ${hasDigit ? 'text-success fw-semibold' : ''}`}>
                          {hasDigit ? <Check size={12} className="text-success" /> : <span style={{ width: 12 }}>•</span>}
                          <span>One numeric digit (0-9)</span>
                        </div>
                        <div className={`col-12 d-flex align-items-center gap-1 ${hasSpecial ? 'text-success fw-semibold' : ''}`}>
                          {hasSpecial ? <Check size={12} className="text-success" /> : <span style={{ width: 12 }}>•</span>}
                          <span>One special symbol (!@#$%^&*...)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="mb-4">
                    <label htmlFor="confirm-password-input" className="cx-form-label">
                      Confirm New Password <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <input
                        id="confirm-password-input"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                          setPasswordError('');
                        }}
                        placeholder="Re-enter your new password"
                        className={`cx-input pe-5 ${fieldErrors.confirmPassword ? 'is-invalid border-danger' : ''}`}
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted p-2"
                        aria-label={showConfirm ? 'Hide confirm password' : 'Toggle confirm password visibility'}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <div className={`small mt-1 d-flex align-items-center gap-1 ${isMatch ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
                        {isMatch ? <Check size={13} /> : <AlertCircle size={13} />}
                        <span>{isMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                      </div>
                    )}
                    {fieldErrors.confirmPassword && (
                      <div className="text-danger small mt-1">{fieldErrors.confirmPassword}</div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !isComplex || !isMatch || !currentPassword}
                    className="cx-btn cx-btn-primary py-2.5 px-4 d-inline-flex align-items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: ROLES */}
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

            {/* TAB: NOTIFICATIONS */}
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
