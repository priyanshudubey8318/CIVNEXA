import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check, X, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { pageTransitionVariants } from '../../animations/motionVariants';

export const ResetPasswordPage = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Requirements checks
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const passwordsMatch = Boolean(newPassword && newPassword === confirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errors = {};

    if (!hasMinLength) errors.length = 'Password must be at least 8 characters.';
    if (!hasNumber) errors.number = 'Password must include at least one number.';
    if (!hasUppercase) errors.uppercase = 'Password must include at least one uppercase letter.';
    if (!passwordsMatch) errors.match = 'Passwords do not match.';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);

    try {
      await authService.resetPassword({ newPassword, confirmPassword });
      setIsSuccess(true);
      toast.success('Demonstration password updated. You may now sign in.');
    } catch (err) {
      setServerError(err.message || 'Unable to update demonstration password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="cx-card p-4 p-md-5 shadow-lg"
    >
      <div className="mb-4">
        <Link
          to="/login"
          className="text-decoration-none small d-inline-flex align-items-center gap-1.5 text-muted hover-underline mb-3"
        >
          <ArrowLeft size={14} />
          <span>Back to sign in</span>
        </Link>
        <div className="d-flex align-items-center gap-2 mb-1">
          <KeyRound size={20} style={{ color: 'var(--cx-teal-600)' }} />
          <h1 className="h4 fw-bold text-dark mb-0" style={{ color: 'var(--cx-navy-900)' }}>
            Reset Password
          </h1>
        </div>
        <p className="text-muted small mb-0">
          Create a new secure password for your demonstration account.
        </p>
      </div>

      {serverError && (
        <div className="alert alert-danger p-2.5 small d-flex align-items-center gap-2 mb-3" role="alert">
          <AlertCircle size={16} />
          <span>{serverError}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="p-4 bg-light rounded-3 border text-center">
          <div
            className="d-inline-flex align-items-center justify-content-center p-3 mb-3 rounded-circle bg-success-subtle text-success"
          >
            <CheckCircle2 size={32} />
          </div>
          <h2 className="h5 fw-bold text-dark mb-2">Password Successfully Reset</h2>
          <p className="small text-muted mb-4">
            Your demonstration password has been simulated as updated. You can now authenticate with your new credentials.
          </p>
          <Link
            to="/login"
            className="cx-btn cx-btn-primary w-100 py-2.5"
          >
            Proceed to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {/* New Password */}
          <div className="mb-3">
            <label htmlFor="reset-new-password" className="cx-form-label">
              New Password <span className="text-danger">*</span>
            </label>
            <div className="position-relative">
              <input
                id="reset-new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="cx-input pe-5"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="position-absolute top-50 end-0 translate-middle-y me-2.5 btn btn-link p-1 text-muted"
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label htmlFor="reset-confirm-password" className="cx-form-label">
              Confirm New Password <span className="text-danger">*</span>
            </label>
            <div className="position-relative">
              <input
                id="reset-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={`cx-input pe-5 ${validationErrors.match ? 'is-invalid border-danger' : ''}`}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="position-absolute top-50 end-0 translate-middle-y me-2.5 btn btn-link p-1 text-muted"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {validationErrors.match && (
              <div className="cx-form-error text-danger small mt-1">
                {validationErrors.match}
              </div>
            )}
          </div>

          {/* Password Requirements Checklist */}
          <div className="p-3 bg-light rounded-3 border mb-4">
            <div className="small fw-bold text-dark mb-2">Password Requirements:</div>
            <ul className="list-unstyled m-0 p-0 d-flex flex-column gap-1.5" style={{ fontSize: '0.78rem' }}>
              <li className={`d-flex align-items-center gap-2 ${hasMinLength ? 'text-success' : 'text-muted'}`}>
                {hasMinLength ? <Check size={14} className="text-success" /> : <X size={14} className="text-danger" />}
                <span>At least 8 characters long</span>
              </li>
              <li className={`d-flex align-items-center gap-2 ${hasNumber ? 'text-success' : 'text-muted'}`}>
                {hasNumber ? <Check size={14} className="text-success" /> : <X size={14} className="text-danger" />}
                <span>At least one number (0-9)</span>
              </li>
              <li className={`d-flex align-items-center gap-2 ${hasUppercase ? 'text-success' : 'text-muted'}`}>
                {hasUppercase ? <Check size={14} className="text-success" /> : <X size={14} className="text-danger" />}
                <span>At least one uppercase letter (A-Z)</span>
              </li>
              <li className={`d-flex align-items-center gap-2 ${passwordsMatch ? 'text-success' : 'text-muted'}`}>
                {passwordsMatch ? <Check size={14} className="text-success" /> : <X size={14} className="text-danger" />}
                <span>Passwords match</span>
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading || !hasMinLength || !hasNumber || !hasUppercase || !passwordsMatch}
            className="cx-btn cx-btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Updating password...</span>
              </>
            ) : (
              <span>Reset & Update Password</span>
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
};

export default ResetPasswordPage;
