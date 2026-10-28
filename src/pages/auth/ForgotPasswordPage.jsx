import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { authService } from '../../services/authService';
import { pageTransitionVariants } from '../../animations/motionVariants';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setServerError('');

    if (!email || !email.trim()) {
      setEmailError('Please enter your institutional email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address (e.g., user@civnexa.edu).');
      return;
    }

    setIsLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (err) {
      setServerError(err.message || 'Unable to process recovery request.');
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
        <h1 className="h4 fw-bold text-dark mb-1" style={{ color: 'var(--cx-navy-900)' }}>
          Password Recovery
        </h1>
        <p className="text-muted small mb-0">
          Enter your registered institutional email to receive recovery instructions.
        </p>
      </div>

      {serverError && (
        <div className="alert alert-danger p-2.5 small d-flex align-items-center gap-2 mb-3" role="alert">
          <AlertCircle size={16} />
          <span>{serverError}</span>
        </div>
      )}

      {isSubmitted ? (
        <div className="p-3 bg-light rounded-3 border">
          <div className="d-flex align-items-center gap-2 text-success mb-2">
            <CheckCircle2 size={18} />
            <h2 className="h6 mb-0 fw-bold">Recovery Request Processed</h2>
          </div>
          <p className="small text-muted mb-3" style={{ lineHeight: 1.5 }}>
            A simulated password reset notice was generated for <strong>{email}</strong>.
          </p>
          <div className="p-2.5 bg-white rounded border small text-muted mb-3">
            <div className="d-flex align-items-center gap-1 text-primary fw-bold mb-1">
              <Info size={14} />
              <span>Demonstration Environment Note</span>
            </div>
            <span>
              In production, an authenticated time-bound token is dispatched via university SMTP.
              In this frontend prototype, you can test the password reset flow directly using the link below:
            </span>
          </div>

          <div className="d-flex flex-column gap-2">
            <Link
              to="/reset-password?demo_email=verified"
              className="cx-btn cx-btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-1.5"
            >
              <span>Proceed to Password Reset Demo</span>
              <ExternalLink size={14} />
            </Link>
            <Link
              to="/login"
              className="cx-btn cx-btn-outline w-100 py-2"
            >
              Return to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="recovery-email" className="cx-form-label">
              Institutional Email Address <span className="text-danger">*</span>
            </label>
            <div className="position-relative">
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., student@civnexa.edu"
                className={`cx-input ps-5 ${emailError ? 'is-invalid border-danger' : ''}`}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'recovery-email-error' : undefined}
                disabled={isLoading}
                autoComplete="email"
              />
              <Mail
                size={16}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted pointer-events-none"
              />
            </div>
            {emailError && (
              <div id="recovery-email-error" className="cx-form-error text-danger small mt-1">
                {emailError}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="cx-btn cx-btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Generating recovery link...</span>
              </>
            ) : (
              <span>Send Recovery Link</span>
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
};

export default ForgotPasswordPage;
