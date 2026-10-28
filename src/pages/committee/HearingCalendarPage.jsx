import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileCheck,
  Send,
  Eye,
  List,
  CalendarDays,
  ShieldAlert,
  Edit3,
  RotateCcw,
  Printer,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/feedback/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import hearingService from '../../services/hearingService';
import caseService from '../../services/caseService';

export const HearingCalendarPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Current calendar view state: default to October 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October
  const [selectedDate, setSelectedDate] = useState('2026-10-24');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  const [hearings, setHearings] = useState([]);
  const [casesList, setCasesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Scheduling Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [editingHearingId, setEditingHearingId] = useState(null);

  const [formCaseId, setFormCaseId] = useState('');
  const [formDate, setFormDate] = useState('2026-10-25');
  const [formTime, setFormTime] = useState('11:00');
  const [formEndTime, setFormEndTime] = useState('12:00');
  const [formVenue, setFormVenue] = useState('Senate Chamber, Admin Block A');
  const [formMode, setFormMode] = useState('In-Person');
  const [formAuthority, setFormAuthority] = useState('Prof. Ananya Sen (Dean of Student Affairs)');
  const [formMembers, setFormMembers] = useState('Dr. Alok Nath, Prof. Sunita Mehta');
  const [formRemarks, setFormRemarks] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Conflict Warning State
  const [conflictWarning, setConflictWarning] = useState(null);

  // Minutes Modal State
  const [isMinutesModalOpen, setIsMinutesModalOpen] = useState(false);
  const [selectedHearingForMinutes, setSelectedHearingForMinutes] = useState(null);
  const [minPresent, setMinPresent] = useState('');
  const [minAbsent, setMinAbsent] = useState('');
  const [minTopics, setMinTopics] = useState('');
  const [minDocs, setMinDocs] = useState('');
  const [minSummary, setMinSummary] = useState('');
  const [minAdditional, setMinAdditional] = useState('');
  const [minNextSteps, setMinNextSteps] = useState('');

  // Notice Preparation & Preview Modal State
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [selectedHearingForNotice, setSelectedHearingForNotice] = useState(null);
  const [activeNotice, setActiveNotice] = useState(null);

  // Outcome Modal State
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [selectedHearingForOutcome, setSelectedHearingForOutcome] = useState(null);
  const [outcomeStatus, setOutcomeStatus] = useState('Committee Recommendation Pending');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const [isActionLoading, setIsActionLoading] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const loadHearings = async () => {
    setIsLoading(true);
    try {
      const [hList, cList] = await Promise.all([
        hearingService.getHearings({ currentUser }),
        caseService.getCases({ pageSize: 50, currentUser }),
      ]);
      setHearings(hList);
      setCasesList(cList.items || []);
    } catch (err) {
      toast.error('Unable to load hearings schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHearings();
  }, [currentUser]);

  // Calendar math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(formattedDate);
  };

  // Hearings for currently selected date
  const selectedDateHearings = hearings.filter((h) => h.date === selectedDate);

  // Open Schedule Modal
  const openScheduleModal = (targetDate = null) => {
    setIsRescheduling(false);
    setEditingHearingId(null);
    setFormDate(targetDate || selectedDate || '2026-10-25');
    setFormTime('10:30');
    setFormEndTime('11:30');
    setFormVenue('Senate Chamber, Admin Block A');
    setFormMode('In-Person');
    setFormAuthority('Prof. Ananya Sen (Dean of Student Affairs)');
    setFormMembers('Dr. Alok Nath, Prof. Sunita Mehta');
    setFormRemarks('');
    setConflictWarning(null);
    if (casesList.length > 0) {
      setFormCaseId(casesList[0].id);
    }
    setIsScheduleModalOpen(true);
  };

  // Open Reschedule Modal
  const openRescheduleModal = (hearing) => {
    setIsRescheduling(true);
    setEditingHearingId(hearing.id);
    setFormCaseId(hearing.caseId);
    setFormDate(hearing.date);
    setFormTime(hearing.time);
    setFormEndTime(hearing.endTime || hearing.time);
    setFormVenue(hearing.venue);
    setFormMode(hearing.mode);
    setFormAuthority(hearing.presidingAuthority);
    setFormMembers(hearing.committeeMembers ? hearing.committeeMembers.join(', ') : '');
    setFormRemarks(hearing.remarks || '');
    setRescheduleReason('');
    setConflictWarning(null);
    setIsScheduleModalOpen(true);
  };

  // Check Conflict in Real Time
  const checkConflictOnForm = () => {
    const conflict = hearingService.checkSchedulingConflict({
      hearingIdToIgnore: editingHearingId,
      date: formDate,
      time: formTime,
      endTime: formEndTime,
      venue: formVenue,
      presidingAuthority: formAuthority,
    });
    if (conflict.hasConflict) {
      setConflictWarning(conflict.conflicts[0]);
    } else {
      setConflictWarning(null);
    }
  };

  useEffect(() => {
    if (isScheduleModalOpen) {
      checkConflictOnForm();
    }
  }, [formDate, formTime, formEndTime, formVenue, formAuthority, isScheduleModalOpen]);

  // Handle Hearing Save / Reschedule
  const handleSaveHearing = async (e) => {
    e.preventDefault();
    if (!formDate || !formTime || !formVenue) {
      toast.error('Date, start time, and venue are mandatory.');
      return;
    }

    if (formEndTime && formEndTime <= formTime) {
      toast.error('End time must not precede start time.');
      return;
    }

    setIsActionLoading(true);
    const membersArr = formMembers ? formMembers.split(',').map((m) => m.trim()) : ['Dr. Alok Nath'];

    try {
      if (isRescheduling) {
        await hearingService.rescheduleHearing(editingHearingId, {
          date: formDate,
          time: formTime,
          endTime: formEndTime,
          venue: formVenue,
          mode: formMode,
          reason: rescheduleReason,
          rescheduledBy: currentUser,
          bypassConflictWarning: true,
        });
        toast.success('Hearing successfully rescheduled.');
      } else {
        const foundCase = casesList.find((c) => c.id === formCaseId || c.caseNumber === formCaseId);
        await hearingService.scheduleHearing({
          caseId: formCaseId,
          caseNumber: foundCase?.caseNumber || formCaseId,
          caseTitle: foundCase?.title || 'Proctorial Disciplinary Hearing',
          studentName: foundCase?.student?.name || 'Subject Student',
          studentRoll: foundCase?.student?.rollNo || 'N/A',
          date: formDate,
          time: formTime,
          endTime: formEndTime,
          venue: formVenue,
          mode: formMode,
          presidingAuthority: formAuthority,
          committeeMembers: membersArr,
          remarks: formRemarks,
          scheduledBy: currentUser,
          bypassConflictWarning: true,
        });
        toast.success(`Hearing scheduled for case ${foundCase?.caseNumber || formCaseId}.`);
      }
      setIsScheduleModalOpen(false);
      loadHearings();
    } catch (err) {
      toast.error(err.message || 'Failed to save hearing.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Open Minutes Modal
  const openMinutesModal = (hearing) => {
    setSelectedHearingForMinutes(hearing);
    const m = hearing.minutes;
    if (m) {
      setMinPresent(m.participantsPresent ? m.participantsPresent.join(', ') : '');
      setMinAbsent(m.participantsAbsent ? m.participantsAbsent.join(', ') : '');
      setMinTopics(m.topicsDiscussed || '');
      setMinDocs(m.documentsConsidered ? m.documentsConsidered.join(', ') : '');
      setMinSummary(m.summary || '');
      setMinAdditional(m.additionalInfoRequested || '');
      setMinNextSteps(m.nextSteps || '');
    } else {
      setMinPresent('Prof. Ananya Sen, Dr. Alok Nath, Prof. Sunita Mehta');
      setMinAbsent('');
      setMinTopics(`Inquiry proceedings into ${hearing.caseTitle}`);
      setMinDocs('Invigilator memo, Seating log, Physical evidence');
      setMinSummary('');
      setMinAdditional('');
      setMinNextSteps('Prepare committee recommendation docket');
    }
    setIsMinutesModalOpen(true);
  };

  const handleSaveMinutes = async (isDraft) => {
    if (!selectedHearingForMinutes) return;
    if (!isDraft && (!minSummary || minSummary.trim().length < 15)) {
      toast.error('Summary of proceedings must be at least 15 characters.');
      return;
    }

    setIsActionLoading(true);
    const presentArr = minPresent ? minPresent.split(',').map((p) => p.trim()) : [];
    const absentArr = minAbsent ? minAbsent.split(',').map((p) => p.trim()) : [];
    const docsArr = minDocs ? minDocs.split(',').map((d) => d.trim()) : [];

    try {
      await hearingService.saveHearingMinutes(selectedHearingForMinutes.id, {
        participantsPresent: presentArr,
        participantsAbsent: absentArr,
        topicsDiscussed: minTopics,
        documentsConsidered: docsArr,
        summary: minSummary,
        additionalInfoRequested: minAdditional,
        nextSteps: minNextSteps,
        isDraft,
        recordedBy: currentUser,
      });
      toast.success(isDraft ? 'Hearing minutes draft saved.' : 'Formal hearing minutes submitted successfully!');
      setIsMinutesModalOpen(false);
      loadHearings();
    } catch (err) {
      toast.error(err.message || 'Failed to save minutes.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Open Notice Modal
  const openNoticeModal = (hearing) => {
    setSelectedHearingForNotice(hearing);
    const notices = hearing.notices || [];
    setActiveNotice(notices[0] || null);
    setIsNoticeModalOpen(true);
  };

  const handleUpdateNoticeStatus = async (noticeId, newStatus) => {
    if (!selectedHearingForNotice) return;
    try {
      await hearingService.updateNoticeStatus(selectedHearingForNotice.id, noticeId, newStatus);
      toast.success(`Notice status updated to ${newStatus}.`);
      loadHearings();
    } catch (err) {
      toast.error(err.message || 'Failed to update notice status.');
    }
  };

  // Open Outcome Modal
  const openOutcomeModal = (hearing) => {
    setSelectedHearingForOutcome(hearing);
    setOutcomeStatus(hearing.outcome || 'Committee Recommendation Pending');
    setOutcomeNotes(hearing.outcomeNotes || '');
    setIsOutcomeModalOpen(true);
  };

  const handleSaveOutcome = async (e) => {
    e.preventDefault();
    if (!selectedHearingForOutcome) return;

    setIsActionLoading(true);
    try {
      await hearingService.recordHearingOutcome(selectedHearingForOutcome.id, {
        outcome: outcomeStatus,
        notes: outcomeNotes,
        recordedBy: currentUser,
      });
      toast.success(`Formal outcome recorded for Hearing ${selectedHearingForOutcome.hearingNumber}.`);
      setIsOutcomeModalOpen(false);
      loadHearings();
    } catch (err) {
      toast.error(err.message || 'Failed to record outcome.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Disciplinary Hearing Calendar & Proceedings"
        subtitle="Schedule formal hearings, issue procedural notices, inspect calendar conflicts, and record official hearing minutes."
        breadcrumbs={[{ label: 'Committee' }, { label: 'Hearing Calendar' }]}
        badge={
          <span className="badge bg-primary-subtle text-primary border px-2 py-1 d-inline-flex align-items-center gap-1.5">
            <CalendarIcon size={13} />
            <span>{hearings.length === 0 ? 'No scheduled hearings' : `${hearings.length} Scheduled Hearings`}</span>
          </span>
        }
        actions={
          <div className="d-flex align-items-center gap-2">
            <div className="btn-group border rounded-2 p-0.5 bg-white shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-teal text-white' : 'btn-light text-muted'}`}
                title="Calendar Grid View"
              >
                <CalendarDays size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-teal text-white' : 'btn-light text-muted'}`}
                title="Chronological List View"
              >
                <List size={15} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => openScheduleModal()}
              className="cx-btn cx-btn-teal d-flex align-items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Schedule Hearing</span>
            </button>
          </div>
        }
      />

      {/* Main Grid: Calendar & Day Docket */}
      <div className="row g-4 mb-4">
        {/* CALENDAR COLUMN */}
        <div className={viewMode === 'calendar' ? 'col-12 col-lg-7' : 'd-none'}>
          <div className="cx-card p-4">
            {/* Calendar Controls */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-2">
                <h2 className="h5 fw-bold text-dark mb-0">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <span className="badge bg-light text-dark border">
                  {hearings.filter((h) => h.date && h.date.startsWith(monthString)).length} Hearings
                </span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="btn btn-sm btn-outline-secondary p-1.5"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentYear(2026);
                    setCurrentMonth(9);
                    setSelectedDate('2026-10-24');
                  }}
                  className="btn btn-sm btn-light border px-2 py-1 text-muted small"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="btn btn-sm btn-outline-secondary p-1.5"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div
              className="d-grid mb-2 text-center text-muted fw-bold small"
              style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="d-grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {/* Blank leading days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`blank-${i}`} className="p-2 border rounded-2 bg-light bg-opacity-25" style={{ height: '76px' }} />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayHearings = hearings.filter((h) => h.date === dateKey);
                const isSelected = selectedDate === dateKey;
                const isToday = dateKey === '2026-10-22';

                return (
                  <div
                    key={dayNum}
                    onClick={() => handleSelectDay(dayNum)}
                    className={`p-2 border rounded-2 cursor-pointer transition-all d-flex flex-column justify-content-between ${
                      isSelected
                        ? 'border-teal bg-teal-50'
                        : isToday
                        ? 'border-primary bg-primary-subtle bg-opacity-25'
                        : 'bg-white hover-bg-light'
                    }`}
                    style={{
                      height: '76px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 0 2px var(--cx-teal-500)' : 'none',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span className={`small fw-bold ${isSelected ? 'text-teal' : 'text-dark'}`}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="badge bg-primary text-white p-0.5 rounded-circle" style={{ width: '6px', height: '6px' }} />
                      )}
                    </div>

                    {dayHearings.length > 0 && (
                      <div className="d-flex flex-column gap-0.5">
                        <span
                          className="badge bg-teal-subtle text-teal border px-1 py-0.5 text-truncate"
                          style={{ fontSize: '0.65rem' }}
                        >
                          {dayHearings.length} {dayHearings.length === 1 ? 'Hearing' : 'Hearings'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* DAY HEARINGS DOCKET */}
        <div className={viewMode === 'calendar' ? 'col-12 col-lg-5' : 'col-12'}>
          <div className="cx-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div>
                <h2 className="h6 fw-bold text-dark mb-0">Hearings for {selectedDate}</h2>
                <span className="small text-muted">{selectedDateHearings.length} Session(s) Scheduled</span>
              </div>
              <button
                type="button"
                onClick={() => openScheduleModal(selectedDate)}
                className="cx-btn cx-btn-outline cx-btn-sm"
              >
                <Plus size={14} />
                <span>Add for This Date</span>
              </button>
            </div>

            {selectedDateHearings.length === 0 ? (
              <div className="p-5 text-center text-muted border rounded-3 bg-light my-auto">
                <CalendarIcon size={36} className="mx-auto mb-2 text-muted opacity-50" />
                <h3 className="h6 fw-bold text-dark">{hearings.length === 0 ? 'No scheduled hearings' : `No scheduled hearings on ${selectedDate}`}</h3>
                <p className="small text-muted mb-0">Click "Schedule Hearing" to issue summons for this date.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {selectedDateHearings.map((h) => (
                  <div key={h.id} className="p-3.5 rounded-3 border bg-white shadow-sm border-start border-4 border-teal">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="cx-font-mono fw-bold text-teal" style={{ fontSize: '0.9rem' }}>
                          {h.hearingNumber}
                        </span>
                        <span
                          className={`badge ${
                            h.status === 'COMPLETED'
                              ? 'bg-success-subtle text-success'
                              : h.status === 'AWAITING_MINUTES'
                              ? 'bg-warning-subtle text-warning'
                              : 'bg-primary-subtle text-primary'
                          }`}
                        >
                          {h.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="badge bg-secondary-subtle text-secondary">{h.mode}</span>
                    </div>

                    <h3 className="h6 fw-bold text-dark mb-1">{h.caseTitle}</h3>
                    <div className="small text-muted mb-2">
                      Docket:{' '}
                      <Link
                        to={`/cases/${h.caseNumber}`}
                        className="cx-font-mono fw-bold text-decoration-none hover-underline text-teal"
                      >
                        {h.caseNumber}
                      </Link>{' '}
                      • Student: <strong className="text-dark">{h.studentName}</strong> ({h.studentRoll})
                    </div>

                    <div className="p-2.5 rounded-2 bg-light border small text-muted mb-3">
                      <div className="d-flex align-items-center gap-1.5 mb-1 text-dark">
                        <Clock size={13} className="text-teal" />
                        <span>
                          {h.time} – {h.endTime || 'Close'} ({h.date})
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-1.5 mb-1 text-dark">
                        <MapPin size={13} className="text-danger" />
                        <span>{h.venue}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        <Users size={13} className="text-primary" />
                        <span className="text-truncate">Chair: {h.presidingAuthority}</span>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top">
                      <div className="d-flex align-items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openNoticeModal(h)}
                          className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2"
                          title="Prepare & View Summons Notice"
                        >
                          <Send size={13} />
                          <span>Notices</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openMinutesModal(h)}
                          className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2"
                          title="Record / View Hearing Minutes"
                        >
                          <FileCheck size={13} />
                          <span>Minutes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openOutcomeModal(h)}
                          className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2"
                          title="Record Official Outcome"
                        >
                          <CheckCircle2 size={13} />
                          <span>Outcome</span>
                        </button>
                      </div>

                      <div className="d-flex align-items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openRescheduleModal(h)}
                          className="btn btn-sm btn-light border text-muted py-1 px-2"
                          title="Reschedule Session"
                        >
                          <RotateCcw size={13} />
                        </button>
                        <Link
                          to={`/cases/${h.caseNumber}`}
                          className="btn btn-sm btn-light border text-muted py-1 px-2"
                          title="Go to Docket"
                        >
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: SCHEDULE / RESCHEDULE HEARING */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={isRescheduling ? `Reschedule Hearing: ${editingHearingId}` : 'Schedule Disciplinary Hearing'}
        size="lg"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="cx-btn cx-btn-outline"
              disabled={isActionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveHearing}
              className="cx-btn cx-btn-teal"
              disabled={isActionLoading}
            >
              {isActionLoading
                ? 'Processing...'
                : isRescheduling
                ? 'Confirm Reschedule'
                : 'Confirm & Schedule Hearing'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveHearing}>
          {/* Conflict Alert Banner */}
          {conflictWarning && (
            <div className="p-3 rounded-3 bg-danger-subtle border border-danger text-danger mb-4 small">
              <div className="d-flex align-items-start gap-2">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="d-block mb-0.5">Scheduling Conflict Detected!</strong>
                  <span>{conflictWarning.message}</span>
                  <div className="mt-1 small text-muted">
                    You may adjust the venue, timing, or presiding authority, or proceed if special concurrent sessions
                    are authorized.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isRescheduling && (
            <div className="mb-3">
              <label htmlFor="hearing-case-select" className="cx-form-label">
                Select Case Docket <span className="text-danger">*</span>
              </label>
              <select
                id="hearing-case-select"
                className="cx-select"
                value={formCaseId}
                onChange={(e) => setFormCaseId(e.target.value)}
              >
                {casesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.title} ({c.student?.name || 'Student'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="row g-3 mb-3">
            <div className="col-12 col-md-4">
              <label htmlFor="hearing-date-input" className="cx-form-label">
                Hearing Date <span className="text-danger">*</span>
              </label>
              <input
                id="hearing-date-input"
                type="date"
                className="cx-input"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-4">
              <label htmlFor="hearing-start-time" className="cx-form-label">
                Start Time <span className="text-danger">*</span>
              </label>
              <input
                id="hearing-start-time"
                type="time"
                className="cx-input"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-4">
              <label htmlFor="hearing-end-time" className="cx-form-label">
                End Time / Expected Close
              </label>
              <input
                id="hearing-end-time"
                type="time"
                className="cx-input"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-md-8">
              <label htmlFor="hearing-venue-input" className="cx-form-label">
                Hearing Venue or Digital Room <span className="text-danger">*</span>
              </label>
              <input
                id="hearing-venue-input"
                type="text"
                className="cx-input"
                placeholder="e.g. Senate Chamber, Admin Block A or Microsoft Teams Suite Link"
                value={formVenue}
                onChange={(e) => setFormVenue(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4">
              <label htmlFor="hearing-mode-select" className="cx-form-label">
                Mode
              </label>
              <select
                id="hearing-mode-select"
                className="cx-select"
                value={formMode}
                onChange={(e) => setFormMode(e.target.value)}
              >
                <option value="In-Person">In-Person</option>
                <option value="Virtual">Virtual / Remote Video</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="hearing-authority-input" className="cx-form-label">
              Presiding Officer / Inquiry Chair
            </label>
            <input
              id="hearing-authority-input"
              type="text"
              className="cx-input"
              value={formAuthority}
              onChange={(e) => setFormAuthority(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="hearing-members-input" className="cx-form-label">
              Committee Members Present (Comma-separated)
            </label>
            <input
              id="hearing-members-input"
              type="text"
              className="cx-input"
              value={formMembers}
              onChange={(e) => setFormMembers(e.target.value)}
            />
          </div>

          {isRescheduling ? (
            <div className="mb-3">
              <label htmlFor="reschedule-reason-input" className="cx-form-label">
                Mandatory Reason for Rescheduling <span className="text-danger">*</span>
              </label>
              <textarea
                id="reschedule-reason-input"
                className="cx-input"
                rows={2}
                placeholder="e.g. Academic conflict with final lab viva; mutually agreed extension..."
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
              />
            </div>
          ) : (
            <div className="mb-3">
              <label htmlFor="hearing-remarks-input" className="cx-form-label">
                Hearing Purpose & Pre-session Remarks
              </label>
              <textarea
                id="hearing-remarks-input"
                className="cx-input"
                rows={2}
                placeholder="Specify preliminary mandate or required witnesses..."
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
              />
            </div>
          )}
        </form>
      </Modal>

      {/* MODAL 2: HEARING MINUTES EDITOR */}
      <Modal
        isOpen={isMinutesModalOpen}
        onClose={() => setIsMinutesModalOpen(false)}
        title={`Proceedings Minutes: ${selectedHearingForMinutes?.hearingNumber || ''}`}
        size="lg"
        footer={
          <div className="d-flex align-items-center justify-content-between w-100">
            <button
              type="button"
              onClick={() => setIsMinutesModalOpen(false)}
              className="cx-btn cx-btn-outline"
              disabled={isActionLoading}
            >
              Cancel
            </button>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveMinutes(true)}
                className="cx-btn cx-btn-outline"
                disabled={isActionLoading}
              >
                Save Draft Minutes
              </button>
              <button
                type="button"
                onClick={() => handleSaveMinutes(false)}
                className="cx-btn cx-btn-teal"
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Submitting...' : 'Submit Official Minutes'}
              </button>
            </div>
          </div>
        }
      >
        <div className="p-3 bg-light rounded-3 mb-3 small text-muted">
          Hearing minutes constitute the official statutory record of proctorial inquiry proceedings. Submitting minutes
          creates a non-destructive amendment log if edited subsequently.
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="min-present-input" className="cx-form-label">
              Participants Present (Comma-separated)
            </label>
            <input
              id="min-present-input"
              type="text"
              className="cx-input"
              value={minPresent}
              onChange={(e) => setMinPresent(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="min-absent-input" className="cx-form-label">
              Participants Absent / Excused
            </label>
            <input
              id="min-absent-input"
              type="text"
              className="cx-input"
              placeholder="e.g. None or Prof. R. Sharma"
              value={minAbsent}
              onChange={(e) => setMinAbsent(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="min-topics-input" className="cx-form-label">
            Topics & Allegations Examined <span className="text-danger">*</span>
          </label>
          <input
            id="min-topics-input"
            type="text"
            className="cx-input"
            value={minTopics}
            onChange={(e) => setMinTopics(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="min-summary-input" className="cx-form-label">
            Summary of Proceedings & Student Representation <span className="text-danger">*</span>
          </label>
          <textarea
            id="min-summary-input"
            className="cx-input"
            rows={5}
            placeholder="Record verbatim points, witness depositions, student explanations, and board consensus..."
            value={minSummary}
            onChange={(e) => setMinSummary(e.target.value)}
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="min-additional-input" className="cx-form-label">
              Additional Information Requested
            </label>
            <input
              id="min-additional-input"
              type="text"
              className="cx-input"
              placeholder="e.g. Lab attendance sheet confirmation"
              value={minAdditional}
              onChange={(e) => setMinAdditional(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="min-next-input" className="cx-form-label">
              Next Action / Sanction Steps
            </label>
            <input
              id="min-next-input"
              type="text"
              className="cx-input"
              placeholder="e.g. Convene board for sanction drafting"
              value={minNextSteps}
              onChange={(e) => setMinNextSteps(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 3: SUMMONS NOTICES PREPARATION & PREVIEW */}
      <Modal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        title="Disciplinary Hearing Notice & Formal Summons"
        size="lg"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button type="button" onClick={() => setIsNoticeModalOpen(false)} className="cx-btn cx-btn-outline">
              Close Notice
            </button>
          </div>
        }
      >
        {selectedHearingForNotice && (
          <div>
            {/* Notice Letterhead Render */}
            <div className="p-4 rounded-3 border bg-white shadow-sm mb-4">
              <div className="text-center border-bottom pb-3 mb-3">
                <div className="fw-bold fs-5 text-dark">CIVNEXA UNIVERSITY PROCTORIAL BOARD</div>
                <div className="small text-muted text-uppercase letter-spacing-1">
                  OFFICIAL SUMMONS & FORMAL NOTICE OF INQUIRY PROCEEDINGS
                </div>
                <div className="cx-font-mono text-muted small mt-1">
                  Reference: {selectedHearingForNotice.hearingNumber} • Docket: {selectedHearingForNotice.caseNumber}
                </div>
              </div>

              <div className="row g-3 mb-3 small">
                <div className="col-6">
                  <strong>Issued To:</strong> {selectedHearingForNotice.studentName} ({selectedHearingForNotice.studentRoll})
                </div>
                <div className="col-6 text-end">
                  <strong>Date of Summons:</strong> {selectedHearingForNotice.scheduledAt ? new Date(selectedHearingForNotice.scheduledAt).toLocaleDateString() : 'Active'}
                </div>
              </div>

              <div className="p-3 bg-light rounded text-dark small mb-3" style={{ lineHeight: '1.7' }}>
                <p className="mb-2">
                  You are hereby formally summoned to appear before the Disciplinary Committee regarding the matter of:
                </p>
                <p className="fw-bold mb-2 text-dark">"{selectedHearingForNotice.caseTitle}"</p>
                <div className="d-flex flex-wrap gap-3 mt-2 pt-2 border-top">
                  <div>
                    <strong>Date:</strong> {selectedHearingForNotice.date}
                  </div>
                  <div>
                    <strong>Time:</strong> {selectedHearingForNotice.time}
                  </div>
                  <div>
                    <strong>Venue:</strong> {selectedHearingForNotice.venue}
                  </div>
                  <div>
                    <strong>Mode:</strong> {selectedHearingForNotice.mode}
                  </div>
                </div>
              </div>

              <div className="small text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                <strong>Statutory Notice Clauses:</strong> In accordance with university procedural fairness statutes,
                you are entitled to inspect the permitted allegation docket, submit a written representation, and
                present exculpatory evidence. Failure to attend without prior excused leave may result in ex-parte
                deliberation by the board.
              </div>

              <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                <div className="small text-muted">
                  Presiding Officer: <strong>{selectedHearingForNotice.presidingAuthority}</strong>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateNoticeStatus(selectedHearingForNotice.notices[0]?.id, 'ISSUED')}
                    className="cx-btn cx-btn-primary cx-btn-sm"
                  >
                    Mark as Issued
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateNoticeStatus(selectedHearingForNotice.notices[0]?.id, 'ACKNOWLEDGED')}
                    className="cx-btn cx-btn-teal cx-btn-sm"
                  >
                    Mark Acknowledged
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: HEARING OUTCOME */}
      <Modal
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        title={`Record Official Hearing Outcome: ${selectedHearingForOutcome?.hearingNumber || ''}`}
        size="md"
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            <button
              type="button"
              onClick={() => setIsOutcomeModalOpen(false)}
              className="cx-btn cx-btn-outline"
              disabled={isActionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveOutcome}
              className="cx-btn cx-btn-teal"
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Recording...' : 'Record Outcome'}
            </button>
          </div>
        }
      >
        <div className="mb-3">
          <label htmlFor="outcome-status-select" className="cx-form-label">
            Hearing Procedural Outcome <span className="text-danger">*</span>
          </label>
          <select
            id="outcome-status-select"
            className="cx-select"
            value={outcomeStatus}
            onChange={(e) => setOutcomeStatus(e.target.value)}
          >
            <option value="Further Information Required">Further Information Required</option>
            <option value="Additional Hearing Required">Additional Hearing Required</option>
            <option value="Committee Recommendation Pending">Committee Recommendation Pending</option>
            <option value="Referred for Authorized Decision">Referred for Authorized Decision</option>
            <option value="Hearing Completed">Hearing Completed</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="outcome-notes-input" className="cx-form-label">
            Outcome Summary & Directions
          </label>
          <textarea
            id="outcome-notes-input"
            className="cx-input"
            rows={4}
            placeholder="Record post-hearing instructions or referrals to counseling..."
            value={outcomeNotes}
            onChange={(e) => setOutcomeNotes(e.target.value)}
          />
        </div>
      </Modal>
    </AnimatedPage>
  );
};

export default HearingCalendarPage;
