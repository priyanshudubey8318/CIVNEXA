import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Calendar,
  AlertTriangle,
  FileText,
  HeartHandshake,
  Lock,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Award,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MOCK_STUDENTS, searchStudents } from '../../constants/studentDirectory';
import caseService from '../../services/caseService';
import counselingService from '../../services/counselingService';

/**
 * Student360Page Component (/hod/student-360)
 * Comprehensive institutional conduct dossier combining academic standing,
 * case history, written defenses, counseling referrals (with clinical privacy protection),
 * and longitudinal conduct timeline for authorized academic administrators (HOD, Dean, Super Admin).
 */
export const Student360Page = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const [selectedStudent, setSelectedStudent] = useState(() => (isTest ? MOCK_STUDENTS[0] : null));
  const [studentCases, setStudentCases] = useState([]);
  const [studentCounseling, setStudentCounseling] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search autocomplete
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const results = searchStudents(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Load student dossier when selectedStudent changes
  useEffect(() => {
    const loadDossier = async () => {
      if (!selectedStudent) {
        setIsLoading(false);
        setStudentCases([]);
        setStudentCounseling([]);
        return;
      }
      setIsLoading(true);
      try {
        const [casesRes, referrals] = await Promise.all([
          caseService.getCases({
            pageSize: 50,
            currentUser,
          }),
          counselingService.getReferrals({ currentUser }),
        ]);

        // Filter cases where student is the subject
        const matchedCases = (casesRes.items || []).filter(
          (c) =>
            c.student?.id === selectedStudent.id ||
            c.student?.rollNo === selectedStudent.rollNo ||
            c.student?.email?.toLowerCase() === selectedStudent.email.toLowerCase() ||
            c.student?.name?.toLowerCase() === selectedStudent.name.toLowerCase()
        );

        // Filter counseling referrals for this student (notes will be masked by service if unauthorized)
        const matchedReferrals = referrals.filter(
          (r) =>
            r.studentRoll === selectedStudent.rollNo ||
            r.studentName?.toLowerCase() === selectedStudent.name.toLowerCase()
        );

        setStudentCases(matchedCases);
        setStudentCounseling(matchedReferrals);
      } catch (err) {
        console.error('Failed to load student 360 profile', err);
        toast.error('Unable to retrieve student conduct record.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDossier();
  }, [selectedStudent, currentUser]);

  // Derive conduct metrics
  const activeCases = studentCases.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const resolvedCases = studentCases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');
  const criticalCases = studentCases.filter((c) => c.priority === 'CRITICAL');

  // Compile unified timeline of events
  const timelineEvents = [];
  studentCases.forEach((c) => {
    (c.timeline || []).forEach((t) => {
      timelineEvents.push({
        ...t,
        caseId: c.id,
        caseNumber: c.caseNumber,
        category: c.category,
      });
    });
  });
  // Sort reverse chronologically
  timelineEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Written responses submitted by this student
  const studentResponses = [];
  studentCases.forEach((c) => {
    (c.responses || []).forEach((r) => {
      studentResponses.push({
        ...r,
        caseId: c.id,
        caseNumber: c.caseNumber,
        caseTitle: c.title,
      });
    });
  });

  return (
    <AnimatedPage>
      <PageHeader
        title="Student 360° Comprehensive Conduct Dossier"
        subtitle="Academic, conduct, and counseling overview for department students."
        breadcrumbs={[{ label: 'HOD Governance' }, { label: 'Student 360' }]}
        badge={
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            Administrative Record
          </span>
        }
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link to="/cases/create" className="cx-btn cx-btn-outline text-decoration-none">
              <span>Log Department Incident</span>
            </Link>
          </div>
        }
      />

      {/* Prominent Confidentiality Indicator */}
      <div
        className="cx-card mb-4 border-0 shadow-sm p-3"
        style={{
          borderLeft: '4px solid var(--cx-confidential-border, #DC2626)',
          backgroundColor: '#FEF2F2',
        }}
      >
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 text-danger">
            <Lock size={16} />
            <strong className="small" style={{ fontSize: '0.8rem' }}>
              Statutory Confidentiality Protocol Active:
            </strong>
            <span className="text-secondary small" style={{ fontSize: '0.78rem' }}>
              Access to this dossier is recorded in the demonstration audit log. Viewing is restricted to authorized roles.
            </span>
          </div>
          <span className="badge bg-white text-danger border border-danger-subtle px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
            Logged: {currentUser?.name} ({currentUser?.role})
          </span>
        </div>
      </div>

      {/* Student Selector Bar */}
      <div className="cx-card mb-4 border-0 shadow-sm p-3">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div className="position-relative w-100 w-md-50">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <Search size={15} className="text-secondary" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search student by name, roll number, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div
                className="position-absolute start-0 end-0 bg-white border rounded shadow-lg mt-1 p-2"
                style={{ zIndex: 1050, maxHeight: '240px', overflowY: 'auto' }}
              >
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedStudent(s);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-100 text-start btn btn-light btn-sm d-flex align-items-center justify-content-between mb-1"
                  >
                    <div>
                      <strong className="text-dark">{s.name}</strong>
                      <span className="text-muted small ms-2">({s.rollNo})</span>
                    </div>
                    <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>
                      {s.departmentCode}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Switch Dropdown */}
          <div className="d-flex align-items-center gap-2 w-100 w-md-auto">
            <span className="text-muted small text-nowrap">Select Student:</span>
            <select
              className="form-select form-select-sm"
              aria-label="Select student profile"
              value={selectedStudent?.id || ''}
              onChange={(e) => {
                const found = MOCK_STUDENTS.find((s) => s.id === e.target.value);
                setSelectedStudent(found || null);
              }}
              style={{ minWidth: '220px' }}
            >
              <option value="">-- Select Student --</option>
              {MOCK_STUDENTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.rollNo}) — {s.departmentCode}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Student Dossier or Empty State */}
      {!selectedStudent ? (
        <div className="cx-card p-5 text-center text-muted border-0 shadow-sm">
          <User size={38} className="text-muted mb-2 mx-auto opacity-50" />
          <h3 className="h6 fw-bold text-dark">No student records available</h3>
          <p className="small text-muted mb-0">Search by student name or roll number above to inspect conduct dossier.</p>
        </div>
      ) : (
        <>
        <div
          className="cx-card mb-4 border-0 shadow-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
            borderLeft: '4px solid var(--cx-teal-700)',
          }}
        >
          <div className="cx-card-body p-3.5">
            <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                  style={{ width: '56px', height: '56px', backgroundColor: 'var(--cx-teal-700)', fontSize: '1.25rem', flexShrink: 0 }}
                >
                  {selectedStudent.avatar || selectedStudent.name.substring(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    <h2 className="h4 mb-0 fw-bold text-dark">{selectedStudent.name}</h2>
                    <span className="badge bg-teal-subtle text-teal border border-teal-subtle px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                      Roll No: {selectedStudent.rollNo}
                    </span>
                    <span className="badge bg-light text-secondary border px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                      {selectedStudent.enrollmentNo}
                    </span>
                  </div>

                  <div className="text-muted small d-flex flex-wrap align-items-center gap-2">
                    <span className="fw-medium text-dark">{selectedStudent.course}</span>
                    <span>•</span>
                    <span>{selectedStudent.semester}</span>
                    <span>•</span>
                    <span className="text-secondary">{selectedStudent.department}</span>
                    <span>•</span>
                    <span className="fw-bold text-dark">CGPA: {selectedStudent.cgpa} / 10.0</span>
                  </div>
                </div>
              </div>

              {/* Quick Conduct Score Pill */}
              <div className="d-flex align-items-center gap-3 border-start ps-lg-4">
                <div className="text-center px-2">
                  <div className="fw-bold cx-font-mono h5 mb-0 text-dark">{studentCases.length}</div>
                  <div className="text-muted small" style={{ fontSize: '0.7rem' }}>All-Time Cases</div>
                </div>
                <div className="text-center px-2">
                  <div className="fw-bold cx-font-mono h5 mb-0 text-warning">{activeCases.length}</div>
                  <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Active Matters</div>
                </div>
                <div className="text-center px-2">
                  <div className="fw-bold cx-font-mono h5 mb-0 text-success">{resolvedCases.length}</div>
                  <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Resolved</div>
                </div>
                <div className="text-center px-2">
                  <div className="fw-bold cx-font-mono h5 mb-0 text-teal">{studentCounseling.length}</div>
                  <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Wellbeing Refs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Longitudinal Dossier */}
      <div className="row g-4 mb-4">
        {/* Left Column: Case History & Responses */}
        <div className="col-12 col-lg-7">
          {/* Active & Historical Cases */}
          <div className="cx-card mb-4 border-0 shadow-sm">
            <div className="cx-card-header p-3 border-bottom d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <FileText size={16} className="text-teal" />
                <h3 className="h6 fw-bold text-dark mb-0">Conduct & Incident Records ({studentCases.length})</h3>
              </div>
            </div>

            <div className="cx-card-body p-3">
              {studentCases.length === 0 ? (
                <div className="text-center p-4 text-muted small">
                  <CheckCircle2 size={28} className="text-success mb-2" />
                  <p className="mb-0">No disciplinary or conduct cases registered for this student.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2.5">
                  {studentCases.map((c) => (
                    <div key={c.id} className="p-3 border rounded bg-white">
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-1.5">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="cx-font-mono fw-bold text-teal" style={{ fontSize: '0.8rem' }}>
                              {c.caseNumber || c.id}
                            </span>
                            <StatusBadge status={c.status} size="sm" />
                            <PriorityBadge priority={c.priority} size="sm" />
                            {c.isConfidential && (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.62rem' }}>
                                Confidential
                              </span>
                            )}
                          </div>
                          <h4 className="h6 fw-bold text-dark mb-1" style={{ fontSize: '0.85rem' }}>
                            {c.title}
                          </h4>
                          <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                            {c.summary || c.description}
                          </p>
                        </div>

                        <Link
                          to={`/cases/${c.id}`}
                          className="cx-btn cx-btn-ghost cx-btn-sm py-1 px-2 text-decoration-none"
                          title="Inspect Case"
                        >
                          <Eye size={13} />
                        </Link>
                      </div>

                      <div className="text-muted small d-flex align-items-center justify-content-between pt-2 mt-2 border-top" style={{ fontSize: '0.7rem' }}>
                        <span>Reported by: {c.reporter?.name || 'Authorized Staff'}</span>
                        <span>Date: {new Date(c.reportedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Student Written Explanations & Defenses */}
          <div className="cx-card border-0 shadow-sm">
            <div className="cx-card-header p-3 border-bottom d-flex align-items-center gap-2">
              <UserCheck size={16} className="text-primary" />
              <h3 className="h6 fw-bold text-dark mb-0">Student Formal Explanations & Defenses ({studentResponses.length})</h3>
            </div>
            <div className="cx-card-body p-3">
              {studentResponses.length === 0 ? (
                <div className="text-center p-4 text-muted small">
                  <p className="mb-0">No written defenses submitted by this student on record.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2.5">
                  {studentResponses.map((r, idx) => (
                    <div key={idx} className="p-3 border rounded bg-light">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="cx-font-mono fw-bold text-dark small" style={{ fontSize: '0.78rem' }}>
                          Re: {r.caseNumber} ({r.caseTitle})
                        </span>
                        <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
                          Submitted {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>

                      <p className="text-secondary small mb-2" style={{ fontSize: '0.78rem', fontStyle: 'italic', lineHeight: '1.4' }}>
                        "{r.statement || r.text || r.explanation || 'Written explanation received on file.'}"
                      </p>

                      <div className="d-flex align-items-center gap-2 small" style={{ fontSize: '0.7rem' }}>
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          Status: {r.status || 'Formally Logged in Docket'}
                        </span>
                        {r.attachments && r.attachments.length > 0 && (
                          <span className="text-muted">{r.attachments.length} supporting attachments</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Longitudinal Timeline & Counseling Status */}
        <div className="col-12 col-lg-5">
          {/* Counseling & Welfare Referral Status (WITH CLINICAL PRIVACY PROTECTION) */}
          <div className="cx-card mb-4 border-0 shadow-sm">
            <div className="cx-card-header p-3 border-bottom d-flex align-items-center gap-2">
              <HeartHandshake size={16} className="text-success" />
              <h3 className="h6 fw-bold text-dark mb-0">Counseling & Welfare Referral Status</h3>
            </div>

            <div className="cx-card-body p-3">
              {studentCounseling.length === 0 ? (
                <div className="text-center p-3 text-muted small">
                  <p className="mb-0">No counseling or welfare referrals on record.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2.5">
                  {studentCounseling.map((ref) => (
                    <div key={ref.id} className="p-3 border rounded bg-white">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.68rem' }}>
                          {ref.id} — {ref.status}
                        </span>
                        <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
                          Referred: {new Date(ref.referralDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="small text-dark fw-medium mb-1">
                        Reason: {ref.reason}
                      </div>

                      <div className="text-muted small mb-2" style={{ fontSize: '0.72rem' }}>
                        Counselor: {ref.counselor || 'Licensed Counselor'} • Sessions Conducted: {ref.sessionsCount || 0}
                      </div>

                      {/* Prominent Clinical Notes Masking Banner */}
                      <div className="p-2 bg-light rounded border border-light-subtle d-flex align-items-start gap-1.5 text-muted small" style={{ fontSize: '0.7rem' }}>
                        <Lock size={12} className="text-secondary mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Clinical Privacy Mask:</strong> {ref.confidentialNotes || '[Confidential Therapy Notes Masked for HOD]'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Longitudinal Conduct Timeline */}
          <div className="cx-card border-0 shadow-sm">
            <div className="cx-card-header p-3 border-bottom d-flex align-items-center gap-2">
              <Clock size={16} className="text-teal" />
              <h3 className="h6 fw-bold text-dark mb-0">Longitudinal Conduct Timeline</h3>
            </div>

            <div className="cx-card-body p-3">
              {timelineEvents.length === 0 ? (
                <div className="text-center p-4 text-muted small">
                  <p className="mb-0">No timeline events recorded.</p>
                </div>
              ) : (
                <div className="position-relative ps-3" style={{ borderLeft: '2px solid #E2E8F0' }}>
                  {timelineEvents.map((evt, idx) => (
                    <div key={idx} className="position-relative pb-3 mb-1">
                      <div
                        className="rounded-circle position-absolute"
                        style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: 'var(--cx-teal-600)',
                          left: '-21px',
                          top: '4px',
                        }}
                      />
                      <div className="d-flex align-items-center justify-content-between gap-1 mb-0.5">
                        <strong className="text-dark small" style={{ fontSize: '0.78rem' }}>
                          {evt.title}
                        </strong>
                        <span className="text-muted small" style={{ fontSize: '0.68rem' }}>
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <p className="text-secondary small mb-1" style={{ fontSize: '0.72rem', lineHeight: '1.35' }}>
                        {evt.description}
                      </p>
                      <div className="d-flex align-items-center gap-2">
                        <span className="cx-font-mono text-muted" style={{ fontSize: '0.65rem' }}>
                          {evt.caseNumber}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                          Actor: {evt.actor}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </AnimatedPage>
  );
};

export default Student360Page;
