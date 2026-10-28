import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  LogIn,
  LayoutDashboard,
  Menu,
  X,
  FileText,
  ShieldCheck,
  HeartHandshake,
  Scale,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import CivnexaWordmark from '../components/common/CivnexaWordmark';
import Hero3DComposition from '../components/common/Hero3DComposition';
import { useAuth } from '../context/AuthContext';
import {
  staggerContainerVariants,
  staggerItemVariants,
} from '../animations/motionVariants';

/**
 * Public Landing Page Component for CIVNEXA
 * 
 * Hero Redesign, Rich Colour System & Premium 3D Motion.
 * Features a deep midnight navy hero with multi-hue ambient radiance,
 * an expansive abstract 3D sculptural motion composition, fluid typography,
 * and high-contrast section transitions.
 */
export const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="cx-landing-page min-vh-100 d-flex flex-column bg-white" style={{ color: 'var(--cx-navy-950)' }}>
      {/* 1. Frosted Dark Glass Header Navigation */}
      <header
        className="cx-nav-dark-glass sticky-top"
        style={{ zIndex: 1020 }}
      >
        <div
          className="container-fluid px-4 px-lg-5 d-flex align-items-center justify-content-between py-3"
          style={{ maxWidth: '1240px' }}
        >
          {/* Brand */}
          <Link to="/" className="text-decoration-none d-flex align-items-center">
            <CivnexaWordmark variant="dark" showTagline={false} />
          </Link>

          {/* Desktop Navigation with Kinetic Hover Indicators */}
          <nav className="d-none d-md-flex align-items-center gap-4">
            <button
              type="button"
              onClick={() => scrollToSection('capabilities')}
              className="btn btn-link text-decoration-none text-light opacity-75 hover-opacity-100 p-0 small fw-medium cx-kinetic-indicator py-1"
              style={{ fontSize: '0.875rem' }}
            >
              Capabilities
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="btn btn-link text-decoration-none text-light opacity-75 hover-opacity-100 p-0 small fw-medium cx-kinetic-indicator py-1"
              style={{ fontSize: '0.875rem' }}
            >
              How It Works
            </button>
            <Link
              to="/policies"
              className="text-decoration-none text-light opacity-75 hover-opacity-100 small fw-medium cx-kinetic-indicator py-1"
              style={{ fontSize: '0.875rem' }}
            >
              Policies
            </Link>
          </nav>

          {/* Action / Auth */}
          <div className="d-none d-md-flex align-items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="cx-btn cx-btn-teal cx-btn-sm text-decoration-none d-inline-flex align-items-center gap-2 shadow-sm"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.875rem' }}
              >
                <LayoutDashboard size={15} />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="cx-btn cx-btn-teal cx-btn-sm text-decoration-none d-inline-flex align-items-center gap-2 shadow-sm"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.875rem' }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="btn btn-link p-1 text-white d-md-none border-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <motion.div
            className="d-md-none border-top px-4 py-3 shadow-lg"
            style={{ backgroundColor: '#0B132B', borderColor: 'rgba(255,255,255,0.1)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="d-flex flex-column gap-2.5">
              <button
                type="button"
                onClick={() => scrollToSection('capabilities')}
                className="btn btn-link text-start text-decoration-none text-light p-2 small fw-medium"
              >
                Capabilities
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="btn btn-link text-start text-decoration-none text-light p-2 small fw-medium"
              >
                How It Works
              </button>
              <Link
                to="/policies"
                onClick={() => setMobileMenuOpen(false)}
                className="text-decoration-none text-light p-2 small fw-medium"
              >
                Policies
              </Link>
              <div className="pt-2 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="cx-btn cx-btn-teal w-100 text-decoration-none text-center d-flex align-items-center justify-content-center gap-2"
                  >
                    <LayoutDashboard size={15} />
                    <span>Go to Dashboard</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="cx-btn cx-btn-teal w-100 text-decoration-none text-center d-flex align-items-center justify-content-center gap-2"
                  >
                    <LogIn size={15} />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* 2. Rich Midnight Hero with Ambient Radiance & Abstract 3D Motion */}
      <section className="cx-hero-rich-dark py-5 py-lg-6 position-relative border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        <div
          className="container-fluid px-4 px-lg-5 position-relative"
          style={{ maxWidth: '1240px', zIndex: 2 }}
        >
          <div className="row align-items-center g-5">
            {/* Left Column: Editorial Brand & Action Content */}
            <motion.div
              className="col-12 col-lg-7"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Tagline Pill */}
              <div className="cx-pill-teal-glow mb-4">
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#2DD4BF',
                    boxShadow: '0 0 8px #2DD4BF',
                  }}
                />
                <span>Report. Verify. Support. Resolve.</span>
              </div>

              {/* Main Headline */}
              <h1
                className="cx-fluid-headline mb-3"
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 45%, #E2E8F0 80%, #94A3B8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.035em',
                }}
              >
                A Better Way to Support Campus Communities
              </h1>

              {/* Supporting Copy */}
              <p
                className="cx-fluid-subhead mb-4"
                style={{
                  maxWidth: '580px',
                  color: '#CBD5E1',
                  lineHeight: '1.6',
                }}
              >
                Manage campus cases, grievances, appeals, and student support through one organized platform.
              </p>

              {/* Actions */}
              <div className="d-flex flex-wrap align-items-center gap-3 pt-2 mb-4">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="cx-btn cx-btn-teal text-decoration-none d-inline-flex align-items-center gap-2 shadow"
                    style={{ padding: '0.75rem 1.7rem', fontSize: '0.95rem' }}
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="cx-btn cx-btn-teal text-decoration-none d-inline-flex align-items-center gap-2 shadow"
                    style={{ padding: '0.75rem 1.7rem', fontSize: '0.95rem' }}
                  >
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => scrollToSection('capabilities')}
                  className="cx-btn"
                  style={{
                    padding: '0.75rem 1.6rem',
                    fontSize: '0.95rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Explore Features
                </button>
              </div>

              {/* Verified Product Anchors */}
              <div className="d-flex flex-wrap align-items-center gap-4 pt-3 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.12)', fontSize: '0.8rem' }}>
                <div className="d-flex align-items-center gap-2" style={{ color: '#94A3B8' }}>
                  <CheckCircle2 size={15} style={{ color: '#2DD4BF' }} />
                  <span>Case Tracking</span>
                </div>
                <div className="d-flex align-items-center gap-2" style={{ color: '#94A3B8' }}>
                  <ShieldCheck size={15} style={{ color: '#38BDF8' }} />
                  <span>Fair Inquiry</span>
                </div>
                <div className="d-flex align-items-center gap-2" style={{ color: '#94A3B8' }}>
                  <HeartHandshake size={15} style={{ color: '#A78BFA' }} />
                  <span>Student Support</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Abstract 3D Sculptural Motion Composition */}
            <div className="col-12 col-lg-5 position-relative d-flex align-items-center justify-content-center">
              <Hero3DComposition />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section B: Core Capabilities — Editorial Contrasting Layout */}
      <section id="capabilities" className="py-5 py-lg-6 bg-white border-bottom">
        <div
          className="container-fluid px-4 px-lg-5"
          style={{ maxWidth: '1240px' }}
        >
          {/* Editorial Section Header */}
          <div className="d-flex flex-column flex-md-row md-align-items-end justify-content-between mb-5 gap-3">
            <div style={{ maxWidth: '640px' }}>
              <span
                className="text-uppercase fw-bold text-teal"
                style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: 'var(--cx-teal-700)' }}
              >
                Core Capabilities
              </span>
              <h2
                className="h2 fw-bold mt-1 mb-2 text-dark"
                style={{ letterSpacing: '-0.025em' }}
              >
                Built for campus integrity and student care
              </h2>
              <p className="text-secondary small mb-0" style={{ fontSize: '0.925rem' }}>
                Structured procedural governance replacing ad-hoc emails, fragmented paperwork, and lost records.
              </p>
            </div>
          </div>

          {/* Interactive Editorial Capability Grid with Contrasting Accent Tops */}
          <motion.div
            className="row g-4"
            variants={prefersReducedMotion ? {} : staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* 1. Case Management */}
            <div className="col-12 col-md-6 col-lg-3">
              <motion.div
                variants={prefersReducedMotion ? {} : staggerItemVariants}
                className="p-4 h-100 rounded-3 border bg-white cx-hover-lift d-flex flex-column justify-content-between position-relative overflow-hidden"
                style={{ borderColor: 'var(--cx-slate-200)', borderTop: '3px solid var(--cx-navy-900)' }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      className="p-2.5 rounded-2 d-inline-flex align-items-center justify-content-center bg-light border"
                      style={{ color: 'var(--cx-navy-900)' }}
                    >
                      <FileText size={20} />
                    </div>
                    <span className="font-monospace text-muted fw-bold" style={{ fontSize: '0.75rem' }}>01</span>
                  </div>
                  <h3 className="h6 fw-bold text-dark mb-2">Case Management</h3>
                  <p className="text-secondary small mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.55' }}>
                    Structured intake, proctorial inquiry queues, and transparent evidence documentation.
                  </p>
                </div>
                <div className="pt-4 mt-auto">
                  <div
                    style={{
                      height: '2px',
                      width: '28px',
                      backgroundColor: 'var(--cx-navy-900)',
                      borderRadius: '1px',
                    }}
                  />
                </div>
              </motion.div>
            </div>

            {/* 2. Student Grievances */}
            <div className="col-12 col-md-6 col-lg-3">
              <motion.div
                variants={prefersReducedMotion ? {} : staggerItemVariants}
                className="p-4 h-100 rounded-3 border bg-white cx-hover-lift d-flex flex-column justify-content-between position-relative overflow-hidden"
                style={{ borderColor: 'var(--cx-slate-200)', borderTop: '3px solid var(--cx-teal-600)' }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      className="p-2.5 rounded-2 d-inline-flex align-items-center justify-content-center bg-light border"
                      style={{ color: 'var(--cx-teal-700)' }}
                    >
                      <ShieldCheck size={20} />
                    </div>
                    <span className="font-monospace text-muted fw-bold" style={{ fontSize: '0.75rem' }}>02</span>
                  </div>
                  <h3 className="h6 fw-bold text-dark mb-2">Student Grievances</h3>
                  <p className="text-secondary small mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.55' }}>
                    Confidential submission channels, fair verification workflows, and timeline tracking.
                  </p>
                </div>
                <div className="pt-4 mt-auto">
                  <div
                    style={{
                      height: '2px',
                      width: '28px',
                      backgroundColor: 'var(--cx-teal-600)',
                      borderRadius: '1px',
                    }}
                  />
                </div>
              </motion.div>
            </div>

            {/* 3. Review and Appeals */}
            <div className="col-12 col-md-6 col-lg-3">
              <motion.div
                variants={prefersReducedMotion ? {} : staggerItemVariants}
                className="p-4 h-100 rounded-3 border bg-white cx-hover-lift d-flex flex-column justify-content-between position-relative overflow-hidden"
                style={{ borderColor: 'var(--cx-slate-200)', borderTop: '3px solid #6366F1' }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      className="p-2.5 rounded-2 d-inline-flex align-items-center justify-content-center bg-light border"
                      style={{ color: '#4F46E5' }}
                    >
                      <Scale size={20} />
                    </div>
                    <span className="font-monospace text-muted fw-bold" style={{ fontSize: '0.75rem' }}>03</span>
                  </div>
                  <h3 className="h6 fw-bold text-dark mb-2">Review and Appeals</h3>
                  <p className="text-secondary small mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.55' }}>
                    Procedural review dockets, sanction reconsideration, and authorized appellate decisions.
                  </p>
                </div>
                <div className="pt-4 mt-auto">
                  <div
                    style={{
                      height: '2px',
                      width: '28px',
                      backgroundColor: '#6366F1',
                      borderRadius: '1px',
                    }}
                  />
                </div>
              </motion.div>
            </div>

            {/* 4. Counseling and Support */}
            <div className="col-12 col-md-6 col-lg-3">
              <motion.div
                variants={prefersReducedMotion ? {} : staggerItemVariants}
                className="p-4 h-100 rounded-3 border bg-white cx-hover-lift d-flex flex-column justify-content-between position-relative overflow-hidden"
                style={{ borderColor: 'var(--cx-slate-200)', borderTop: '3px solid #06B6D4' }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      className="p-2.5 rounded-2 d-inline-flex align-items-center justify-content-center bg-light border"
                      style={{ color: '#0891B2' }}
                    >
                      <HeartHandshake size={20} />
                    </div>
                    <span className="font-monospace text-muted fw-bold" style={{ fontSize: '0.75rem' }}>04</span>
                  </div>
                  <h3 className="h6 fw-bold text-dark mb-2">Counseling and Support</h3>
                  <p className="text-secondary small mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.55' }}>
                    Student wellbeing check-ins, voluntary mentoring, and confidential welfare follow-ups.
                  </p>
                </div>
                <div className="pt-4 mt-auto">
                  <div
                    style={{
                      height: '2px',
                      width: '28px',
                      backgroundColor: '#06B6D4',
                      borderRadius: '1px',
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. Section C: How It Works — Sequential Connected Workflow */}
      <section id="how-it-works" className="py-5 py-lg-6" style={{ backgroundColor: 'var(--cx-slate-50)' }}>
        <div
          className="container-fluid px-4 px-lg-5"
          style={{ maxWidth: '1060px' }}
        >
          <div className="text-center mb-5">
            <span
              className="text-uppercase fw-bold text-teal"
              style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: 'var(--cx-teal-700)' }}
            >
              Workflow
            </span>
            <h2
              className="h2 fw-bold mt-1 text-dark"
              style={{ letterSpacing: '-0.025em' }}
            >
              How It Works
            </h2>
            <p className="text-secondary small mx-auto mb-0" style={{ maxWidth: '520px', fontSize: '0.925rem' }}>
              A clear, accountable sequence from initial reporting to institutional resolution.
            </p>
          </div>

          <div className="row g-4 position-relative">
            {/* Step 1 */}
            <div className="col-12 col-md-4">
              <motion.div
                className="p-4 bg-white rounded-3 border h-100 shadow-xs cx-hover-lift"
                style={{ borderColor: 'var(--cx-slate-200)' }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span
                    className="fw-bold font-monospace text-teal"
                    style={{ fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--cx-teal-700)' }}
                  >
                    01
                  </span>
                  <span className="badge rounded-pill bg-light text-muted border font-monospace" style={{ fontSize: '0.65rem' }}>
                    PHASE I
                  </span>
                </div>
                <h3 className="h6 fw-bold text-dark mb-2">Report & Intake</h3>
                <p className="text-secondary small mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.55' }}>
                  Register disciplinary incidents or submit grievances through confidential, guided forms.
                </p>
              </motion.div>
            </div>

            {/* Step 2 */}
            <div className="col-12 col-md-4">
              <motion.div
                className="p-4 bg-white rounded-3 border h-100 shadow-xs cx-hover-lift"
                style={{ borderColor: 'var(--cx-slate-200)' }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span
                    className="fw-bold font-monospace text-teal"
                    style={{ fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--cx-teal-700)' }}
                  >
                    02
                  </span>
                  <span className="badge rounded-pill bg-light text-muted border font-monospace" style={{ fontSize: '0.65rem' }}>
                    PHASE II
                  </span>
                </div>
                <h3 className="h6 fw-bold text-dark mb-2">Review & Deliberate</h3>
                <p className="text-secondary small mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.55' }}>
                  Committees and designated authorities evaluate documentation, verify facts, and conduct hearings.
                </p>
              </motion.div>
            </div>

            {/* Step 3 */}
            <div className="col-12 col-md-4">
              <motion.div
                className="p-4 bg-white rounded-3 border h-100 shadow-xs cx-hover-lift"
                style={{ borderColor: 'var(--cx-slate-200)' }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.25 }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span
                    className="fw-bold font-monospace text-teal"
                    style={{ fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--cx-teal-700)' }}
                  >
                    03
                  </span>
                  <span className="badge rounded-pill bg-light text-muted border font-monospace" style={{ fontSize: '0.65rem' }}>
                    PHASE III
                  </span>
                </div>
                <h3 className="h6 fw-bold text-dark mb-2">Support & Resolve</h3>
                <p className="text-secondary small mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.55' }}>
                  Deliver fair determinations, coordinate remedial support, and issue official resolution orders.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section D: Compact Institutional Dark Footer */}
      <footer className="mt-auto py-4 border-top" style={{ backgroundColor: '#070D1E', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        <div
          className="container-fluid px-4 px-lg-5 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3"
          style={{ maxWidth: '1240px' }}
        >
          <div className="d-flex align-items-center gap-3">
            <CivnexaWordmark variant="dark" showTagline={false} />
            <span className="small" style={{ color: '#94A3B8' }}>
              © {new Date().getFullYear()} CIVNEXA. Campus Governance Platform.
            </span>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-3 gap-md-4 small">
            <Link to="/policies" className="text-decoration-none" style={{ color: '#94A3B8' }}>
              Policies
            </Link>
            <Link to="/student/support" className="text-decoration-none" style={{ color: '#94A3B8' }}>
              Student Support
            </Link>
            <Link to="/login" className="text-decoration-none" style={{ color: '#94A3B8' }}>
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;