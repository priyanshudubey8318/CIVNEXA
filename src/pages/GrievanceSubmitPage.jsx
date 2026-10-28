import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Lock,
  EyeOff,
  CheckCircle2,
  Paperclip,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  Calendar,
  MapPin,
  User,
  Building2,
  FileText,
  Info,
} from 'lucide-react';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import { FileUploader } from '../components/forms/FileUploader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import caseService from '../services/caseService';
import { CASE_CATEGORIES } from '../constants/caseConfig';

export const GrievanceSubmitPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [categoryKey, setCategoryKey] = useState('ACADEMIC_GRIEVANCE');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [concernedPerson, setConcernedPerson] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdGrievance, setCreatedGrievance] = useState(null);
  const [errors, setErrors] = useState({});

  // Categories supported for student grievance
  const grievanceCategories = [
    { key: 'ACADEMIC_GRIEVANCE', label: 'Academic Process / Grading Grievance', allowsAnonymous: false },
    { key: 'CAMPUS_SAFETY', label: 'Campus Safety & Bullying / Harassment', allowsAnonymous: true },
    { key: 'ANTI_RAGGING', label: 'Anti-Ragging Redressal (Strict Protocol)', allowsAnonymous: true },
    { key: 'FACULTY_GRIEVANCE', label: 'Faculty / Staff Complaint', allowsAnonymous: true },
    { key: 'HOSTEL_ISSUE', label: 'Hostel & Residential Welfare', allowsAnonymous: false },
    { key: 'INFRASTRUCTURE', label: 'Campus Infrastructure & Laboratory Facilities', allowsAnonymous: false },
    { key: 'EXAM_INCIDENT', label: 'Examination Hall Incident / Appeal', allowsAnonymous: false },
    { key: 'OTHER', label: 'Other Institutional Grievance', allowsAnonymous: false },
  ];

  const activeCategory = grievanceCategories.find((c) => c.key === categoryKey) || grievanceCategories[0];

  const handleCategoryChange = (key) => {
    setCategoryKey(key);
    const cat = grievanceCategories.find((c) => c.key === key);
    // If new category doesn't allow anonymous, turn it off
    if (cat && !cat.allowsAnonymous) {
      setIsAnonymous(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!subject || subject.trim().length < 5) {
      errs.subject = 'Grievance subject must be at least 5 characters.';
    }
    if (!description || description.trim().length < 20) {
      errs.description = 'Please detail your grievance narrative (at least 20 characters).';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await caseService.createGrievance({
        category: activeCategory.label,
        categoryKey,
        subject,
        description,
        incidentDate,
        location,
        concernedPerson,
        isAnonymous,
        attachments,
        reporter: currentUser,
      });

      setCreatedGrievance(result);
      toast.success(`Grievance reference ${result.caseNumber} lodged successfully!`);
    } catch (err) {
      toast.error(err.message || 'Failed to lodge grievance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdGrievance) {
    return (
      <AnimatedPage>
        <div className="cx-card p-4 p-md-5 text-center mx-auto my-4" style={{ maxWidth: '640px' }}>
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center text-success mb-3"
            style={{ width: '64px', height: '64px', backgroundColor: 'var(--cx-teal-50)' }}
          >
            <CheckCircle2 size={36} style={{ color: 'var(--cx-teal-600)' }} />
          </div>

          <h2 className="h4 fw-bold text-dark mb-1">Grievance Lodged Successfully</h2>
          <p className="text-muted small mb-4">
            Your grievance docket has been registered under the university's confidential grievance redressal protocol.
          </p>

          <div className="p-4 rounded-3 border mb-4 text-start bg-light">
            <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
              <span className="small text-muted">Tracking Docket Ref:</span>
              <span className="cx-font-mono fw-bold fs-5" style={{ color: 'var(--cx-teal-700)' }}>
                {createdGrievance.caseNumber}
              </span>
            </div>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted">Category:</span>
              <span className="small fw-semibold text-dark">{createdGrievance.category}</span>
            </div>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted">Reporting Channel:</span>
              <span
                className={`badge ${
                  createdGrievance.isAnonymous
                    ? 'bg-purple-subtle text-purple border'
                    : 'bg-primary-subtle text-primary border'
                }`}
              >
                {createdGrievance.isAnonymous ? 'Confidential Anonymous' : 'Institutional Scholar'}
              </span>
            </div>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted">Current Gate:</span>
              <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                Pending Verification
              </span>
            </div>
            <div className="d-flex align-items-center justify-content-between">
              <span className="small text-muted">Expected Action SLA:</span>
              <span className="small text-dark fw-semibold">Within 7 Academic Days</span>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-center gap-3">
            <Link to="/grievances" className="cx-btn cx-btn-outline">
              Return to Grievance Center
            </Link>
            <Link to={`/cases/${createdGrievance.caseNumber}`} className="cx-btn cx-btn-primary">
              <span>View Grievance Status</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Lodge Institutional Grievance"
        subtitle="Confidential student redressal portal for academic grievances, campus safety concerns, and anti-ragging complaints."
        breadcrumbs={[{ label: 'Grievances', to: '/grievances' }, { label: 'Lodge Grievance' }]}
      />

      <div className="row g-4 justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="cx-card p-4 p-md-5">
            <form onSubmit={handleSubmit} noValidate>
              {/* Category Selection */}
              <div className="mb-4">
                <label htmlFor="grievance-category" className="cx-form-label">
                  Grievance Category <span className="text-danger">*</span>
                </label>
                <select
                  id="grievance-category"
                  className="cx-input"
                  value={categoryKey}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {grievanceCategories.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label} {cat.allowsAnonymous ? '(Confidential / Anonymous Option Available)' : ''}
                    </option>
                  ))}
                </select>
                <div className="small text-muted mt-1">
                  Select the most specific category to ensure prompt routing to the authorized ombudsman.
                </div>
              </div>

              {/* Subject / Title */}
              <div className="mb-3">
                <label htmlFor="grievance-subject" className="cx-form-label">
                  Grievance Subject / Headline <span className="text-danger">*</span>
                </label>
                <input
                  id="grievance-subject"
                  type="text"
                  className="cx-input"
                  placeholder="e.g. Discrepancy in Continuous Assessment scoring for Thermodynamics Lab"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                {errors.subject && <div className="text-danger small mt-1">{errors.subject}</div>}
              </div>

              {/* Incident Date & Location */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="grievance-date" className="cx-form-label">
                    Date of Occurrence (If applicable)
                  </label>
                  <input
                    id="grievance-date"
                    type="date"
                    className="cx-input"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="grievance-location" className="cx-form-label">
                    Campus Location / Department
                  </label>
                  <input
                    id="grievance-location"
                    type="text"
                    className="cx-input"
                    placeholder="e.g. Block C, Academic Section"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Concerned Department or Person */}
              <div className="mb-3">
                <label htmlFor="grievance-concerned" className="cx-form-label">
                  Person or Department Concerned (Optional)
                </label>
                <input
                  id="grievance-concerned"
                  type="text"
                  className="cx-input"
                  placeholder="e.g. Mechanical Engineering Evaluation Committee / Prof. Name"
                  value={concernedPerson}
                  onChange={(e) => setConcernedPerson(e.target.value)}
                />
              </div>

              {/* Narrative Description */}
              <div className="mb-4">
                <label htmlFor="grievance-description" className="cx-form-label">
                  Detailed Grievance Narrative <span className="text-danger">*</span>
                </label>
                <textarea
                  id="grievance-description"
                  className="cx-input"
                  rows={5}
                  placeholder="Provide an objective, detailed account of the issue, dates, communications, and the specific redressal sought..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errors.description && <div className="text-danger small mt-1">{errors.description}</div>}
              </div>

              {/* Anonymous Submission Mode Toggle */}
              {activeCategory.allowsAnonymous ? (
                <div className="p-3.5 rounded-3 border mb-4" style={{ backgroundColor: 'var(--cx-purple-50)', borderColor: 'var(--cx-confidential)' }}>
                  <div className="form-check form-switch mb-2">
                    <input
                      id="anonymous-toggle"
                      type="checkbox"
                      className="form-check-input"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <label htmlFor="anonymous-toggle" className="form-check-label fw-bold text-dark cursor-pointer">
                      Submit as Confidential Anonymous Grievance
                    </label>
                  </div>
                  <p className="text-muted small mb-0">
                    When active, your name and roll number will be displayed as "Anonymous" in the review queue.
                  </p>
                  <div className="small text-muted mt-2 border-top pt-2" style={{ fontSize: '0.75rem' }}>
                    <strong>Confidentiality Protection:</strong> Your identity will not be linked to the grievance docket during initial proctorial intake.
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-3 bg-light border mb-4 d-flex align-items-center gap-2 text-muted small">
                  <Info size={16} className="text-muted flex-shrink-0" />
                  <span>
                    Anonymous filing is reserved for Campus Safety, Anti-Ragging, and Faculty Conduct complaints. Standard academic and hostel grievances require registered identity for re-evaluation processing.
                  </span>
                </div>
              )}

              {/* Supporting Evidence Uploader */}
              <div className="mb-4">
                <label className="cx-form-label">Supporting Evidence / Documents</label>
                <FileUploader
                  onFilesSelected={(files) => setAttachments(files)}
                  maxFiles={4}
                  maxSizeMB={10}
                  acceptedTypes=".pdf,.jpg,.jpeg,.png,.docx"
                />
              </div>

              {/* Form Actions */}
              <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                <Link to="/grievances" className="cx-btn cx-btn-outline">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cx-btn cx-btn-teal d-flex align-items-center gap-1.5 px-4"
                >
                  <ShieldAlert size={16} />
                  <span>{isSubmitting ? 'Lodging Grievance...' : 'Submit Formal Grievance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Informational Sidebar */}
        <div className="col-12 col-lg-4">
          <div className="d-flex flex-column gap-3">
            <div className="cx-card p-3.5 border-start border-4 border-danger">
              <h3 className="h6 fw-bold text-dark mb-1">Anti-Ragging Protection</h3>
              <p className="small text-muted mb-2">
                Under Supreme Court and UGC directives, all forms of ragging or intimidation are criminal offenses with zero tolerance.
              </p>
              <div className="small fw-semibold text-danger">National 24/7 Helpline: 1800-180-5522</div>
            </div>

            <div className="cx-card p-3.5 border-start border-4 border-info">
              <h3 className="h6 fw-bold text-dark mb-1">Academic Re-evaluation SLA</h3>
              <p className="small text-muted mb-0">
                Grade discrepancy submissions undergo preliminary rubric inspection within 3 business days followed by committee hearing if warranted.
              </p>
            </div>

            <div className="cx-card p-3.5 border-start border-4 border-purple" style={{ borderColor: 'var(--cx-confidential)' }}>
              <h3 className="h6 fw-bold text-dark mb-1">Confidentiality Assurance</h3>
              <p className="small text-muted mb-0">
                Grievance records are sealed and access-restricted. No retaliatory adverse academic action may be initiated against an appellant in good faith.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default GrievanceSubmitPage;
