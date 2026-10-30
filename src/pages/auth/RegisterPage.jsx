import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus, AlertCircle, Info, ArrowLeft, Building2 } from 'lucide-react';
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
  const [departmentsList, setDepartmentsList] = useState([
    { id: 1, name: 'Computer Science & Engineering', code: 'CSE' },
    { id: 2, name: 'Mechanical Engineering', code: 'ME' },
    { id: 3, name: 'Electrical & Electronics Engineering', code: 'EEE' },
    { id: 4, name: 'Civil Engineering', code: 'CE' },
    { id: 5, name: 'Management Studies', code: 'MBA' },
  ]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [policyNotice, setPolicyNotice] = useState('');

  useEffect(() => {
    let isMounted = true;
    authService.getDepartments().then((depts) => {
      if (isMounted && Array.isArray(depts) && depts.length > 0) {
        setDepartmentsList(depts);
        if (!depts.some((d) => d.name === department)) {
          setDepartment(depts[0].name);
        }
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setPolicyNotice('');

    if (!email || !institutionalId || !password || !firstName) {
      setErrorMessage('Please fill in all required institutional profile fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.register({
        email: email.trim(),
        institutionalId: institutionalId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        department: department.trim(),
        password,
      });

      toast.success(
        `Registration recorded (${result.status || 'PENDING_VERIFICATION'}). Please verify your institutional email with the 6-digit code.`,
        'Verification Code Sent'
      );
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      if (err.message && err.message.includes('disabled by institutional policy')) {
        setPolicyNotice(err.message);
      } else {
        setErrorMessage(err.message || 'Registration failed.');
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
        <div className="row g-2 mb-3">
          <div className="col-6">
            <label htmlFor="reg-first-name" className="cx-form-label">
              First Name <span className="text-danger">*</span>
            </label>
            <input
              id="reg-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Aarav"
              className="cx-input"
              disabled={isLoading}
              required
            />
          </div>
          <div className="col-6">
            <label htmlFor="reg-last-name" className="cx-form-label">
              Last Name
            </label>
            <input
              id="reg-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Sharma"
              className="cx-input"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="reg-email" className="cx-form-label">
            Official University Email <span className="text-danger">*</span>
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@civnexa.edu"
            className="cx-input"
            disabled={isLoading}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="reg-inst-id" className="cx-form-label">
            Institutional Roll / Registration No. <span className="text-danger">*</span>
          </label>
          <input
            id="reg-inst-id"
            type="text"
            value={institutionalId}
            onChange={(e) => setInstitutionalId(e.target.value)}
            placeholder="e.g. 22CSE041"
            className="cx-input"
            disabled={isLoading}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="reg-department" className="cx-form-label">
            Academic Department <span className="text-danger">*</span>
          </label>
          <select
            id="reg-department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="cx-input"
            disabled={isLoading}
            required
          >
            {departmentsList.map((d) => (
              <option key={d.id || d.code} value={d.name}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <div className="row g-2 mb-4">
          <div className="col-6">
            <label htmlFor="reg-password" className="cx-form-label">
              Password <span className="text-danger">*</span>
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="cx-input"
              disabled={isLoading}
              required
            />
          </div>
          <div className="col-6">
            <label htmlFor="reg-confirm-password" className="cx-form-label">
              Confirm Password <span className="text-danger">*</span>
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="cx-input"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="cx-btn cx-btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
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
