import React from 'react';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import { FileText, Download, ExternalLink, ShieldCheck, BookmarkCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const PoliciesPage = () => {
  const toast = useToast();

  const policies = [
    {
      id: 'POL-01',
      title: 'University Student Code of Conduct & Civic Standards',
      version: 'v4.2 (Updated Aug 2026)',
      category: 'General Conduct',
      summary: 'Governs academic honesty, personal integrity, campus property stewardship, and harassment prohibitions.',
      effectiveDate: 'Aug 1, 2026',
    },
    {
      id: 'POL-02',
      title: 'Comprehensive Anti-Ragging Framework & Mandatory Disciplinary Guidelines',
      version: 'v3.0 (Statutory Supreme Court Compliance)',
      category: 'Anti-Ragging',
      summary: 'Strict zero-tolerance guidelines, whistleblower protection, and immediate suspension mandates.',
      effectiveDate: 'Jul 15, 2026',
    },
    {
      id: 'POL-03',
      title: 'Examination Ethics, Invigilation Protocols & Electronic Device Regulations',
      version: 'v5.1 (Academic Senate Approved)',
      category: 'Examinations',
      summary: 'Standard operating procedures for invigilators, unfair means inquiries, and electronic confiscation protocols.',
      effectiveDate: 'Sep 1, 2026',
    },
    {
      id: 'POL-04',
      title: 'Hostel Residency, Gate Regulations & Guest Code',
      version: 'v2.4 (Chief Warden Council)',
      category: 'Residence & Housing',
      summary: 'Curfew rules, biometric entry regulations, visitor logging, and residential grievance channels.',
      effectiveDate: 'Jul 20, 2026',
    },
  ];

  return (
    <AnimatedPage>
      <PageHeader
        title="Institutional Policies & Conduct Standards"
        subtitle="Official statutory regulations, academic honesty frameworks, and proctorial rules."
        breadcrumbs={[{ label: 'Policies' }, { label: 'Repository' }]}
        actions={
          <button
            type="button"
            onClick={() => toast.info('Policy repository synchronized with University Academic Council.')}
            className="cx-btn cx-btn-outline"
          >
            <Download size={15} />
            <span>Download All Handbooks</span>
          </button>
        }
      />

      <div className="row g-3">
        {policies.map((pol) => (
          <div key={pol.id} className="col-12 col-md-6">
            <div className="cx-card p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-light text-primary border">{pol.category}</span>
                  <span className="cx-font-mono text-muted small">{pol.id}</span>
                </div>
                <h3 className="h6 fw-bold text-dark mb-1">{pol.title}</h3>
                <div className="text-muted small mb-2">{pol.version}</div>
                <p className="small text-muted mb-3" style={{ lineHeight: 1.5 }}>
                  {pol.summary}
                </p>
              </div>

              <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                <span className="small text-muted">Effective: {pol.effectiveDate}</span>
                <button
                  type="button"
                  onClick={() => toast.info(`Viewing official document for ${pol.id}`)}
                  className="cx-btn cx-btn-outline cx-btn-sm"
                >
                  <FileText size={13} />
                  <span>View Policy</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AnimatedPage>
  );
};

export default PoliciesPage;
