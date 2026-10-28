import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LifeBuoy,
  HeartHandshake,
  ShieldAlert,
  PhoneCall,
  Mail,
  MapPin,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  UserCheck,
  CheckCircle,
  Plus,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/feedback/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import counselingService from '../../services/counselingService';

const FAQS = [
  {
    q: 'What happens during a proctorial committee hearing?',
    a: 'A proctorial hearing is a formal, fair inquiry convened to review factual evidence and hear your perspective. You will have an opportunity to present your account, clarify misunderstandings, and submit supporting materials. The committee operates under principles of natural justice.',
  },
  {
    q: 'Will a reported incident automatically appear on my permanent academic transcript?',
    a: 'No. Procedural inquiries, grievances, and minor first-instance matters resolved through counseling or behavioral warnings are maintained strictly in confidential internal files. Only major formal sanctions resulting from severe violations are placed on permanent transcripts after full appellate exhaustion.',
  },
  {
    q: 'Can I bring a faculty mentor or student advisor to my hearing?',
    a: 'Yes. Under university procedural regulations, every student subject to a disciplinary hearing has the right to be accompanied by a designated faculty mentor or registered campus student advisor for guidance and emotional support.',
  },
  {
    q: 'How is student identity and grievance confidentiality preserved?',
    a: 'All student submissions—especially anti-ragging and safety grievances—can be lodged anonymously or via protected confidential channels. Only the Chief Proctor and designated statutory committee members have encrypted clearance to inspect evidence.',
  },
  {
    q: 'What is the difference between a Notice to Explain and an Appeal?',
    a: 'A Notice to Explain is your initial opportunity to provide facts and defense before a verdict is formulated. An Appeal is filed after a formal decision has been pronounced, if you believe procedural errors or disproportionate sanctions occurred.',
  },
];

/**
 * StudentSupportPage Component (/student/support)
 * Campus student welfare center, counseling appointment booking, anti-ragging helpline,
 * and procedural FAQ desk.
 */
