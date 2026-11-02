import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus, AlertCircle, Info, ArrowLeft, Building2, Eye, EyeOff, Check } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { pageTransitionVariants } from '../../animations/motionVariants';

export const RegisterPage = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [institutionalId, setInstitutionalId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [departmentId, setDepartmentId] = useState(1);
  const [departmentsList, setDepartmentsList] = useState([
    { id: 1, name: 'Computer Science & Engineering', code: 'CSE' },
    { id: 2, name: 'Mechanical Engineering', code: 'ME' },
    { id: 3, name: 'Electrical & Electronics Engineering', code: 'EEE' },
    { id: 4, name: 'Civil Engineering', code: 'CE' },
    { id: 5, name: 'Management Studies', code: 'MBA' },
  ]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [policyNotice, setPolicyNotice] = useState('');

  // Password requirements calculation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~`]/.test(password);
  const isComplex = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;

  useEffect(() => {
    let isMounted = true;
    authService.getDepartments().then((depts) => {
      if (isMounted && Array.isArray(depts) && depts.length > 0) {
        setDepartmentsList(depts);
        const match = depts.find((d) => d.name === department) || depts[0];
        setDepartment(match.name);
        setDepartmentId(match.id);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleDepartmentChange = (e) => {
    const selectedName = e.target.value;
    setDepartment(selectedName);
    const selectedObj = departmentsList.find((d) => d.name === selectedName);
    if (selectedObj) {
      setDepartmentId(selectedObj.id);
    }
    setFieldErrors((prev) => ({ ...prev, department: null, departmentId: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});
    setPolicyNotice('');

    const clientErrors = {};

    if (!firstName.trim()) {
      clientErrors.firstName = 'First name is required.';
    }
    if (!email.trim()) {
      clientErrors.email = 'Official university email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      clientErrors.email = 'Please provide a valid institutional email address.';
    }
    if (!institutionalId.trim()) {
      clientErrors.institutionalId = 'Institutional roll number is required.';
    }
    if (!password) {
      clientErrors.password = 'Password is required.';
    } else if (!hasMinLength) {
      clientErrors.password = 'Password must be at least 8 characters long.';
    } else if (!isComplex) {
      clientErrors.password = 'Password must include uppercase, lowercase, digit, and special symbol.';
    }
    if (!confirmPassword) {
      clientErrors.confirmPassword = 'Password confirmation is required.';
    } else if (password !== confirmPassword) {
      clientErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setErrorMessage('Please correct the highlighted fields before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.register({
        name: [firstName.trim(), lastName.trim()].filter(Boolean).join(' '),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        rollNumber: institutionalId.trim(),
        institutionalId: institutionalId.trim(),
        departmentId: departmentId || null,
        department: department.trim(),
        password,
        role: 'STUDENT',
      });

      toast.success(
        `Registration recorded (${result.status || 'PENDING_VERIFICATION'}). Please verify your institutional email with the 6-digit code.`,
        'Verification Code Sent'
      );
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      if (err.isPolicyBlocked || (err.message && err.message.includes('disabled by institutional policy'))) {
        setPolicyNotice(err.message);
      } else {
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
          const firstFieldKey = Object.keys(err.fieldErrors)[0];
          setErrorMessage(err.fieldErrors[firstFieldKey] || err.message || 'Validation failed for one or more fields.');
        } else {
          setErrorMessage(err.message || 'Registration failed.');
        }
      }
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
          Institutional Student Onboarding
        </h1>
        <p className="text-muted small mb-0">
          CIVNEXA Conduct, Grievance & Student Support Platform
        </p>
      </div>

      {/* Institutional Provisioning Policy Notice */}
      <div className="alert alert-info p-3 small d-flex align-items-start gap-2 mb-3 rounded-3" role="region" aria-label="Provisioning Policy">
        <Info size={17} className="mt-0.5 flex-shrink-0 text-primary" />
        <div>
          <strong>Institutional Policy Notice:</strong> Regular student and staff accounts are provisioned directly by university registrars and department administrators. Self-registration requires administrator review.
        </div>
      </div>

      {policyNotice && (
        <div className="alert alert-warning p-3 small d-flex align-items-start gap-2 mb-3 rounded-3" role="alert">
          <Building2 size={17} className="mt-0.5 flex-shrink-0 text-warning" />
          <div>{policyNotice}</div>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger p-2.5 small d-flex align-items-start gap-2 mb-3 rounded-3" role="alert">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Name Fields */}
        <div className="row g-2 mb-3">
          <div className="col-6">
            <label htmlFor="reg-first-name" className="cx-form-label">
              First Name <span className="text-danger">*</span>
            </label>
            <input
              id="reg-first-name"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, firstName: null, name: null }));
              }}
              placeholder="e.g. Aarav"
              className={`cx-input ${(fieldErrors.firstName || fieldErrors.name) ? 'is-invalid border-danger' : ''}`}
              disabled={isLoading}
              required
            />
            {(fieldErrors.firstName || fieldErrors.name) && (
              <div className="text-danger small mt-1">{fieldErrors.firstName || fieldErrors.name}</div>
            )}
          </div>
          <div className="col-6">
            <label htmlFor="reg-last-name" className="cx-form-label">
              Last Name
            </label>
            <input
              id="reg-last-name"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, lastName: null, name: null }));
              }}
              placeholder="e.g. Sharma"
              className={`cx-input ${fieldErrors.lastName ? 'is-invalid border-danger' : ''}`}
              disabled={isLoading}
            />
            {fieldErrors.lastName && (
              <div className="text-danger small mt-1">{fieldErrors.lastName}</div>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="mb-3">
          <label htmlFor="reg-email" className="cx-form-label">
            Official University Email <span className="text-danger">*</span>
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, email: null }));
            }}
            placeholder="student@civnexa.edu"
            className={`cx-input ${fieldErrors.email ? 'is-invalid border-danger' : ''}`}
            disabled={isLoading}
            required
          />
          {fieldErrors.email && (
            <div className="text-danger small mt-1">{fieldErrors.email}</div>
          )}
        </div>

        {/* Institutional ID / Roll Number */}
        <div className="mb-3">
          <label htmlFor="reg-inst-id" className="cx-form-label">
            Institutional Roll / Registration No. <span className="text-danger">*</span>
          </label>
          <input
            id="reg-inst-id"
            type="text"
            value={institutionalId}
            onChange={(e) => {
              setInstitutionalId(e.target.value);
              setFieldErrors((prev) => ({ ...prev, institutionalId: null, rollNumber: null }));
            }}
            placeholder="e.g. 22CSE041"
            className={`cx-input ${(fieldErrors.institutionalId || fieldErrors.rollNumber) ? 'is-invalid border-danger' : ''}`}
            disabled={isLoading}
            required
          />
          {(fieldErrors.institutionalId || fieldErrors.rollNumber) && (
            <div className="text-danger small mt-1">{fieldErrors.institutionalId || fieldErrors.rollNumber}</div>
          )}
        </div>

        {/* Department Field */}
        <div className="mb-3">
          <label htmlFor="reg-department" className="cx-form-label">
            Academic Department <span className="text-danger">*</span>
          </label>
          <select
            id="reg-department"
            value={department}
            onChange={handleDepartmentChange}
            className={`cx-input ${(fieldErrors.department || fieldErrors.departmentId) ? 'is-invalid border-danger' : ''}`}
            disabled={isLoading}
            required
          >
            {departmentsList.map((d) => (
              <option key={d.id || d.code} value={d.name}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
          {(fieldErrors.department || fieldErrors.departmentId) && (
            <div className="text-danger small mt-1">{fieldErrors.department || fieldErrors.departmentId}</div>
          )}
        </div>

        {/* Password Fields */}
        <div className="row g-2 mb-2">
          <div className="col-12 col-sm-6 mb-2">
            <label htmlFor="reg-password" className="cx-form-label">
              Password <span className="text-danger">*</span>
            </label>
            <div className="position-relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: null }));
                }}
                placeholder="Min. 8 characters"
                className={`cx-input pe-5 ${fieldErrors.password ? 'is-invalid border-danger' : ''}`}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted p-2"
                aria-label={showPassword ? 'Hide password' : 'Toggle password visibility'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <div className="text-danger small mt-1">{fieldErrors.password}</div>
            )}
          </div>

          <div className="col-12 col-sm-6 mb-2">
            <label htmlFor="reg-confirm-password" className="cx-form-label">
              Confirm Password <span className="text-danger">*</span>
            </label>
            <div className="position-relative">
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                }}
                placeholder="Confirm password"
                className={`cx-input pe-5 ${fieldErrors.confirmPassword ? 'is-invalid border-danger' : ''}`}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted p-2"
                aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Toggle confirm password visibility'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <div className="text-danger small mt-1">{fieldErrors.confirmPassword}</div>
            )}
          </div>
        </div>

        {/* Dynamic Password Requirements Checklist */}
        {password && (
          <div className="p-2.5 mb-3 bg-light rounded-2 border">
            <div className="small fw-bold text-dark mb-1" style={{ fontSize: '0.75rem' }}>
              Password Requirements:
            </div>
            <div className="row g-1 text-muted" style={{ fontSize: '0.72rem' }}>
              <div className={`col-6 d-flex align-items-center gap-1 ${hasMinLength ? 'text-success fw-semibold' : ''}`}>
                {hasMinLength ? <Check size={12} className="text-success" /> : <span style={{ width: 12 }}>•</span>}
                <span>Min 8 characters</span>
              </div>
              <div className={`col-6 d-flex align-items-center gap-1 ${hasUppercase ? 'text-success fw-semibold' : ''}`}>
                {hasUppercase ? <Check size={12} className="text-success" /> : <span style={{ width: 12 }}>•</span>}
                <span>Uppercase letter</span>
              </div>
              <div className={`col-6 d-flex align-items-center gap-1 ${hasLowercase ? 'text-success fw-semibold' : ''}`}>
                {hasLowercase ? <Check size={12} className="text-success" /> : <span style={{ width: 12 }}>•</span>}
                <span>Lowercase letter</span>
              </div>
              <div className={`col-6 d-flex align-items-center gap-1 ${hasDigit ? 'text-success fw-semibold' : ''}`}>
                {hasDigit ? <Check size={12} className="text-success" /> : <span style={{ width: 12 }}>•</span>}
                <span>Numeric digit</span>
              </div>
              <div className={`col-12 d-flex align-items-center gap-1 ${hasSpecial ? 'text-success fw-semibold' : ''}`}>
                {hasSpecial ? <Check size={12} className="text-success" /> : <span style={{ width: 12 }}>•</span>}
                <span>Special symbol (!@#$%^&*...)</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="cx-btn cx-btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              <span>Submitting Onboarding Request...</span>
            </>
          ) : (
            <>
              <UserPlus size={18} />
              <span>Submit Registration</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-4 pt-3 border-top text-center text-muted" style={{ fontSize: '0.8rem' }}>
        <Link to="/login" className="text-decoration-none fw-semibold text-primary hover-underline d-inline-flex align-items-center gap-1">
          <ArrowLeft size={13} /> Return to Sign In
        </Link>
      </div>
    </motion.div>
  );
};

export default RegisterPage;
