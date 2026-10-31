import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { qrService } from '../../services/qrService';
import {
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  FileText,
  Shield,
  Layers,
  Clock,
  ArrowRight
} from 'lucide-react';

export const QrScannerPage = () => {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [custodyAction, setCustodyAction] = useState('INSPECTED_BY_PROCTOR');
  const [custodyDetails, setCustodyDetails] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);

  const html5QrCodeRef = useRef(null);

  // Load available camera devices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof MediaStreamTrack !== 'undefined') {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Prefer back camera if available
            const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
            setSelectedCameraId(backCam ? backCam.id : devices[0].id);
          } else {
            setCameraError('No video cameras detected on this device. You may use manual token entry below.');
          }
        })
        .catch((err) => {
          setCameraError('Camera access unavailable or permission not yet granted. Use manual token input or grant permission.');
        });
    } else {
      setCameraError('Video camera hardware not available in current environment. Manual entry active.');
    }

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      }

      const cameraIdToUse = selectedCameraId || (cameras.length > 0 ? cameras[0].id : { facingMode: 'environment' });

      await html5QrCodeRef.current.start(
        cameraIdToUse,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleTokenScanned(decodedText);
        },
        (errorMessage) => {
          // Frame read callback - ignore noisy per-frame failures
        }
      );
      setScanning(true);
    } catch (err) {
      setScanning(false);
      setCameraError(err?.message || 'Failed to start video camera stream. Please check camera permissions.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        // ignore error on stop
      }
    }
    setScanning(false);
  };

  const handleTokenScanned = (token) => {
    stopScanner();
    processToken(token);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    processToken(manualToken.trim());
  };

  const processToken = async (token) => {
    setVerifying(true);
    setScanResult(null);
    setActionSuccess(null);

    const cleanToken = token.trim();

    try {
      if (cleanToken.startsWith('DIGI-STU-') || cleanToken.startsWith('STU-')) {
        const studentData = await qrService.verifyStudentQr(cleanToken);
        setScanResult({ type: 'STUDENT', rawToken: cleanToken, data: studentData });
      } else if (cleanToken.startsWith('CX-TRK-') || cleanToken.startsWith('CX-')) {
        const caseData = await qrService.verifyCaseQr(cleanToken);
        setScanResult({ type: 'CASE', rawToken: cleanToken, data: caseData });
      } else if (cleanToken.startsWith('EVD-CUST-') || cleanToken.startsWith('EVD-')) {
        const evidenceData = await qrService.verifyEvidenceCustody(cleanToken);
        setScanResult({ type: 'EVIDENCE', rawToken: cleanToken, data: evidenceData });
      } else {
        // Attempt student verification first as default fallback
        try {
          const studentData = await qrService.verifyStudentQr(cleanToken);
          if (studentData.valid) {
            setScanResult({ type: 'STUDENT', rawToken: cleanToken, data: studentData });
            return;
          }
        } catch (_) {}

        // Then attempt case verification
        try {
          const caseData = await qrService.verifyCaseQr(cleanToken);
          if (caseData.valid) {
            setScanResult({ type: 'CASE', rawToken: cleanToken, data: caseData });
            return;
          }
        } catch (_) {}

        // Generic unrecognized token
        setScanResult({
          type: 'UNKNOWN',
          rawToken: cleanToken,
          data: { valid: false, message: 'Unrecognized institutional QR token format.' },
        });
      }
    } catch (err) {
      setScanResult({
        type: 'ERROR',
        rawToken: cleanToken,
        data: { valid: false, message: err?.response?.data?.message || err.message || 'Verification failed.' },
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleAddCustodyAction = async (e) => {
    e.preventDefault();
    if (!scanResult?.rawToken) return;

    try {
      const updated = await qrService.recordEvidenceCustodyAction(scanResult.rawToken, {
        action: custodyAction,
        details: custodyDetails,
      });
      setScanResult({ type: 'EVIDENCE', rawToken: scanResult.rawToken, data: updated });
      setActionSuccess('Custody action logged and audit trail updated successfully!');
      setCustodyDetails('');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to record custody action.');
    }
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '1000px' }}>
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Institutional QR Scanner</h1>
        <p className="text-muted small mb-0">
          Scan Student Identity Cards, Case Tracking Dockets, and Evidence Custody Tokens with real webcam preview.
        </p>
      </div>

      <div className="row g-4">
        {/* Scanner View Column */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <span className="fw-semibold text-dark d-flex align-items-center gap-2">
                <Camera size={18} className="text-primary" /> Camera Scanner
              </span>
              {cameras.length > 1 && (
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    if (scanning) {
                      stopScanner().then(() => startScanner());
                    }
                  }}
                  disabled={scanning}
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Camera ${c.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="card-body p-4 text-center">
              {/* HTML5 QR Code Scanner Target Box */}
              <div
                id="qr-reader-container"
                className="bg-dark rounded overflow-hidden mx-auto mb-3"
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  minHeight: '280px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!scanning && (
                  <div className="text-white-50 p-4">
                    <Camera size={48} className="mb-2 opacity-50" />
                    <div>Camera preview is currently inactive.</div>
                    <div className="small text-muted mt-1">Click "Start Camera" to enable video scanner.</div>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="alert alert-warning small text-start py-2 d-flex align-items-center gap-2 mb-3">
                  <AlertTriangle size={16} />
                  <div>{cameraError}</div>
                </div>
              )}

              <div className="d-flex justify-content-center gap-2 mb-4">
                {!scanning ? (
                  <button className="btn btn-primary d-flex align-items-center gap-2" onClick={startScanner}>
                    <Camera size={16} /> Start Camera Scanner
                  </button>
                ) : (
                  <button className="btn btn-danger d-flex align-items-center gap-2" onClick={stopScanner}>
                    <CameraOff size={16} /> Stop Camera
                  </button>
                )}
              </div>

              <hr className="my-3 text-muted" />

              {/* Manual Token Fallback Form */}
              <form onSubmit={handleManualSubmit} className="text-start">
                <label className="form-label small fw-semibold text-muted">
                  Manual Token Fallback (If camera is unavailable):
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <Search size={16} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. DIGI-STU-..., CX-TRK-..., EVD-CUST-..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                  />
                  <button className="btn btn-outline-primary" type="submit" disabled={verifying || !manualToken.trim()}>
                    {verifying ? 'Verifying...' : 'Verify Token'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Verification Result Column */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white py-3 border-bottom">
              <span className="fw-semibold text-dark d-flex align-items-center gap-2">
                <Shield size={18} className="text-primary" /> Verification Result
              </span>
            </div>

            <div className="card-body p-4">
              {verifying && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <div className="text-muted small mt-2">Cryptographically verifying token with backend...</div>
                </div>
              )}

              {!verifying && !scanResult && (
                <div className="text-center py-5 text-muted">
                  <Layers size={48} className="mb-2 opacity-25" />
                  <div>No token scanned yet.</div>
                  <p className="small">Scan a QR code with the camera or enter a token manually.</p>
                </div>
              )}

              {!verifying && scanResult && (
                <div>
                  {/* Status Banner */}
                  <div
                    className={`alert d-flex align-items-start gap-2 ${
                      scanResult.data?.valid ? 'alert-success' : 'alert-danger'
                    }`}
                  >
                    {scanResult.data?.valid ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    <div>
                      <div className="fw-bold">
                        {scanResult.data?.valid ? 'Verification Successful' : 'Verification Rejected'}
                      </div>
                      <div className="small">{scanResult.data?.message}</div>
                    </div>
                  </div>

                  {/* STUDENT IDENTITY VIEW */}
                  {scanResult.type === 'STUDENT' && scanResult.data?.valid && (
                    <div className="card border bg-light p-3 rounded mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
                        <UserCheck size={18} className="text-primary" />
                        <span className="fw-bold">Student Record Details</span>
                      </div>
                      <div className="small mb-1">
                        <span className="text-muted">Full Name:</span> <strong>{scanResult.data.studentName}</strong>
                      </div>
                      <div className="small mb-1">
                        <span className="text-muted">Roll Number:</span> <code>{scanResult.data.rollNumber}</code>
                      </div>
                      <div className="small mb-1">
                        <span className="text-muted">Department:</span> {scanResult.data.department}
                      </div>
                      <div className="small mb-1">
                        <span className="text-muted">Academic Role:</span> {scanResult.data.role}
                      </div>
                      <div className="small">
                        <span className="text-muted">Account Status:</span>{' '}
                        <span className="badge bg-success">{scanResult.data.status}</span>
                      </div>
                    </div>
                  )}

                  {/* CASE DOCKET VIEW */}
                  {scanResult.type === 'CASE' && scanResult.data?.valid && (
                    <div className="card border bg-light p-3 rounded mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
                        <FileText size={18} className="text-primary" />
                        <span className="fw-bold">Case Docket Reference</span>
                      </div>
                      <div className="small mb-1">
                        <span className="text-muted">Case Number:</span> <code>{scanResult.data.caseNumber}</code>
                      </div>
                      <div className="small mb-1">
                        <span className="text-muted">Title:</span> {scanResult.data.title}
                      </div>
                      <div className="small mb-1">
                        <span className="text-muted">Category:</span> {scanResult.data.category}
                      </div>
                      <div className="small mb-1">
                        <span className="text-muted">Current Status:</span>{' '}
                        <span className="badge bg-primary">{scanResult.data.status}</span>
                      </div>
                      <div className="small">
                        <span className="text-muted">Confidential Docket:</span>{' '}
                        {scanResult.data.confidential ? 'Yes (Restricted)' : 'No'}
                      </div>
                    </div>
                  )}

                  {/* EVIDENCE CUSTODY VIEW */}
                  {scanResult.type === 'EVIDENCE' && scanResult.data?.valid && (
                    <div>
                      <div className="card border bg-light p-3 rounded mb-3">
                        <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
                          <Shield size={18} className="text-primary" />
                          <span className="fw-bold">Evidence Custody Docket</span>
                        </div>
                        <div className="small mb-1">
                          <span className="text-muted">Evidence Ref:</span> <code>{scanResult.data.evidenceReference}</code>
                        </div>
                        <div className="small mb-1">
                          <span className="text-muted">Associated Case:</span> {scanResult.data.caseNumber}
                        </div>
                        <div className="small mb-1">
                          <span className="text-muted">Item Name:</span> {scanResult.data.fileName}
                        </div>
                        <div className="small mb-1">
                          <span className="text-muted">Review State:</span>{' '}
                          <span className="badge bg-secondary">{scanResult.data.reviewStatus}</span>
                        </div>
                        <div className="small font-monospace text-truncate text-muted">
                          SHA256: {scanResult.data.sha256Checksum}
                        </div>
                      </div>

                      {/* Custody Trail */}
                      <div className="mb-3">
                        <div className="fw-semibold small text-muted mb-2">Chain-of-Custody Audit Trail:</div>
                        <div className="list-group list-group-flush border rounded small" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                          {scanResult.data.custodyTrail?.map((trail, idx) => (
                            <div key={idx} className="list-group-item p-2">
                              <div className="d-flex justify-content-between">
                                <strong className="text-primary">{trail.action}</strong>
                                <span className="text-muted small">{trail.actorRole}</span>
                              </div>
                              <div className="text-muted">{trail.details || 'Routine inspection / verification.'}</div>
                              <div className="text-muted" style={{ fontSize: '10px' }}>
                                by {trail.actorName} • {new Date(trail.timestamp).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Log Action Form */}
                      <form onSubmit={handleAddCustodyAction} className="card p-3 border">
                        <div className="fw-semibold small text-dark mb-2">Log Custody Transfer / Inspection:</div>
                        {actionSuccess && <div className="alert alert-success small py-1 mb-2">{actionSuccess}</div>}
                        <div className="mb-2">
                          <select
                            className="form-select form-select-sm"
                            value={custodyAction}
                            onChange={(e) => setCustodyAction(e.target.value)}
                          >
                            <option value="INSPECTED_BY_PROCTOR">Inspected by Proctor</option>
                            <option value="TRANSFERRED_TO_LAB">Transferred to Forensic Lab</option>
                            <option value="SEALED_IN_VAULT">Sealed in Evidence Vault</option>
                            <option value="PRESENTED_AT_HEARING">Presented at Hearing</option>
                            <option value="RETURNED_TO_OWNER">Returned to Lawful Owner</option>
                          </select>
                        </div>
                        <div className="mb-2">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Remarks (e.g. tamper seal #4092 applied)"
                            value={custodyDetails}
                            onChange={(e) => setCustodyDetails(e.target.value)}
                          />
                        </div>
                        <button type="submit" className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1">
                          Log Action <ArrowRight size={14} />
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="mt-3 text-muted small text-end">
                    Token: <span className="font-monospace">{scanResult.rawToken}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrScannerPage;
