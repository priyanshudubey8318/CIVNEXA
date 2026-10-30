import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { pageTransitionVariants } from '../../animations/motionVariants';

export const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMessage('');

    if (!email || !email.trim()) {
      setEmailError('Institutional email is required.');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Please enter a valid email format (e.g., name@civnexa.edu).');
        isValid = false;
      }
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      toast.success(
        `Welcome, ${result.user.name}. Authenticated Role: ${result.user.roleLabel}`,
        'Authentication Successful'
      );

      // Safe open-redirect validation: target must be internal relative path starting with single '/'
      const searchParams = new URLSearchParams(location.search);
      const queryRedirect = searchParams.get('redirect');
      const sanitizePath = (p) => {
        if (!p || typeof p !== 'string') return null;
        if (p.startsWith('/') && !p.startsWith('//') && !p.includes(':') && !p.includes('\\')) {
          return p;
        }
        return null;
      };

      const from = (location.state?.from?.pathname && location.state.from.pathname !== '/')
        ? location.state.from.pathname
        : sanitizePath(queryRedirect) || '/dashboard';

      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please verify your credentials.';
      setErrorMessage(msg);
      toast.error(msg, 'Authentication Error');
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
      <div className="text-center mb-4">
        <h1 className="h4 fw-bold text-dark mb-1" style={{ color: 'var(--cx-navy-900)' }}>
          Sign In to CIVNEXA
        </h1>
        <p className="text-muted small mb-0">
          Campus Conduct, Grievance, Safety & Counseling Management System
        </p>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="alert alert-danger p-2.5 small d-flex align-items-start gap-2 mb-3" role="alert">
          {errorMessage.includes('Too many') ? (
            <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-danger" />
          ) : (
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          )}
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Sign In Form */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className="mb-3">
          <label htmlFor="login-email" className="cx-form-label">
            Institutional Email Address <span className="text-danger">*</span>
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., student@civnexa.edu"
            className={`cx-input ${emailError ? 'is-invalid border-danger' : ''}`}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'login-email-error' : undefined}
            disabled={isLoading}
            autoComplete="email"
          />
          {emailError && (
            <div id="login-email-error" className="cx-form-error text-danger small mt-1">
              {emailError}
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <label htmlFor="login-password" className="cx-form-label mb-0">
              Password <span className="text-danger">*</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-decoration-none small text-muted hover-underline"
              style={{ fontSize: '0.75rem' }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="position-relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className={`cx-input pe-5 ${passwordError ? 'is-invalid border-danger' : ''}`}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'login-password-error' : undefined}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="position-absolute top-50 end-0 translate-middle-y me-2.5 btn btn-link p-1 text-muted"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordError && (
            <div id="login-password-error" className="cx-form-error text-danger small mt-1">
              {passwordError}
            </div>
          )}
        </div>

        {/* Remember Institutional Session */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="form-check">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="form-check-input"
              disabled={isLoading}
            />
            <label htmlFor="remember-me" className="form-check-label small text-muted">
              Remember institutional session
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="cx-btn cx-btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
          style={{ fontSize: '0.95rem' }}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <LogIn size={18} />
              <span>Sign In to Platform</span>
            </>
          )}
        </button>
      </form>

      {/* Institutional Provisioning & Onboarding Footer */}
      <div className="mt-4 pt-3 border-top text-center text-muted" style={{ fontSize: '0.8rem' }}>
        <span>Need an account? </span>
        <Link to="/register" className="text-decoration-none fw-semibold text-primary hover-underline">
          Institutional Onboarding <ArrowRight size={13} className="d-inline" />
        </Link>
      </div>
    </motion.div>
  );
};

export default LoginPage;
