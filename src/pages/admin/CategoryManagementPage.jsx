import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  Lock,
  Eye,
  ShieldAlert,
  Info,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';

export const CategoryManagementPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAllowsAnonymous, setFormAllowsAnonymous] = useState(false);
  const [formSubcategories, setFormSubcategories] = useState('');

  const loadCategories = () => {
    const list = adminService.getCategories();
    setCategories(list);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = (e) => {
    e.preventDefault();
    try {
      const subs = formSubcategories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      adminService.createCategory({
        key: formKey,
        label: formLabel,
        description: formDescription,
        allowsAnonymous: formAllowsAnonymous,
        subcategories: subs,
      });

      toast.success(`Category "${formLabel}" configured.`);
      setIsCreateModalOpen(false);
      setFormKey('');
      setFormLabel('');
      setFormDescription('');
      setFormAllowsAnonymous(false);
      setFormSubcategories('');
      loadCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to create category.');
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (c.key === 'ALL') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.label.toLowerCase().includes(q) ||
      c.key.toLowerCase().includes(q) ||
      (c.subcategories || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <AnimatedPage>
      <PageHeader
        title="Manage Categories"
        subtitle="Configure incident categories and anonymous submission allowances."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Categories' }]}
        badge={
          <span className="badge bg-light text-secondary border px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            {categories.length} Categories
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => {
              setFormKey('');
              setFormLabel('');
              setFormDescription('');
              setFormAllowsAnonymous(false);
              setFormSubcategories('');
              setIsCreateModalOpen(true);
            }}
            className="cx-btn cx-btn-teal"
          >
            <Plus size={15} />
            <span>Create Incident Category</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="cx-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-8">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={14} className="text-secondary" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search categories or subcategories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4 text-md-end text-muted small">
            <span>Showing {filteredCategories.length} active classifications</span>
          </div>
        </div>
      </div>

      {/* Categories Ledger Table */}
      <div className="cx-card mb-4">
        <div className="cx-card-header d-flex justify-content-between align-items-center">
          <h2 className="h6 mb-0 fw-bold">Configured Incident Intake Taxonomies</h2>
          <span className="badge bg-light text-dark border">Institutional Taxonomies</span>
        </div>

        <div className="cx-card-body p-0">
          <div className="table-responsive">
            <table className="cx-table align-middle">
              <thead>
                <tr>
                  <th>Category Code</th>
                  <th>Classification Name</th>
                  <th>Anonymity / Whistleblower Policy</th>
                  <th>Configured Subcategories</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.key}>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary fw-bold cx-font-mono" style={{ fontSize: '0.75rem' }}>
                        {cat.key}
                      </span>
                    </td>
                    <td>
                      <strong className="text-dark small d-block">{cat.label}</strong>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {cat.description || 'Standard institutional case classification'}
                      </span>
                    </td>
                    <td>
                      {cat.allowsAnonymous ? (
                        <span className="badge bg-teal-subtle text-teal border border-teal-subtle px-2 py-1" style={{ fontSize: '0.7rem' }}>
                          <Lock size={10} className="me-1 d-inline" />
                          <span>Anonymous Submissions Permitted</span>
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted border px-2 py-1" style={{ fontSize: '0.7rem' }}>
                          Identity Verification Mandatory
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '340px' }}>
                        {(cat.subcategories || []).map((sub, i) => (
                          <span key={i} className="badge bg-light text-dark border p-1" style={{ fontSize: '0.68rem' }}>
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success" style={{ fontSize: '0.7rem' }}>
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Category Modal */}
      {isCreateModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">Create Case Category</h5>
                <button type="button" className="btn-close" onClick={() => setIsCreateModalOpen(false)} />
              </div>

              <form onSubmit={handleCreateCategory}>
                <div className="modal-body p-4">
                  <div className="row g-2 mb-3">
                    <div className="col-8">
                      <label className="cx-form-label fw-bold">Category Title <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Cyber Harassment & IT Infraction"
                        value={formLabel}
                        onChange={(e) => {
                          setFormLabel(e.target.value);
                          if (!formKey) {
                            setFormKey(e.target.value.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase());
                          }
                        }}
                        required
                      />
                    </div>
                    <div className="col-4">
                      <label className="cx-form-label fw-bold">Internal Key <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. CYBER_MISCONDUCT"
                        value={formKey}
                        onChange={(e) => setFormKey(e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Subcategories (Comma separated)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Account compromise, Phishing, Online defamation"
                      value={formSubcategories}
                      onChange={(e) => setFormSubcategories(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="allowAnonCheck"
                        className="form-check-input"
                        checked={formAllowsAnonymous}
                        onChange={(e) => setFormAllowsAnonymous(e.target.checked)}
                      />
                      <label htmlFor="allowAnonCheck" className="form-check-label small text-dark fw-semibold">
                        Enable Anonymous Submissions & Whistleblower Protection for this Category
                      </label>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="cx-form-label fw-bold">Intake Policy Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Guidelines and statutory threshold details..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-4">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-teal btn-sm">
                    Configure Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
};

export default CategoryManagementPage;
