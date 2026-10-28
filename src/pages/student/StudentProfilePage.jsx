import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
  FileText,
  HeartHandshake,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Award,
  ChevronRight,
  Shield,
  LifeBuoy,
  FileQuestion,
  Info,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import Tabs from '../../components/data-display/Tabs';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MOCK_STUDENTS } from '../../constants/studentDirectory';
import caseService from '../../services/caseService';
import counselingService from '../../services/counselingService';

/**
 * StudentProfilePage Component (/student/profile)
 * Comprehensive, dignified, student-facing academic dossier, conduct standing,
 * active case timelines, and welfare mentorship history.
 */
export const StudentProfilePage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'cases', 'grievances', 'support'
  const [student, setStudent] = useState(null);
  const [studentCases, setStudentCases] = useState([]);
  const [studentGrievances, setStudentGrievances] = useState([]);
  const [counselingRecords, setCounselingRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        // Resolve student record from mock student directory or current logged in persona
        const matched =
          MOCK_STUDENTS.find(
            (s) =>
              s.email.toLowerCase() === currentUser?.email?.toLowerCase() ||
              s.name.toLowerCase() === currentUser?.name?.toLowerCase() ||
              s.rollNo === currentUser?.studentRoll
          ) || {
            id: currentUser?.id || 'STU-001',
            name: currentUser?.name || 'Student Scholar',
            rollNo: currentUser?.studentRoll || '22CSE041',
            enrollmentNo: `ENR-2022-${currentUser?.department?.slice(0, 3)?.toUpperCase() || 'CSE'}-0041`,
            email: currentUser?.email || 'student@civnexa.edu',
            department: currentUser?.department || 'Computer Science & Engineering',
            departmentCode: 'CSE',
            course: 'B.Tech Program',
            semester: 'Undergraduate Program',
            section: 'Section A',
            cgpa: 8.0,
            hostel: 'Campus Residence Hall',
            phone: '+91 98765 43210',
            avatar: currentUser?.avatar || 'ST',
          };

        setStudent(matched);

        // Fetch student's cases
        const casesRes = await caseService.getCases({
          currentUser,
          role: 'STUDENT',
          pageSize: 50,
        });

        const allItems = casesRes.items || [];
        const cases = allItems.filter(
          (c) =>
            !c.caseNumber.startsWith('GRV') &&
            c.categoryKey !== 'ACADEMIC_GRIEVANCE' &&
            c.categoryKey !== 'CAMPUS_SAFETY'
        );
        const grievances = allItems.filter(
          (c) =>
            c.caseNumber.startsWith('GRV') ||
            c.categoryKey === 'ACADEMIC_GRIEVANCE' ||
            c.categoryKey === 'CAMPUS_SAFETY'
        );

        setStudentCases(cases);
        setStudentGrievances(grievances);

        // Fetch student counseling referrals
        const referrals = await counselingService.getReferrals({ currentUser });
        const filteredRefs = referrals.filter(
          (r) =>
            r.studentRoll === matched.rollNo ||
            r.studentName?.toLowerCase() === matched.name?.toLowerCase()
        );
        setCounselingRecords(filteredRefs);
      } catch (err) {
        console.error('Failed to load student profile dossier', err);
        toast.error('Unable to retrieve profile details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [currentUser]);

  // Determine current institutional conduct standing
  const activeSeriousCases = studentCases.filter(
    (c) => (c.status === 'IN_PROGRESS' || c.status === 'UNDER_REVIEW') && c.priority === 'CRITICAL'
  );
  const activeCases = studentCases.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED'
  );

  let conductStanding = {
    label: 'Good Institutional Standing',
    variant: 'success',
    color: '#059669',
    description: 'All academic and conduct standards in full compliance.',
    badge: 'Good Standing',
  };

  if (activeSeriousCases.length > 0) {
    conductStanding = {
      label: 'Formal Review Active',
      variant: 'warning',
      color: '#D97706',
      description: 'An inquiry or proctorial review is currently active. Support advisors are available.',
      badge: 'Review in Progress',
    };
  } else if (activeCases.length > 0) {
    conductStanding = {
      label: 'Procedural Notice Pending',
      variant: 'primary',
      color: '#2563EB',
      description: 'A student response or procedural clarification is awaiting submission.',
      badge: 'Active Inquiry',
    };
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="My Student Dossier & Conduct Profile"
        subtitle="Transparent academic standing, active case records, submitted grievances, and wellbeing resources."
        breadcrumbs={[{ label: 'Student Portal' }, { label: 'My Profile' }]}
        badge={
          <span className="badge bg-light text-dark border px-2.5 py-1" style={{ fontSize: '0.75rem' }}>
            Roll No: {student?.rollNo || '22CSE041'}
          </span>
        }
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link to="/student/support" className="cx-btn cx-btn-outline text-decoration-none">
              <LifeBuoy size={15} />
              <span>Campus Helpdesk</span>
            </Link>
            <Link to="/grievances/raise" className="cx-btn cx-btn-teal text-decoration-none">
              <FileQuestion size={15} />
              <span>File Grievance</span>
            </Link>
          </div>
        }
      />

      {/* Dignified Conduct Standing Banner */}
      <div
        className="cx-card mb-4 border-0 shadow-sm"
        style={{
          borderLeft: `4px solid ${conductStanding.color}`,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
        }}
      >
        <div className="cx-card-body p-3.5 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{
                width: '44px',
                height: '44px',
                backgroundColor: conductStanding.color,
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-0.5">
                <span className="fw-bold text-dark h6 mb-0">Current Standing: {conductStanding.label}</span>
                <span className={`badge bg-${conductStanding.variant}-subtle text-${conductStanding.variant} border border-${conductStanding.variant}-subtle`}>
                  {conductStanding.badge}
                </span>
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                {conductStanding.description}
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 border-start ps-md-3">
            <div className="text-center px-2">
              <div className="fw-bold cx-font-mono h5 mb-0 text-dark">{studentCases.length}</div>
              <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Total Cases</div>
            </div>
            <div className="text-center px-2">
              <div className="fw-bold cx-font-mono h5 mb-0 text-dark">{studentGrievances.length}</div>
              <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Grievances</div>
            </div>
            <div className="text-center px-2">
              <div className="fw-bold cx-font-mono h5 mb-0 text-dark">{counselingRecords.length}</div>
              <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Counseling</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabbed Profile Dossier */}
      <div className="cx-card mb-4 border-0 shadow-sm">
        <div className="cx-card-header p-3 border-bottom">
          <Tabs
            tabs={[
              { id: 'overview', label: 'Student Information & Mentorship' },
              { id: 'cases', label: 'My Case History', count: studentCases.length },
              { id: 'grievances', label: 'My Grievances', count: studentGrievances.length },
              { id: 'support', label: 'Wellbeing & Mentorship Sessions', count: counselingRecords.length },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div className="cx-card-body p-4">
          {/* TAB 1: OVERVIEW & MENTORSHIP */}
          {activeTab === 'overview' && student && (
            <div>
              <div className="row g-4">
                {/* Personal & Academic Details */}
                <div className="col-12 col-lg-7">
                  <h3 className="h6 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <GraduationCap size={16} className="text-teal" />
                    <span>Academic & Enrollment Dossier</span>
                  </h3>

                  <div className="bg-light p-3 rounded border">
                    <div className="row g-3">
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small text-uppercase" style={{ fontSize: '0.68rem' }}>Full Legal Name</span>
                        <div className="fw-semibold text-dark">{student.name}</div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small text-uppercase" style={{ fontSize: '0.68rem' }}>Roll Number</span>
                        <div className="fw-bold cx-font-mono text-teal">{student.rollNo}</div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small text-uppercase" style={{ fontSize: '0.68rem' }}>Enrollment Number</span>
                        <div className="cx-font-mono text-dark">{student.enrollmentNo}</div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small text-uppercase" style={{ fontSize: '0.68rem' }}>Academic Department</span>
                        <div className="fw-semibold text-dark">{student.department}</div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small text-uppercase" style={{ fontSize: '0.68rem' }}>Degree Program & Year</span>
                        <div className="text-dark">{student.course} — {student.semester}</div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small text-uppercase" style={{ fontSize: '0.68rem' }}>Section & Cohort</span>
                        <div className="text-dark">{student.section}</div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small text-uppercase" style={{ fontSize: '0.68rem' }}>Cumulative CGPA</span>
                        <div className="fw-bold text-dark d-inline-flex align-items-center gap-1.5">
                          <span>{student.cgpa} / 10.0</span>
                          <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.65rem' }}>
                            Good Standing
                          </span>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small text-uppercase" style={{ fontSize: '0.68rem' }}>Hostel / Residence</span>
                        <div className="text-dark d-flex align-items-center gap-1">
                          <MapPin size={13} className="text-secondary" />
                          <span>{student.hostel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="h6 fw-bold text-dark mt-4 mb-3 d-flex align-items-center gap-2">
                    <User size={16} className="text-primary" />
                    <span>Contact Information</span>
                  </h3>
                  <div className="bg-light p-3 rounded border">
                    <div className="row g-3">
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small text-uppercase" style={{ fontSize: '0.68rem' }}>Institutional Email</span>
                        <div className="text-dark d-flex align-items-center gap-1.5">
                          <Mail size={13} className="text-secondary" />
                          <span>{student.email}</span>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small text-uppercase" style={{ fontSize: '0.68rem' }}>Registered Contact</span>
                        <div className="text-dark d-flex align-items-center gap-1.5">
                          <Phone size={13} className="text-secondary" />
                          <span>{student.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Faculty Mentor & Academic Leadership */}
                <div className="col-12 col-lg-5">
                  <h3 className="h6 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <Award size={16} className="text-teal" />
                    <span>Assigned Mentorship & Leadership</span>
                  </h3>

                  <div className="cx-card border mb-3">
                    <div className="cx-card-body p-3">
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{ width: '40px', height: '40px', backgroundColor: 'var(--cx-teal-700)', fontSize: '0.9rem' }}
                        >
                          AK
                        </div>
                        <div>
                          <div className="fw-bold text-dark">Dr. Arvind Krishna</div>
                          <span className="badge bg-teal-subtle text-teal border border-teal-subtle" style={{ fontSize: '0.65rem' }}>
                            Faculty Mentor & Advisor
                          </span>
                        </div>
                      </div>
                      <p className="text-muted small mb-2" style={{ fontSize: '0.78rem' }}>
                        Associate Professor, Department of Computer Science & Engineering. Available for academic guidance, personal mentoring, and procedural advisory.
                      </p>
                      <div className="text-muted small d-flex flex-column gap-1" style={{ fontSize: '0.75rem' }}>
                        <span className="d-flex align-items-center gap-1">
                          <Mail size={12} />
                          <span>arvind.krishna@civnexa.edu</span>
                        </span>
                        <span className="d-flex align-items-center gap-1">
                          <MapPin size={12} />
                          <span>Academic Block 3, Room 412 (Hours: Mon-Wed 3-5 PM)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="cx-card border">
                    <div className="cx-card-body p-3">
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{ width: '40px', height: '40px', backgroundColor: '#2563EB', fontSize: '0.9rem' }}
                        >
                          RS
                        </div>
                        <div>
                          <div className="fw-bold text-dark">Dr. Rajesh Sharma</div>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.65rem' }}>
                            Head of Department (HOD)
                          </span>
                        </div>
                      </div>
                      <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>
                        Department of Computer Science & Engineering. Oversees department disciplinary matters, verification, and academic proctoring.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY CASE HISTORY */}
          {activeTab === 'cases' && (
            <div>
              {studentCases.length === 0 ? (
                <div className="text-center p-5 text-muted">
                  <ShieldCheck size={36} className="text-success mb-2" />
                  <h4 className="h6 fw-bold text-dark">No Conduct Cases on Record</h4>
                  <p className="small mb-0">Your institutional conduct record is clean and in complete compliance.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {studentCases.map((c) => (
                    <div key={c.id} className="p-3 border rounded bg-white hover-shadow-sm transition-all">
                      <div className="d-flex flex-column flex-md-row align-items-start justify-content-between gap-2 mb-2">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="cx-font-mono fw-bold text-teal" style={{ fontSize: '0.85rem' }}>
                              {c.caseNumber || c.id}
                            </span>
                            <StatusBadge status={c.status} size="sm" />
                            <PriorityBadge priority={c.priority} size="sm" />
                            {c.isConfidential && (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.65rem' }}>
                                Confidential
                              </span>
                            )}
                          </div>
                          <h4 className="h6 fw-bold text-dark mb-1">{c.title}</h4>
                          <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>
                            {c.summary || c.description}
                          </p>
                        </div>

                        <div className="d-flex align-items-center gap-2 align-self-md-start">
                          {c.status === 'AWAITING_RESPONSE' && (
                            <Link
                              to="/student/responses"
                              className="cx-btn cx-btn-teal cx-btn-sm text-decoration-none"
                            >
                              <span>Submit Explanation</span>
                            </Link>
                          )}
                          <Link
                            to={`/cases/${c.id}`}
                            className="cx-btn cx-btn-outline cx-btn-sm text-decoration-none"
                          >
                            <span>View Full File</span>
                          </Link>
                        </div>
                      </div>

                      {/* Transparent Next Steps and Student Rights Notice */}
                      <div className="p-2.5 bg-light rounded mt-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div className="d-flex align-items-center gap-2 text-muted small" style={{ fontSize: '0.72rem' }}>
                          <Info size={13} className="text-primary" />
                          <span>
                            <strong>Next Step:</strong> {c.investigation?.nextAction || 'Case under proctorial evaluation.'}
                          </span>
                        </div>
                        <div className="small text-secondary" style={{ fontSize: '0.72rem' }}>
                          Reported: {new Date(c.reportedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY GRIEVANCES */}
          {activeTab === 'grievances' && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="text-muted small">
                  Showing {studentGrievances.length} grievances filed under your student identity or assigned docket.
                </span>
                <Link to="/grievances/raise" className="cx-btn cx-btn-teal cx-btn-sm text-decoration-none">
                  <FileQuestion size={14} />
                  <span>File New Grievance</span>
                </Link>
              </div>

              {studentGrievances.length === 0 ? (
                <div className="text-center p-5 text-muted">
                  <FileText size={32} className="text-secondary opacity-50 mb-2" />
                  <h4 className="h6 fw-bold text-dark">No Grievances Filed</h4>
                  <p className="small mb-3">You have not submitted any academic or campus safety complaints.</p>
                  <Link to="/grievances/raise" className="cx-btn cx-btn-outline text-decoration-none">
                    <span>File a Grievance</span>
                  </Link>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {studentGrievances.map((g) => (
                    <div key={g.id} className="p-3 border rounded bg-white">
                      <div className="d-flex flex-column flex-md-row align-items-start justify-content-between gap-2 mb-2">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="cx-font-mono fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                              {g.caseNumber || g.id}
                            </span>
                            <StatusBadge status={g.status} size="sm" />
                            {g.isAnonymous ? (
                              <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.65rem' }}>
                                Anonymous Channel
                              </span>
                            ) : (
                              <span className="badge bg-teal-subtle text-teal border border-teal-subtle" style={{ fontSize: '0.65rem' }}>
                                Formal Identified
                              </span>
                            )}
                          </div>
                          <h4 className="h6 fw-bold text-dark mb-1">{g.title}</h4>
                          <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>
                            {g.summary || g.description}
                          </p>
                        </div>

                        <Link to={`/cases/${g.id}`} className="cx-btn cx-btn-outline cx-btn-sm text-decoration-none">
                          <span>Track Progress</span>
                        </Link>
                      </div>

                      <div className="d-flex align-items-center justify-content-between text-muted small pt-2 border-top" style={{ fontSize: '0.72rem' }}>
                        <span>Category: {g.category}</span>
                        <span>Filed: {new Date(g.reportedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WELLBEING & MENTORSHIP SESSIONS */}
          {activeTab === 'support' && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="text-muted small">
                  Confidential supportive guidance, behavioral reflection, and mentorship history.
                </span>
                <Link to="/student/support" className="cx-btn cx-btn-outline cx-btn-sm text-decoration-none">
                  <LifeBuoy size={14} />
                  <span>Request Support Session</span>
                </Link>
              </div>

              {counselingRecords.length === 0 ? (
                <div className="text-center p-5 text-muted">
                  <HeartHandshake size={36} className="text-teal mb-2 opacity-50" />
                  <h4 className="h6 fw-bold text-dark">No Active Counseling Referrals</h4>
                  <p className="small mb-3">You do not currently have any mandatory or voluntary counseling dockets.</p>
                  <Link to="/student/support" className="cx-btn cx-btn-teal text-decoration-none">
                    <span>Contact Campus Wellbeing</span>
                  </Link>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {counselingRecords.map((ref) => (
                    <div key={ref.id} className="p-3 border rounded bg-white">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-teal-subtle text-teal border border-teal-subtle" style={{ fontSize: '0.7rem' }}>
                            {ref.id}
                          </span>
                          <span className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>
                            {ref.status}
                          </span>
                        </div>
                        <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                          Counselor: {ref.counselor || 'Assigned Counselor'}
                        </span>
                      </div>

                      <h4 className="h6 fw-bold text-dark mb-1">
                        Reason: {ref.reason}
                      </h4>

                      <div className="p-2.5 bg-light rounded small text-secondary mt-2" style={{ fontSize: '0.75rem' }}>
                        <strong>Clinical Privacy Notice:</strong> Detailed session therapy notes are restricted to licensed mental health practitioners and protected under university student privacy guidelines.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default StudentProfilePage;
