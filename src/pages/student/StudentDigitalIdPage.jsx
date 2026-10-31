import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { qrService } from '../../services/qrService';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, User, Building2, Hash, AlertTriangle, CheckCircle, Copy, Check, RefreshCw } from 'lucide-react';

export const StudentDigitalIdPage = () => {
  const { user } = useAuth();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchCard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await qrService.getStudentCard();
      setCard(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load digital student ID card.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, []);

  const handleCopyToken = () => {
    if (card?.qrToken) {
      navigator.clipboard.writeText(card.qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Student Digital ID...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '850px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Student Digital Identity Card</h1>
          <p className="text-muted small mb-0">Official institutional identity credential with cryptographic QR verification.</p>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          onClick={fetchCard}
        >
          <RefreshCw size={14} /> Refresh Card
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <AlertTriangle size={18} />
          <div>{error}</div>
        </div>
      )}

      {card && (
        <div className="card shadow-sm border-0 overflow-hidden mb-4" style={{ borderRadius: '16px' }}>
          {/* Card Header with Institutional Branding */}
          <div
            className="p-4 text-white position-relative"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderBottom: '3px solid #3b82f6'
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <ShieldCheck size={24} className="text-primary" />
                  <span className="fw-bold fs-5 tracking-wide">CIVNEXA INSTITUTION</span>
                </div>
                <div className="text-white-50 small text-uppercase">Digital Scholar Credential • Authorized Student ID</div>
              </div>
              <span className={`badge ${card.status === 'ACTIVE' ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2 rounded-pill`}>
                {card.status}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="card-body p-4 p-md-5">
            <div className="row g-4 align-items-center">
              {/* QR Code Column */}
              <div className="col-12 col-md-5 text-center border-end-md">
                <div
                  className="p-3 bg-white d-inline-block rounded shadow-sm border"
                  style={{ width: '220px', height: '220px' }}
                >
                  <QRCodeSVG
                    value={card.qrToken || 'INVALID'}
                    size={194}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="mt-2 text-muted small">
                  Opaque Token Ref: <span className="font-monospace fw-bold">{card.userReference}</span>
                </div>
                <button
                  className="btn btn-light btn-sm mt-2 border text-muted"
                  onClick={handleCopyToken}
                  title="Copy QR identifier"
                >
                  {copied ? (
                    <span className="text-success d-flex align-items-center gap-1">
                      <Check size={14} /> Copied to Clipboard
                    </span>
                  ) : (
                    <span className="d-flex align-items-center gap-1">
                      <Copy size={14} /> Copy Token Code
                    </span>
                  )}
                </button>
              </div>

              {/* Student Details Column */}
              <div className="col-12 col-md-7 ps-md-4">
                <h3 className="fw-bold mb-1 text-dark">{card.fullName}</h3>
                <p className="text-muted small mb-3">Enrolled Academic Scholar</p>

                <div className="list-group list-group-flush small">
                  <div className="list-group-item px-0 py-2 d-flex align-items-center gap-2 border-0">
                    <Hash size={16} className="text-muted" />
                    <span className="text-muted" style={{ width: '130px' }}>Roll / ID Number:</span>
                    <span className="fw-semibold font-monospace">{card.rollNumber || 'N/A'}</span>
                  </div>
                  <div className="list-group-item px-0 py-2 d-flex align-items-center gap-2 border-0">
                    <Building2 size={16} className="text-muted" />
                    <span className="text-muted" style={{ width: '130px' }}>Department:</span>
                    <span className="fw-semibold">{card.department || 'General Sciences'}</span>
                  </div>
                  <div className="list-group-item px-0 py-2 d-flex align-items-center gap-2 border-0">
                    <User size={16} className="text-muted" />
                    <span className="text-muted" style={{ width: '130px' }}>Status Verification:</span>
                    <span className="badge bg-success-subtle text-success px-2 py-1">
                      <CheckCircle size={12} className="me-1 d-inline" /> Verified Active
                    </span>
                  </div>
                  <div className="list-group-item px-0 py-2 d-flex align-items-center gap-2 border-0">
                    <ShieldCheck size={16} className="text-muted" />
                    <span className="text-muted" style={{ width: '130px' }}>Credential State:</span>
                    <span className="text-muted">
                      {card.revoked ? <span className="text-danger fw-bold">REVOKED</span> : 'Active & Valid'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-light rounded text-muted small border">
                  <strong>Notice:</strong> Present this screen to campus security gates, proctorial hearings, exam halls, and dynamic attendance scanners. Screen captures without active live token verification may be rejected.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDigitalIdPage;
