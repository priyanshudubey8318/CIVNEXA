import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, KeyRound, ArrowRight, RotateCw, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { pageTransitionVariants } from '../../animations/motionVariants';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle resend countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    setErrorMessage('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !email.trim()) {
      setErrorMessage('Institutional email is required.');
      return;
    }

    if (!otp || otp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.verifyEmail({
        email: email.trim(),
        otp: otp.trim(),
      });

      toast.success(
        result.message || 'Email verification successful. Your account is now pending administrative approval.',
        'Verification Successful'
      );

      navigate(`/pending-approval?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      const msg = err.message || 'Verification failed. Please check the code and try again.';
      setErrorMessage(msg);
      toast.error(msg, 'Verification Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    if (!email || !email.trim()) {
      setErrorMessage('Please provide an institutional email to resend the code.');
      return;
    }

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await authService.resendVerification({ email: email.trim() });
      setSuccessMessage(result.message || 'A fresh 6-digit verification code has been dispatched.');
      setResendCooldown(60);
      toast.info('Verification code resent. Check your inbox.', 'Code Sent');
    } catch (err) {
      const msg = err.message || 'Failed to resend verification code. Please wait before retrying.';
      setErrorMessage(msg);
      toast.error(msg, 'Resend Error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="cx-card p-4 p-md-5 shadow-lg"
      style={{ maxWidth: '480px', margin: '0 auto' }}
    >
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{ width: '56px', height: '56px', backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--cx-teal-600, #0d9488)' }}
        >
          <Mail size={28} />
        </div>
        <h1 className="h4 fw-bold text-dark mb-1" style={{ color: 'var(--cx-navy-900)' }}>
          Verify Institutional Email
        </h1>
        <p className="text-muted small mb-0">
          Enter the 6-digit verification code dispatched to your institutional address.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="alert alert-success p-2.5 small d-flex align-items-start gap-2 mb-3 rounded-3" role="alert">
          <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-success" />
          <div>{successMessage}</div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="alert alert-danger p-2.5 small d-flex align-items-start gap-2 mb-3 rounded-3" role="alert">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-danger" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleVerify} noValidate>
        {/* Email Address */}
        <div className="mb-3">
          <label htmlFor="verify-email-input" className="cx-form-label">
            Institutional Email Address <span className="text-danger">*</span>
          </label>
          <div className="position-relative">
            <input
              id="verify-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., student@civnexa.edu"
              className="cx-input"
              required
              disabled={isLoading || Boolean(initialEmail)}
            />
          </div>
        </div>

        {/* 6-Digit OTP */}
        <div className="mb-4">
          <label htmlFor="verify-otp-input" className="cx-form-label d-flex justify-content-between align-items-center">
            <span>6-Digit Verification Code <span className="text-danger">*</span></span>
            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Valid for 10 minutes</span>
          </label>
          <div className="position-relative">
            <input
              id="verify-otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={handleOtpChange}
              placeholder="123456"
              className="cx-input text-center fw-bold fs-4 tracking-widest letter-spacing-2"
              style={{ letterSpacing: '0.45em' }}
              required
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div className="form-text small text-muted text-center mt-2">
            Max 5 verification attempts allowed.
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || otp.length !== 6}
          className="cx-btn cx-btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 mb-3"
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>Verify Institutional Account</span>
            </>
          )}
        </button>

        {/* Resend Action */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="btn btn-link p-0 text-decoration-none small text-muted hover-underline d-inline-flex align-items-center gap-1"
            style={{ fontSize: '0.85rem' }}
          >
            <RotateCw size={14} className={isResending ? 'spin' : ''} />
            <span>
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : isResending
                ? 'Sending fresh code...'
                : 'Did not receive code? Resend'}
            </span>
          </button>
        </div>
      </form>

      {/* Back to sign in */}
      <div className="mt-4 pt-3 border-top text-center text-muted" style={{ fontSize: '0.8rem' }}>
        <Link to="/login" className="text-decoration-none text-muted hover-underline d-inline-flex align-items-center gap-1">
          <ArrowLeft size={13} /> Back to Sign In
        </Link>
      </div>
    </motion.div>
  );
};

export default VerifyEmailPage;
