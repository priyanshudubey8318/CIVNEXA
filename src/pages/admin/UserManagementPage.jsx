import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  UserCheck,
  UserX,
  Mail,
  Building2,
  Shield,
  Edit2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';
import { ROLES } from '../../constants/roles';

export const UserManagementPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('FACULTY');
  const [formDepartment, setFormDepartment] = useState('Computer Science & Engineering');
  const [formDesignation, setFormDesignation] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');

  const loadUsers = () => {
    const list = adminService.getUsers({
      search: searchQuery,
      role: roleFilter,
      department: departmentFilter,
      status: statusFilter,
    });
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
  }, [searchQuery, roleFilter, departmentFilter, statusFilter]);

  const handleCreateUser = (e) => {
    e.preventDefault();
    try {
      adminService.createUser({
        name: formName,
        email: formEmail,
        role: formRole,
        department: formDepartment,
        designation: formDesignation,
        employeeId: formEmployeeId,
      });
      toast.success(`User ${formName} created successfully.`);
      setIsCreateModalOpen(false);
      setFormName('');
      setFormEmail('');
      setFormDesignation('');
      setFormEmployeeId('');
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to create user.');
    }
  };

  const handleEditUser = (e) => {
    e.preventDefault();
    try {
      adminService.updateUser(editingUser.id, {
        name: formName,
        email: formEmail,
        role: formRole,
        department: formDepartment,
        designation: formDesignation,
        employeeId: formEmployeeId,
      });
      toast.success('User updated successfully.');
      setIsEditModalOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update user.');
    }
  };

  const handleToggleStatus = (user) => {
    try {
      const updated = adminService.toggleUserStatus(user.id, currentUser);
      toast.success(`User ${user.name} is now ${updated.status}.`);
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Status toggle failed.');
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormDepartment(u.department);
    setFormDesignation(u.designation || '');
    setFormEmployeeId(u.employeeId || '');
    setIsEditModalOpen(true);
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="User Management & Institutional Accounts"
        subtitle="Manage faculty, student, proctorial, and administrative accounts with role-based access governance."
        breadcrumbs={[{ label: 'Administration' }, { label: 'User Directory' }]}
        badge={
          <span className="badge bg-light text-secondary border px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            User Directory
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => {
              setFormName('');
              setFormEmail('');
              setFormDesignation('');
              setFormEmployeeId('');
              setIsCreateModalOpen(true);
            }}
            className="cx-btn cx-btn-teal"
          >
            <UserPlus size={15} />
            <span>Create User</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="cx-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={14} className="text-secondary" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search user by name, email, roll number, or employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              {Object.keys(ROLES).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Mechanical Engineering">ME</option>
              <option value="Electronics & Communication">ECE</option>
              <option value="Civil Engineering">CE</option>
              <option value="Department of Management Studies">MGMT</option>
            </select>
          </div>

          <div className="col-6 col-md-1">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DEACTIVATED">Inactive</option>
            </select>
          </div>

          <div className="col-6 col-md-1 text-end">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('ALL');
                setDepartmentFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="btn btn-sm btn-outline-secondary w-100"
              title="Reset"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Users Ledger Table */}
      <div className="cx-card mb-4">
        <div className="cx-card-header d-flex justify-content-between align-items-center">
          <h2 className="h6 mb-0 fw-bold">Institutional Account Directory</h2>
          <span className="badge bg-light text-dark border">{users.length} Registered Accounts</span>
        </div>

        <div className="cx-card-body p-0">
          <div className="table-responsive">
            <table className="cx-table align-middle">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Institutional Role</th>
                  <th>Department & Unit</th>
                  <th>Official Email</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isActive = (u.status || 'ACTIVE') === 'ACTIVE';

                  return (
                    <tr key={u.id} className={!isActive ? 'opacity-75 bg-light' : ''}>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: '34px',
                              height: '34px',
                              backgroundColor: isActive ? 'var(--cx-teal-700)' : '#94A3B8',
                              fontSize: '0.75rem',
                              flexShrink: 0,
                            }}
                          >
                            {u.avatar || u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-dark small d-block">{u.name}</strong>
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                              ID: {u.employeeId || u.rollNo || u.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.72rem' }}>
                          {u.role}
                        </span>
                        <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                          {u.designation || u.title || 'Institutional Staff'}
                        </div>
                      </td>
                      <td>
                        <span className="small text-dark fw-medium">{u.department}</span>
                      </td>
                      <td>
                        <span className="small cx-font-mono text-muted">{u.email}</span>
                      </td>
                      <td>
                        <span className={`badge ${isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`} style={{ fontSize: '0.7rem' }}>
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="btn btn-sm btn-outline-secondary py-0.5 px-2"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <Edit2 size={11} className="me-1" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`btn btn-sm py-0.5 px-2 ${isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  {isCreateModalOpen ? 'Create New User' : 'Edit User Profile'}
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

              <form onSubmit={isCreateModalOpen ? handleCreateUser : handleEditUser}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Full Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Dr. Rajesh Kumar"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="cx-form-label fw-bold">Official University Email <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="e.g. rajesh.kumar@civnexa.edu"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="cx-form-label fw-bold">Role Assignment <span className="text-danger">*</span></label>
                      <select
                        className="form-select form-select-sm"
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                      >
                        {Object.keys(ROLES).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="cx-form-label fw-bold">Academic Department</label>
                      <select
                        className="form-select form-select-sm"
                        value={formDepartment}
                        onChange={(e) => setFormDepartment(e.target.value)}
                      >
                        <option value="Computer Science & Engineering">CSE</option>
                        <option value="Mechanical Engineering">ME</option>
                        <option value="Electronics & Communication">ECE</option>
                        <option value="Civil Engineering">CE</option>
                        <option value="Department of Management Studies">MGMT</option>
                        <option value="Student Affairs & Administration">General Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="cx-form-label fw-bold">Designation</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Associate Professor"
                        value={formDesignation}
                        onChange={(e) => setFormDesignation(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="cx-form-label fw-bold">Employee ID / Roll</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. EMP-4019"
                        value={formEmployeeId}
                        onChange={(e) => setFormEmployeeId(e.target.value)}
                      />
                    </div>
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
                    {isCreateModalOpen ? 'Create User' : 'Save Changes'}
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

export default UserManagementPage;