export const StudentSupportPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [openFaq, setOpenFaq] = useState(0);
  const [isCounselingModalOpen, setIsCounselingModalOpen] = useState(false);
  const [supportReason, setSupportReason] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('MORNING');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestCounseling = async (e) => {
    e.preventDefault();
    if (!supportReason.trim()) {
      toast.error('Please describe what you would like support with.');
      return;
    }

    setIsSubmitting(true);
    try {
      await counselingService.createReferral({
        caseId: 'STU-VOLUNTARY',
        caseNumber: 'VOLUNTARY-WELLBEING',
        studentId: currentUser?.id || 'STU-8821',
        studentName: currentUser?.name || 'Aarav Sharma',
        studentRoll: currentUser?.studentRoll || '22CSE041',
        studentDepartment: currentUser?.department || 'Computer Science & Engineering',
        reason: supportReason.trim(),
        priority: 'MEDIUM',
        referredBy: {
          name: `${currentUser?.name || 'Student'} (Self-Initiated)`,
          role: 'STUDENT',
        },
      });

      toast.success('Your confidential counseling request has been received. A counselor will reach out shortly.');
      setIsCounselingModalOpen(false);
      setSupportReason('');
    } catch (err) {
      console.error(err);
      toast.error('Unable to lodge counseling request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Campus Support, Counseling & Helpdesk"
        subtitle="Confidential student wellbeing consultations, emergency safety lines, and procedural advisory."
        breadcrumbs={[{ label: 'Student Portal' }, { label: 'Campus Support' }]}
        badge={
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1" style={{ fontSize: '0.75rem' }}>
            Student Welfare Services
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => setIsCounselingModalOpen(true)}
            className="cx-btn cx-btn-teal"
          >
            <HeartHandshake size={16} />
            <span>Request Counseling Session</span>
          </button>
        }
      />

      {/* Emergency Immediate Action Banner */}
      <div className="cx-card mb-4 border-0 shadow-sm bg-danger text-white p-3 p-md-4">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center bg-white text-danger"
              style={{ width: '48px', height: '48px', flexShrink: 0 }}
            >
              <ShieldAlert size={26} />
            </div>
            <div>
              <h2 className="h6 fw-bold mb-0 text-white">Immediate Campus Emergency or Anti-Ragging Crisis?</h2>
              <p className="mb-0 small text-white text-opacity-90" style={{ fontSize: '0.8rem' }}>
                If you feel physically unsafe, threatened, or are witnessing hazing or ragging, contact security or the anti-ragging helpline immediately.
              </p>
              <div className="text-white text-opacity-75" style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                * National Anti-Ragging Helpline (1800-180-5522) is verified public service. Campus extensions are configurable institutional values.
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <a
              href="tel:18001805522"
              className="btn btn-light text-danger fw-bold btn-sm d-inline-flex align-items-center gap-1.5 shadow-sm"
            >
              <PhoneCall size={14} />
              <span>National Anti-Ragging: 1800-180-5522</span>
            </a>
            <a
              href="tel:+919876500000"
              className="btn btn-outline-light fw-bold btn-sm d-inline-flex align-items-center gap-1.5"
            >
              <PhoneCall size={14} />
              <span>Campus Security Control: ext. 100</span>
            </a>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Support Services Cards */}
        <div className="col-12 col-lg-8">
          <div className="cx-card mb-4 border-0 shadow-sm">
            <div className="cx-card-header p-3 border-bottom d-flex align-items-center gap-2">
              <HeartHandshake size={18} className="text-teal" />
              <h3 className="h6 fw-bold text-dark mb-0">Student Wellbeing & Counseling Services</h3>
            </div>
            <div className="cx-card-body p-3 p-md-4">
              <p className="text-secondary small mb-3" style={{ fontSize: '0.825rem', lineHeight: '1.5' }}>
                The CIVNEXA Counseling & Wellbeing Center provides free, strictly confidential behavioral support, mental health counseling, academic stress management, and mentorship for all enrolled students.
              </p>

              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded border bg-light">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <UserCheck size={16} className="text-teal" />
                      <strong className="text-dark small">Pooja Nambiar</strong>
                    </div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      Senior Counseling Psychologist & Student Mentor
                    </div>
                    <div className="mt-2 text-secondary small d-flex flex-column gap-1" style={{ fontSize: '0.72rem' }}>
                      <span>Email: pooja.nambiar@civnexa.edu</span>
                      <span>Suite B, Student Activity Center</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded border bg-light">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <Shield size={16} className="text-primary" />
                      <strong className="text-dark small">Internal Complaints Committee (ICC)</strong>
                    </div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      Women's Welfare & Prevention of Harassment Desk
                    </div>
                    <div className="mt-2 text-secondary small d-flex flex-column gap-1" style={{ fontSize: '0.72rem' }}>
                      <span>Email: icc@civnexa.edu</span>
                      <span>Dedicated Confidential Helpline: ext. 333</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded bg-teal-subtle bg-opacity-30 border border-teal-subtle d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
                <div className="small text-teal-800" style={{ fontSize: '0.8rem' }}>
                  <strong>Need to talk?</strong> All sessions are protected under clinical non-disclosure protocols.
                </div>
                <button
                  type="button"
                  onClick={() => setIsCounselingModalOpen(true)}
                  className="cx-btn cx-btn-teal cx-btn-sm"
                >
                  <Plus size={14} />
                  <span>Book Consultation</span>
                </button>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions Accordion */}
          <div className="cx-card border-0 shadow-sm">
            <div className="cx-card-header p-3 border-bottom d-flex align-items-center gap-2">
              <HelpCircle size={18} className="text-primary" />
              <h3 className="h6 fw-bold text-dark mb-0">Frequently Asked Procedural Questions</h3>
            </div>

            <div className="cx-card-body p-3 p-md-4">
              <div className="accordion d-flex flex-column gap-2" id="studentSupportFaq">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} className="border rounded overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-100 p-3 text-start bg-white border-0 d-flex align-items-center justify-content-between gap-2"
                        style={{ outline: 'none' }}
                      >
                        <span className="fw-semibold text-dark small" style={{ fontSize: '0.825rem' }}>
                          {faq.q}
                        </span>
                        {isOpen ? <ChevronUp size={16} className="text-teal flex-shrink-0" /> : <ChevronDown size={16} className="text-secondary flex-shrink-0" />}
                      </button>

                      {isOpen && (
                        <div className="p-3 bg-light border-top text-secondary small" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Directory & Quick Numbers Sidebar */}
        <div className="col-12 col-lg-4">
          <div className="cx-card mb-4 border-0 shadow-sm">
            <div className="cx-card-header p-3 border-bottom">
              <h3 className="h6 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <PhoneCall size={16} className="text-teal" />
                <span>Essential Campus Directory</span>
              </h3>
            </div>
            <div className="cx-card-body p-3">
              <div className="d-flex flex-column gap-3 small">
                <div className="border-bottom pb-2">
                  <div className="fw-bold text-dark">Dean of Student Affairs</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Administrative Block, 1st Floor</div>
                  <div className="text-teal fw-medium mt-1">ext. 102 • dean.students@civnexa.edu</div>
                </div>

                <div className="border-bottom pb-2">
                  <div className="fw-bold text-dark">Proctorial Board Secretariat</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Hearing Chambers & Security Office</div>
                  <div className="text-teal fw-medium mt-1">ext. 108 • proctor@civnexa.edu</div>
                </div>

                <div className="border-bottom pb-2">
                  <div className="fw-bold text-dark">Hostel Administration & Chief Warden</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Residential Quadrangle</div>
                  <div className="text-teal fw-medium mt-1">ext. 201 • wardens@civnexa.edu</div>
                </div>

                <div>
                  <div className="fw-bold text-dark">Campus Health Center & Ambulance</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Medical Block (24/7 Paramedics)</div>
                  <div className="text-danger fw-bold mt-1">Emergency: 108 • ext. 111</div>
                </div>
              </div>
            </div>
          </div>

          <div className="cx-card border-0 shadow-sm bg-light">
            <div className="cx-card-body p-3">
              <h3 className="h6 fw-bold text-dark mb-1">Student Bill of Rights</h3>
              <p className="text-muted small mb-2" style={{ fontSize: '0.75rem' }}>
                Under university statutory charter, all students retain the right to fair hearing notice, access to evidentiary allegations, mentorship accompaniment, and procedural appeal.
              </p>
              <Link to="/policies" className="text-teal small fw-semibold text-decoration-none">
                Read Student Conduct Code →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Counseling Request Modal */}
      <Modal
        isOpen={isCounselingModalOpen}
        onClose={() => setIsCounselingModalOpen(false)}
        title="Schedule Confidential Counseling Consultation"
        size="md"
      >
        <form onSubmit={handleRequestCounseling}>
          <div className="p-3">
            <div className="alert alert-info py-2 px-3 small mb-3" style={{ fontSize: '0.78rem' }}>
              <strong>Confidentiality Commitment:</strong> This appointment request is routed directly to the licensed Student Counseling Psychologist. No academic marks or disciplinary standing are impacted by seeking counseling.
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold text-dark">Preferred Discussion Topic / Reason</label>
              <textarea
                rows={3}
                className="form-control"
                placeholder="E.g., Academic stress, personal wellness, mediation advisory, behavioral reflection..."
                value={supportReason}
                onChange={(e) => setSupportReason(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold text-dark">Preferred Time Slot</label>
              <select
                className="form-select"
                value={preferredSlot}
                onChange={(e) => setPreferredSlot(e.target.value)}
              >
                <option value="MORNING">Morning (9:30 AM – 12:30 PM)</option>
                <option value="AFTERNOON">Afternoon (2:00 PM – 4:30 PM)</option>
                <option value="EVENING">Evening (5:00 PM – 6:30 PM)</option>
              </select>
            </div>
          </div>

          <div className="p-3 border-top d-flex justify-content-end gap-2 bg-light">
            <button
              type="button"
              onClick={() => setIsCounselingModalOpen(false)}
              className="cx-btn cx-btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cx-btn cx-btn-teal"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Lodging Request...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </AnimatedPage>
  );
};

export default StudentSupportPage;
