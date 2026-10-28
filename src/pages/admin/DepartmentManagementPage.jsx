import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  User,
  RotateCcw,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';

export const DepartmentManagementPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formHod, setFormHod] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const loadDepartments = () => {
    const list = adminService.getDepartments({ search: searchQuery });
    setDepartments(list);
  };

  useEffect(() => {
    loadDepartments();
  }, [searchQuery]);

  const handleCreateDept = (e) => {
    e.preventDefault();
    try {
      adminService.createDepartment({
        name: formName,
        code: formCode,
        hodName: formHod,
        contactEmail: formEmail,
        description: formDescription,
      });
      toast.success(`Department ${formName} (${formCode}) registered.`);
      setIsCreateModalOpen(false);
      setFormName('');
      setFormCode('');
      setFormHod('');
      setFormEmail('');
      setFormDescription('');
      loadDepartments();
    } catch (err) {
      toast.error(err.message || 'Failed to create department.');
    }
  };

  const handleEditDept = (e) => {
    e.preventDefault();
    try {
      adminService.updateDepartment(editingDept.id, {
        name: formName,
        hodName: formHod,
        contactEmail: formEmail,
        description: formDescription,
      });
      toast.success('Department updated successfully.');
      setIsEditModalOpen(false);
      setEditingDept(null);
      loadDepartments();
    } catch (err) {
      toast.error(err.message || 'Failed to update department.');
    }
  };

  const handleDeleteDept = (dept) => {
    try {
      adminService.deleteDepartment(dept.id);
      toast.success(`Department ${dept.name} removed.`);
      loadDepartments();
    } catch (err) {
      toast.error(err.message || 'Deletion prohibited.');
    }
  };

  const openEditModal = (d) => {
    setEditingDept(d);
    setFormName(d.name);
    setFormCode(d.code);
    setFormHod(d.hodName);
    setFormEmail(d.contactEmail);
    setFormDescription(d.description || '');
    setIsEditModalOpen(true);
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Department & Academic Unit Registry"
        subtitle="Manage academic departments and department heads."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Departments' }]}
        badge={
          <span className="badge bg-light text-secondary border px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            {departments.length} Departments
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => {
              setFormName('');
              setFormCode('');
              setFormHod('');
              setFormEmail('');
              setFormDescription('');
              setIsCreateModalOpen(true);
            }}
            className="cx-btn cx-btn-teal"
          >
            <Plus size={15} />
            <span>Add Academic Department</span>
          </button>
        }
      />

      {/* Search and Count Bar */}
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
                placeholder="Search department by name, unit code, or HOD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4 text-md-end text-muted small">
            <span>Showing {departments.length} academic departments</span>
          </div>
        </div>
      </div>

      {/* Departments Table */}
      <div className="cx-card mb-4">
        <div className="cx-card-header d-flex justify-content-between align-items-center">
          <h2 className="h6 mb-0 fw-bold">Academic Units & Department Directory</h2>
          <span className="badge bg-light text-dark border">Jurisdictional Units</span>
        </div>

        <div className="cx-card-body p-0">
          <div className="table-responsive">
            <table className="cx-table align-middle">
              <thead>
                <tr>
                  <th>Unit Code</th>
                  <th>Department Name</th>
                  <th>Head of Department</th>
                  <th>Official Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary fw-bold px-2.5 py-1 cx-font-mono" style={{ fontSize: '0.78rem' }}>
                        {d.code}
                      </span>
                    </td>
                    <td>
                      <strong className="text-dark small d-block">{d.name}</strong>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {d.description || 'Undergraduate & Postgraduate Faculty'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1.5">
                        <User size={13} className="text-teal" />
                        <span className="small text-dark fw-medium">{d.hodName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1.5">
                        <Mail size={13} className="text-secondary" />
                        <span className="small cx-font-mono text-muted">{d.contactEmail}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success" style={{ fontSize: '0.7rem' }}>
                        {d.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(d)}
                          className="btn btn-sm btn-outline-secondary py-0.5 px-2"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <Edit2 size={11} className="me-1" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDept(d)}
                          className="btn btn-sm btn-outline-danger py-0.5 px-2"
                          style={{ fontSize: '0.75rem' }}
                          title="Delete Department (Checked against active cases)"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Department Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  {isCreateModalOpen ? 'Register New Academic Department' : 'Edit Academic Department'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                />
              </div>

              <form onSubmit={isCreateModalOpen ? handleCreateDept : handleEditDept}>
                <div className="modal-body p-4">
                  <div className="row g-2 mb-3">
                    <div className="col-8">
                      <label className="cx-form-label fw-bold">Department Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Chemical Engineering"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-4">
                      <label className="cx-form-label fw-bold">Unit Code <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. CHE"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                        disabled={!isCreateModalOpen}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Head of Department (HOD)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Prof. Arvind Joshi"
                      value={formHod}
                      onChange={(e) => setFormHod(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Official Department Email</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="e.g. hod.che@civnexa.edu"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="cx-form-label fw-bold">Unit Description & Scope</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Brief summary of department academic programs..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-4">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-teal btn-sm">
                    {isCreateModalOpen ? 'Create Department' : 'Save Changes'}
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

export default DepartmentManagementPage;
