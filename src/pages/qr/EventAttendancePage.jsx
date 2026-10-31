import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { qrService } from '../../services/qrService';
import { useAuth } from '../../context/AuthContext';
import { Clock, Users, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const EventAttendancePage = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(60);

  // Student manual check-in state (if a student is viewing or testing)
  const [studentTokenInput, setStudentTokenInput] = useState('');
  const [checkInMsg, setCheckInMsg] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchLiveSession = async () => {
    try {
      const data = await qrService.getSessionChallenge(sessionCode);
      setSession(data);
      setSecondsLeft(data.secondsRemaining || 60);

      // Also fetch records
      const recs = await qrService.getSessionRecords(sessionCode);
      setRecords(recs);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch attendance session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSession();
    // Poll session challenge and records every 5 seconds to rotate challenge when expired
    const interval = setInterval(() => {
      fetchLiveSession();
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionCode]);

  // Local second countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualStudentCheckIn = async (e) => {
    e.preventDefault();
    if (!studentTokenInput.trim() || !session) return;

    setCheckingIn(true);
    setCheckInMsg(null);

    try {
      const resp = await qrService.checkInAttendance(sessionCode, studentTokenInput.trim());
      setCheckInMsg({ success: true, text: resp.message || 'Check-in recorded!' });
      setStudentTokenInput('');
      fetchLiveSession();
    } catch (err) {
      setCheckInMsg({ success: false, text: err?.response?.data?.message || 'Check-in failed.' });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCloseSession = async () => {
    if (!window.confirm('Are you sure you want to conclude this attendance session? No further check-ins will be permitted.')) {
      return;
    }
    try {
      await qrService.closeAttendanceSession(sessionCode);
      alert('Attendance session successfully concluded.');
      navigate(-1);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to close session.');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '1100px' }}>
      <button className="btn btn-link text-decoration-none text-muted mb-3 p-0 d-flex align-items-center gap-1" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <AlertTriangle size={18} />
          <div>{error}</div>
        </div>
      )}

      {session && (
        <div>
          {/* Header Banner */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-2">
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 className="h3 fw-bold mb-0">{session.title}</h1>
                <span className="badge bg-primary text-uppercase">{session.eventType}</span>
                <span className={`badge ${session.active ? 'bg-success' : 'bg-secondary'}`}>
                  {session.active ? 'Live Session Active' : 'Session Concluded'}
                </span>
              </div>
              <p className="text-muted small mb-0 mt-1">
                Session Code: <code className="fw-bold">{session.sessionCode}</code> • Created on {new Date(session.createdAt).toLocaleDateString()}
              </p>
            </div>

            {session.active && (
              <button className="btn btn-outline-danger btn-sm" onClick={handleCloseSession}>
                Conclude Session
              </button>
            )}
          </div>

          <div className="row g-4">
            {/* Dynamic Rotating QR Projector Box */}
            <div className="col-12 col-lg-6 text-center">
              <div className="card shadow-sm border-0 p-4 h-100" style={{ borderRadius: '16px' }}>
                <h5 className="fw-bold mb-1">Scan Live QR to Check-in</h5>
                <p className="text-muted small mb-3">
                  This QR code rotates every 60 seconds with a one-time cryptographic challenge to prevent proxy attendance.
                </p>

                <div
                  className="p-3 bg-white d-inline-block rounded shadow-sm border mx-auto mb-3"
                  style={{ width: '280px', height: '280px' }}
                >
                  <QRCodeSVG
                    value={session.activeChallenge || 'EXPIRED'}
                    size={254}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {/* Rotating Timer Display */}
                <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <Clock size={18} className={secondsLeft < 10 ? 'text-danger' : 'text-primary'} />
                  <span className="fw-bold font-monospace fs-5">
                    {secondsLeft}s
                  </span>
                  <span className="text-muted small">until code refreshes</span>
                </div>

                <div className="progress mx-auto" style={{ height: '6px', maxWidth: '300px' }}>
                  <div
                    className={`progress-bar ${secondsLeft < 15 ? 'bg-danger' : 'bg-primary'}`}
                    role="progressbar"
                    style={{ width: `${(secondsLeft / 60) * 100}%`, transition: 'width 1s linear' }}
                  ></div>
                </div>

                <div className="mt-3 text-muted small font-monospace">
                  Active Challenge: {session.activeChallenge}
                </div>
              </div>
            </div>

            {/* Attendance Live Log & Student Input */}
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                  <span className="fw-bold d-flex align-items-center gap-2">
                    <Users size={18} className="text-primary" /> Verified Attendees ({records.length})
                  </span>
                  <button className="btn btn-outline-secondary btn-sm" onClick={fetchLiveSession}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>

                <div className="card-body p-4">
                  {/* Student Check-In Form */}
                  <form onSubmit={handleManualStudentCheckIn} className="mb-4 p-3 bg-light rounded border">
                    <label className="form-label small fw-semibold text-muted">
                      Student Quick Check-in (Scan or paste challenge token):
                    </label>
                    {checkInMsg && (
                      <div className={`alert small py-1 mb-2 ${checkInMsg.success ? 'alert-success' : 'alert-danger'}`}>
                        {checkInMsg.text}
                      </div>
                    )}
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Challenge token (e.g. CHAL-...)"
                        value={studentTokenInput}
                        onChange={(e) => setStudentTokenInput(e.target.value)}
                        disabled={checkingIn}
                      />
                      <button className="btn btn-primary btn-sm" type="submit" disabled={checkingIn || !studentTokenInput.trim()}>
                        {checkingIn ? 'Submitting...' : 'Check In'}
                      </button>
                    </div>
                  </form>

                  {/* Attendance Records List */}
                  <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                    {records.length === 0 ? (
                      <div className="text-center py-4 text-muted small">
                        No students have checked in yet. Attendees will appear here in real-time as they scan.
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {records.map((rec) => (
                          <div key={rec.id} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-semibold text-dark">{rec.studentName}</div>
                              <div className="text-muted small">
                                Roll: <code>{rec.rollNumber || 'N/A'}</code> • {rec.department}
                              </div>
                            </div>
                            <div className="text-end">
                              <span className="badge bg-success-subtle text-success small">
                                <CheckCircle2 size={12} className="me-1 d-inline" /> Verified
                              </span>
                              <div className="text-muted" style={{ fontSize: '11px' }}>
                                {new Date(rec.checkedInAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAttendancePage;
