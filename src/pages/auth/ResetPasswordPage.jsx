import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check, X, CheckCircle2, AlertCircle, ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { pageTransitionVariants } from '../../animations/motionVariants';

export const ResetPasswordPage = () => {
  const toast = useToast();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
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
  const isValid = hasMinLength && hasNumber && hasUppercase && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!isValid) return;

    setIsLoading(true);

    try {
      await authService.resetPassword({
        email: email.trim() || 'student@civnexa.edu',
        otp: otp.trim() || '123456',
        newPassword,
        confirmPassword,
      });
      setIsSuccess(true);
      toast.success('Your password has been successfully reset. You may now sign in.');
    } catch (err) {
      setServerError(err.message || 'Unable to reset password. Please check your inputs.');
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
          Create a new secure password for your institutional account.
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
            Your password has been updated. You can now authenticate with your new credentials.
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
          </div>

          {/* Validation Checklist */}
          <div className="p-3 bg-light rounded border mb-4">
            <div className="small fw-semibold text-muted mb-2">Password Requirements:</div>
            <div className="d-flex flex-column gap-1 small">
              <div className={`d-flex align-items-center gap-1.5 ${hasMinLength ? 'text-success' : 'text-muted'}`}>
                {hasMinLength ? <Check size={14} /> : <X size={14} />}
                <span>At least 8 characters</span>
              </div>
              <div className={`d-flex align-items-center gap-1.5 ${hasNumber ? 'text-success' : 'text-muted'}`}>
                {hasNumber ? <Check size={14} /> : <X size={14} />}
                <span>At least one number</span>
              </div>
              <div className={`d-flex align-items-center gap-1.5 ${hasUppercase ? 'text-success' : 'text-muted'}`}>
                {hasUppercase ? <Check size={14} /> : <X size={14} />}
                <span>At least one uppercase letter</span>
              </div>
              <div className={`d-flex align-items-center gap-1.5 ${passwordsMatch ? 'text-success' : 'text-muted'}`}>
                {passwordsMatch ? <Check size={14} /> : <X size={14} />}
                <span>Passwords match</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isValid}
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
