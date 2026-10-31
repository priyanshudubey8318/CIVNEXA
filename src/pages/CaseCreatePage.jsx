import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  Search,
  QrCode,
  FileText,
  Paperclip,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldAlert,
  Calendar,
  Clock,
  MapPin,
  UploadCloud,
  X,
  FileCheck2,
  Eye,
  Info,
} from 'lucide-react';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import { FileUploader } from '../components/forms/FileUploader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import caseService from '../services/caseService';
import { searchStudents, MOCK_STUDENTS } from '../constants/studentDirectory';
import { CASE_CATEGORIES } from '../constants/caseConfig';
import AiComplaintClassifier from '../components/ai/AiComplaintClassifier';

export const CaseCreatePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  // Wizard Step (1: Identify Student, 2: Incident Info, 3: Evidence, 4: Review & Submit)
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Student Lookup State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isQrScanning, setIsQrScanning] = useState(false);

  // Step 2: Incident Form State
  const [categoryKey, setCategoryKey] = useState('DISCIPLINE');
  const [subcategory, setSubcategory] = useState('Property Damage / Vandalism');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState('14:30');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [isConfidential, setIsConfidential] = useState(false);
  const [remarks, setRemarks] = useState('');

  const handleApplyAiSuggestion = (suggestion) => {
    if (!suggestion) return;
    const cat = suggestion.suggestedCategory;
    if (cat === 'ACADEMIC_INTEGRITY') setCategoryKey('EXAM_INCIDENT');
    else if (cat === 'RAGGING_BULLYING' || cat === 'ANTI_RAGGING') setCategoryKey('ANTI_RAGGING');
    else if (cat === 'HARASSMENT_DISCRIMINATION' || cat === 'HARASSMENT') setCategoryKey('CAMPUS_SAFETY');
    else if (cat === 'FACILITIES_INFRASTRUCTURE') setCategoryKey('INFRASTRUCTURE');
    else if (cat === 'DISCIPLINARY' || cat === 'DISCIPLINE') setCategoryKey('DISCIPLINE');

    if (suggestion.suggestedPriority) {
      setPriority(suggestion.suggestedPriority);
    }
    toast.success(`Applied AI recommendation: ${suggestion.suggestedCategory} (${suggestion.suggestedPriority})`);
  };

  // Step 3: Evidence Files State
  const [attachments, setAttachments] = useState([]);

  // Validation Errors
  const [errors, setErrors] = useState({});

  // Created Case Reference on Success
  const [createdCase, setCreatedCase] = useState(null);

  // Subcategories mapping
  const activeCategoryObj = CASE_CATEGORIES.find((c) => c.key === categoryKey) || CASE_CATEGORIES[5];
  const availableSubcategories = activeCategoryObj.subcategories || ['General Incident'];

  const handleStudentSearch = (q) => {
    setStudentSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const results = searchStudents(q);
    setSearchResults(results);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearchQuery('');
    setSearchResults([]);
    setErrors((prev) => ({ ...prev, student: null }));
  };

  const handleQrMockScan = () => {
    setIsQrScanning(true);
    setTimeout(async () => {
      let targetStudent = null;
      try {
        const activeCases = await caseService.getCases({});
        if (activeCases && activeCases.length > 0 && activeCases[0].student) {
          targetStudent = activeCases[0].student;
        }
      } catch (e) {
        // Fallback
      }
      if (!targetStudent && MOCK_STUDENTS && MOCK_STUDENTS.length > 0) {
        targetStudent = MOCK_STUDENTS[0];
      }
      if (targetStudent) {
        setSelectedStudent(targetStudent);
        toast.success(`QR ID verified: ${targetStudent.name} (${targetStudent.rollNo})`);
      }
      setIsQrScanning(false);
    }, 600);
  };

  // Step validation
  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!selectedStudent) {
        errs.student = 'Please search and select a verified student record.';
      }
    } else if (step === 2) {
      if (!title || title.trim().length < 5) {
        errs.title = 'Incident title must be at least 5 characters.';
      }
      if (!description || description.trim().length < 15) {
        errs.description = 'Please provide a detailed incident report (at least 15 characters).';
      }
      if (!incidentDate) {
        errs.incidentDate = 'Incident date is required.';
      }
      if (!location || location.trim().length < 3) {
        errs.location = 'Specific location is required (e.g. Lab 208, Block A).';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitCase = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      toast.error('Please resolve missing required fields before submission.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newCase = await caseService.createCase({
        student: selectedStudent,
        category: activeCategoryObj.label,
        categoryKey,
        subcategory,
        title,
        description,
        incidentDate,
        incidentTime,
        location,
        priority,
        isConfidential,
        remarks,
        attachments,
        reporter: currentUser,
      });

      setCreatedCase(newCase);
      toast.success(`Case ${newCase.caseNumber} created successfully!`);
      setCurrentStep(5); // Completion step
    } catch (err) {
      toast.error(err.message || 'Failed to submit case record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Report Campus Incident"
        subtitle="Formal incident reporting, evidence intake, and proctorial case creation workflow."
        breadcrumbs={[{ label: 'Cases', to: '/cases' }, { label: 'New Incident' }]}
      />

      {/* Wizard Progress Indicator */}
      {currentStep <= 4 && (
        <div className="cx-card mb-4 p-3 p-md-4">
          <div className="d-flex align-items-center justify-content-between position-relative">
            {/* Progress line */}
            <div
              className="position-absolute top-50 start-0 w-100 translate-middle-y d-none d-md-block"
              style={{
                height: '2px',
                backgroundColor: 'var(--cx-slate-200)',
                zIndex: 1,
              }}
            >
              <div
                className="h-100 transition-all"
                style={{
                  width: `${((currentStep - 1) / 3) * 100}%`,
                  backgroundColor: 'var(--cx-teal-500)',
                }}
              />
            </div>

            {[
              { num: 1, label: 'Identify Student', icon: UserCheck },
              { num: 2, label: 'Incident Details', icon: FileText },
              { num: 3, label: 'Evidence Intake', icon: Paperclip },
              { num: 4, label: 'Review & Submit', icon: CheckCircle2 },
            ].map((step) => {
              const isPassed = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              const Icon = step.icon;

              return (
                <div
                  key={step.num}
                  className="d-flex flex-column align-items-center position-relative"
                  style={{ zIndex: 2 }}
                >
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center transition-all ${
                      isPassed
                        ? 'bg-success text-white'
                        : isCurrent
                        ? 'text-white'
                        : 'bg-light text-muted border'
                    }`}
                    style={{
                      width: '38px',
                      height: '38px',
                      backgroundColor: isCurrent ? 'var(--cx-teal-600)' : undefined,
                      boxShadow: isCurrent ? '0 0 0 4px var(--cx-teal-100)' : undefined,
                      fontWeight: 700,
                    }}
                  >
                    {isPassed ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </div>
                  <span
                    className={`small mt-2 d-none d-md-block ${
                      isCurrent ? 'fw-bold text-dark' : 'text-muted'
                    }`}
                    style={{ fontSize: '0.8125rem' }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wizard Form Panels */}
      <div className="cx-card p-4 p-md-5">
        {/* STEP 1: IDENTIFY STUDENT */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
              <div>
                <h2 className="h5 fw-bold text-dark mb-1">Step 1: Identify Student Record</h2>
                <p className="text-muted small mb-0">
                  Search student directory by Roll Number, Enrollment ID, Student Name, or Scan Campus QR.
                </p>
              </div>
              <button
                type="button"
                onClick={handleQrMockScan}
                disabled={isQrScanning}
                className="cx-btn cx-btn-outline d-flex align-items-center gap-1.5"
                title="Simulate scanning physical university ID QR code"
              >
                <QrCode size={16} />
                <span>{isQrScanning ? 'Scanning...' : 'Scan Student QR'}</span>
              </button>
            </div>

            {/* Selected Student Preview Card */}
            {selectedStudent ? (
              <div
                className="p-4 rounded-3 border mb-4"
                style={{
                  backgroundColor: 'var(--cx-teal-50)',
                  borderColor: 'var(--cx-teal-300)',
                }}
              >
                <div className="d-flex align-items-start justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                      style={{
                        width: '52px',
                        height: '52px',
                        backgroundColor: 'var(--cx-teal-700)',
                        fontSize: '1.25rem',
                      }}
                    >
                      {selectedStudent.avatar || 'ST'}
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h3 className="h6 fw-bold text-dark mb-0">{selectedStudent.name}</h3>
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          Verified Scholar
                        </span>
                      </div>
                      <div className="small text-muted mt-1">
                        Roll No: <span className="cx-font-mono fw-semibold text-dark">{selectedStudent.rollNo}</span> •
                        Enrollment: <span className="cx-font-mono text-dark">{selectedStudent.enrollmentNo}</span>
                      </div>
                      <div className="small text-muted mt-0.5">
                        {selectedStudent.department} • {selectedStudent.course} ({selectedStudent.semester})
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  >
                    <X size={14} />
                    <span>Change Student</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="position-relative mb-3">
                  <label htmlFor="student-search-input" className="cx-form-label">
                    Search Student Directory <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <Search size={16} className="text-muted" />
                    </span>
                    <input
                      id="student-search-input"
                      type="text"
                      className="cx-input rounded-start-0"
                      placeholder="Type student name (e.g., Aarav, Rohan, Priya) or roll no (e.g., 22CSE041)..."
                      value={studentSearchQuery}
                      onChange={(e) => handleStudentSearch(e.target.value)}
                    />
                  </div>
                  {errors.student && (
                    <div className="text-danger small mt-1.5 d-flex align-items-center gap-1">
                      <AlertCircle size={14} />
                      <span>{errors.student}</span>
                    </div>
                  )}
                </div>

                {/* Instant Search Results Dropdown/List */}
                {searchResults.length > 0 && (
                  <div className="border rounded-3 p-2 mb-4 bg-white shadow-sm">
                    <div className="small text-muted px-2 py-1 fw-bold">
                      Matching Student Records ({searchResults.length}):
                    </div>
                    {searchResults.map((stu) => (
                      <div
                        key={stu.id}
                        onClick={() => handleSelectStudent(stu)}
                        className="p-2.5 rounded-2 d-flex align-items-center justify-content-between hover-bg-light cursor-pointer transition-all"
                        style={{ cursor: 'pointer' }}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSelectStudent(stu)}
                      >
                        <div>
                          <div className="fw-semibold text-dark">{stu.name}</div>
                          <div className="small text-muted">
                            <span className="cx-font-mono text-teal-700">{stu.rollNo}</span> • {stu.department} •{' '}
                            {stu.semester}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStudent(stu);
                          }}
                          className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {studentSearchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="p-3 text-center text-muted small border rounded-3 bg-light mb-4">
                    No student record found matching "{studentSearchQuery}". Please check the student name or roll number.
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 2: INCIDENT INFORMATION */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-4 pb-2 border-bottom">
              <h2 className="h5 fw-bold text-dark mb-1">Step 2: Incident Details & Classification</h2>
              <p className="text-muted small mb-0">
                Specify the nature of the allegation, location, priority level, and detailed narrative.
              </p>
            </div>

            <AiComplaintClassifier
              title={title}
              description={description}
              onApplySuggestion={handleApplyAiSuggestion}
            />

            <div className="row g-3">
              {/* Category & Subcategory */}
              <div className="col-12 col-md-6">
                <label htmlFor="case-category-select" className="cx-form-label">
                  Incident Category <span className="text-danger">*</span>
                </label>
                <select
                  id="case-category-select"
                  className="cx-input"
                  value={categoryKey}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    setCategoryKey(newKey);
                    const catObj = CASE_CATEGORIES.find((c) => c.key === newKey);
                    if (catObj && catObj.subcategories && catObj.subcategories.length > 0) {
                      setSubcategory(catObj.subcategories[0]);
                    }
                  }}
                >
                  {CASE_CATEGORIES.filter((c) => c.key !== 'ALL').map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="case-subcategory-select" className="cx-form-label">
                  Subcategory
                </label>
                <select
                  id="case-subcategory-select"
                  className="cx-input"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                >
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="col-12">
                <label htmlFor="case-title-input" className="cx-form-label">
                  Incident Title / Headline <span className="text-danger">*</span>
                </label>
                <input
                  id="case-title-input"
                  type="text"
                  className="cx-input"
                  placeholder="e.g. Unauthorized electronic device detected during exam in Hall 304"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {errors.title && <div className="text-danger small mt-1">{errors.title}</div>}
              </div>

              {/* Date & Time */}
              <div className="col-12 col-md-4">
                <label htmlFor="case-date-input" className="cx-form-label">
                  Incident Date <span className="text-danger">*</span>
                </label>
                <input
                  id="case-date-input"
                  type="date"
                  className="cx-input"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                />
                {errors.incidentDate && <div className="text-danger small mt-1">{errors.incidentDate}</div>}
              </div>

              <div className="col-12 col-md-4">
                <label htmlFor="case-time-input" className="cx-form-label">
                  Incident Time
                </label>
                <input
                  id="case-time-input"
                  type="time"
                  className="cx-input"
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label htmlFor="case-priority-select" className="cx-form-label">
                  Initial Priority <span className="text-danger">*</span>
                </label>
                <select
                  id="case-priority-select"
                  className="cx-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">Low (Standard Review)</option>
                  <option value="MEDIUM">Medium (Expedited Review)</option>
                  <option value="HIGH">High (Urgent Attention)</option>
                  <option value="CRITICAL">Critical (Immediate Proctorial Action)</option>
                </select>
              </div>

              {/* Location */}
              <div className="col-12">
                <label htmlFor="case-location-input" className="cx-form-label">
                  Incident Location <span className="text-danger">*</span>
                </label>
                <input
                  id="case-location-input"
                  type="text"
                  className="cx-input"
                  placeholder="e.g. Electronics Circuit Lab 208, Academic Block B"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                {errors.location && <div className="text-danger small mt-1">{errors.location}</div>}
              </div>

              {/* Description */}
              <div className="col-12">
                <label htmlFor="case-description-input" className="cx-form-label">
                  Detailed Incident Narrative <span className="text-danger">*</span>
                </label>
                <textarea
                  id="case-description-input"
                  className="cx-input"
                  rows={4}
                  placeholder="Provide an objective, chronological account of what occurred, individuals present, and immediate actions taken..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errors.description && <div className="text-danger small mt-1">{errors.description}</div>}
              </div>

              {/* Confidentiality Toggle */}
              <div className="col-12">
                <div
                  className="p-3 rounded-3 border d-flex align-items-start gap-3"
                  style={{ backgroundColor: isConfidential ? 'var(--cx-purple-50)' : 'var(--cx-slate-50)' }}
                >
                  <input
                    id="case-confidential-check"
                    type="checkbox"
                    className="form-check-input mt-1"
                    checked={isConfidential}
                    onChange={(e) => setIsConfidential(e.target.checked)}
                  />
                  <div>
                    <label htmlFor="case-confidential-check" className="fw-semibold text-dark mb-0 cursor-pointer">
                      Mark as High-Sensitivity / Confidential Incident
                    </label>
                    <p className="text-muted small mb-0 mt-0.5">
                      Restricts incident visibility strictly to Dean of Student Affairs, Proctorial Board, and appointed
                      inquiry officers. Student identity is masked in general registries.
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Remarks */}
              <div className="col-12">
                <label htmlFor="case-remarks-input" className="cx-form-label">
                  Additional Staff Remarks (Optional)
                </label>
                <input
                  id="case-remarks-input"
                  type="text"
                  className="cx-input"
                  placeholder="Optional internal notes, witnesses present, or immediate measures taken..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: EVIDENCE & ATTACHMENTS */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-4 pb-2 border-bottom">
              <h2 className="h5 fw-bold text-dark mb-1">Step 3: Evidence & Supporting Attachments</h2>
              <p className="text-muted small mb-0">
                Upload relevant documentation, confiscated item photographs, seating charts, or invigilator reports.
              </p>
            </div>

            <div className="mb-4">
              <FileUploader
                onFilesSelected={(files) => setAttachments(files)}
                maxFiles={6}
                maxSizeMB={15}
                acceptedTypes=".pdf,.jpg,.jpeg,.png,.docx,.mp4"
              />
            </div>

            {/* Document attachment notice */}
            <div className="p-3 rounded-3 bg-light border d-flex align-items-start gap-2.5">
              <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="small text-muted">
                <strong>Document Attachments:</strong> Attached evidentiary documents are processed for digital verification and case attachment. Supported formats include PDF, PNG, JPG, and DOCX (up to 15 MB).
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: REVIEW AND SUBMIT */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-4 pb-2 border-bottom">
              <h2 className="h5 fw-bold text-dark mb-1">Step 4: Review Case Docket & Submit</h2>
              <p className="text-muted small mb-0">
                Carefully review all docket details before formal submission into the verification queue.
              </p>
            </div>

            <div className="row g-4">
              {/* Student Summary */}
              <div className="col-12 col-md-6">
                <div className="p-3.5 rounded-3 border h-100 bg-light bg-opacity-50">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small fw-bold text-muted text-uppercase tracking-wider">Subject Student</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="btn btn-sm btn-link p-0 text-decoration-none"
                    >
                      Edit
                    </button>
                  </div>
                  {selectedStudent && (
                    <div>
                      <div className="h6 fw-bold text-dark mb-0">{selectedStudent.name}</div>
                      <div className="small text-muted font-monospace">{selectedStudent.rollNo}</div>
                      <div className="small text-muted mt-1">
                        {selectedStudent.department} • {selectedStudent.course}
                      </div>
                      <div className="small text-muted">
                        Enrollment: <span className="font-monospace">{selectedStudent.enrollmentNo}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Classification Summary */}
              <div className="col-12 col-md-6">
                <div className="p-3.5 rounded-3 border h-100 bg-light bg-opacity-50">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small fw-bold text-muted text-uppercase tracking-wider">Classification</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="btn btn-sm btn-link p-0 text-decoration-none"
                    >
                      Edit
                    </button>
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-semibold text-dark">{activeCategoryObj.label}</span>
                      <span className="badge bg-secondary-subtle text-secondary">{subcategory}</span>
                    </div>
                    <div className="small text-muted">
                      Priority: <strong className="text-dark">{priority}</strong>
                    </div>
                    <div className="small text-muted">
                      Date & Time: {incidentDate} at {incidentTime}
                    </div>
                    <div className="small text-muted">Location: {location}</div>
                  </div>
                </div>
              </div>

              {/* Narrative Summary */}
              <div className="col-12">
                <div className="p-3.5 rounded-3 border bg-light bg-opacity-50">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small fw-bold text-muted text-uppercase tracking-wider">Incident Narrative</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="btn btn-sm btn-link p-0 text-decoration-none"
                    >
                      Edit
                    </button>
                  </div>
                  <h4 className="h6 fw-bold text-dark">{title}</h4>
                  <p className="small text-muted mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                    {description}
                  </p>
                </div>
              </div>

              {/* Attachments Summary */}
              <div className="col-12">
                <div className="p-3.5 rounded-3 border bg-light bg-opacity-50">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small fw-bold text-muted text-uppercase tracking-wider">
                      Attached Evidence ({attachments.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="btn btn-sm btn-link p-0 text-decoration-none"
                    >
                      Edit
                    </button>
                  </div>
                  {attachments.length === 0 ? (
                    <div className="small text-muted">No files attached to this incident report.</div>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="badge bg-white border text-dark p-2 d-flex align-items-center gap-1.5">
                          <Paperclip size={13} className="text-muted" />
                          <span>{file.name}</span>
                          <span className="text-muted ms-1 font-monospace">({file.size})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: SUBMISSION CONFIRMATION */}
        {currentStep === 5 && createdCase && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center text-success mb-3"
              style={{ width: '64px', height: '64px', backgroundColor: 'var(--cx-teal-50)' }}
            >
              <CheckCircle2 size={36} style={{ color: 'var(--cx-teal-600)' }} />
            </div>

            <h2 className="h4 fw-bold text-dark mb-1">Incident Docket Successfully Logged</h2>
            <p className="text-muted small mb-4">
              The case has been assigned a unique institutional reference and queued for Dean / Proctorial verification.
            </p>

            <div
              className="p-4 rounded-3 border mb-4 text-start mx-auto"
              style={{ maxWidth: '480px', backgroundColor: 'var(--cx-slate-50)' }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small text-muted">Case Reference:</span>
                <span className="cx-font-mono fw-bold fs-5" style={{ color: 'var(--cx-teal-700)' }}>
                  {createdCase.caseNumber}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small text-muted">Subject Student:</span>
                <span className="small fw-semibold text-dark">{createdCase.student.name}</span>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small text-muted">Category:</span>
                <span className="small fw-semibold text-dark">{createdCase.category}</span>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <span className="small text-muted">Initial Status:</span>
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                  Pending Verification
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-center gap-3">
              <Link to="/cases" className="cx-btn cx-btn-outline">
                Return to Registry
              </Link>
              <Link to={`/cases/${createdCase.caseNumber}`} className="cx-btn cx-btn-primary">
                <span>View Case Details</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Wizard Controls Footer */}
        {currentStep <= 4 && (
          <div className="d-flex align-items-center justify-content-between mt-5 pt-3 border-top">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="cx-btn cx-btn-outline d-flex align-items-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <Link to="/cases" className="cx-btn cx-btn-outline text-muted">
                Cancel
              </Link>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="cx-btn cx-btn-primary d-flex align-items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitCase}
                  disabled={isSubmitting}
                  className="cx-btn cx-btn-primary d-flex align-items-center gap-1.5 px-4"
                >
                  <FileCheck2 size={16} />
                  <span>{isSubmitting ? 'Creating Docket...' : 'Submit Incident Report'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default CaseCreatePage;
