import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Shield, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService, DEMO_PASSWORD } from '../../services/authService';
import { pageTransitionVariants } from '../../animations/motionVariants';

export const LoginPage = () => {
  const { login, roles } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const demoUsers = authService.getDemoCredentials();
  const [selectedPersona, setSelectedPersona] = useState(demoUsers[1]); // Default to Dean

  const [email, setEmail] = useState(demoUsers[1].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Handle demo persona selection
  const handleSelectPersona = (persona) => {
    setSelectedPersona(persona);
    setEmail(persona.email);
    setPassword(DEMO_PASSWORD);
    setErrorMessage('');
    setEmailError('');
    setPasswordError('');
  };

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
        roleKey: selectedPersona?.role,
        rememberMe,
      });

      toast.success(
        `Welcome, ${result.user.name}. Active Role: ${result.user.roleLabel}`,
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
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
      toast.error(err.message || 'Login failed', 'Authentication Error');
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

      {/* Quick Demo Role Selector Pills */}
      <div className="p-3 mb-4 rounded-3 border bg-light">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-1.5 small fw-bold text-dark">
            <Shield size={14} style={{ color: 'var(--cx-teal-600)' }} />
            <span>Select Demo Persona:</span>
          </div>
          <span className="badge bg-white text-muted border small" style={{ fontSize: '0.65rem' }}>
            8 Roles Available
          </span>
        </div>

        <div className="d-flex flex-wrap gap-1.5">
          {demoUsers.map((persona) => {
            const isSelected = selectedPersona?.role === persona.role;
            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleSelectPersona(persona)}
                className={`btn btn-sm py-1 px-2.5 rounded-2 d-flex align-items-center gap-1 ${
                  isSelected ? 'btn-primary' : 'btn-outline-secondary bg-white'
                }`}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: isSelected ? 700 : 500,
                  transition: 'all 150ms ease',
                }}
              >
                <span>{persona.roleLabel}</span>
              </button>
            );
          })}
        </div>

        {selectedPersona && (
          <div className="mt-2 pt-2 border-top text-muted" style={{ fontSize: '0.72rem' }}>
            Selected: <strong className="text-dark">{selectedPersona.name}</strong> •{' '}
            <span>{selectedPersona.description}</span>
          </div>
        )}
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="alert alert-danger p-2.5 small d-flex align-items-start gap-2 mb-3" role="alert">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
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
            placeholder="e.g., ananya.sen@civnexa.edu"
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

        {/* Remember Me */}
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

      {/* Demo Credentials Disclaimer Box */}
      <div className="mt-4 pt-3 border-top text-center text-muted" style={{ fontSize: '0.72rem' }}>
        <div className="d-flex align-items-center justify-content-center gap-1.5 text-secondary mb-1">
          <Info size={13} />
          <span>Demo credential default: <code>Password@123</code></span>
        </div>
        <div>Selecting any persona pill above automatically pre-populates valid demonstration credentials.</div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
