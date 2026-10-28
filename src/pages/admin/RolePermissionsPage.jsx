import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  RotateCcw,
  Save,
  Lock,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import adminService, { DEMO_PERMISSIONS } from '../../services/adminService';
import { ROLES } from '../../constants/roles';

export const RolePermissionsPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [permissionsMatrix, setPermissionsMatrix] = useState({});
  const [selectedRole, setSelectedRole] = useState('DEAN');

  const loadMatrix = () => {
    const matrix = adminService.getRolePermissions();
    setPermissionsMatrix(matrix);
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  const handleToggle = (roleKey, permKey) => {
    try {
      const updated = adminService.toggleRolePermission(roleKey, permKey, currentUser);
      setPermissionsMatrix({ ...updated });
      toast.success(`Permission updated for ${roleKey}.`);
    } catch (err) {
      toast.error(err.message || 'Permission update blocked by governance policy.');
    }
  };

  const handleResetDefaults = () => {
    adminService.resetMockData();
    loadMatrix();
    toast.success('Permissions matrix reset to institutional defaults.');
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Role & Permission Matrix"
        subtitle="Configure feature permissions and access rules for each user role."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Role Permissions' }]}
        badge={
          <span className="badge bg-light text-secondary border px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            8 Roles Configured
          </span>
        }
        actions={
          <button
            type="button"
            onClick={handleResetDefaults}
            className="cx-btn cx-btn-outline"
          >
            <RotateCcw size={14} />
            <span>Restore Defaults</span>
          </button>
        }
      />

      {/* Role Selector Tabs for Quick Mobile & Tablet Review */}
      <div className="d-flex flex-wrap gap-1.5 mb-3">
        {Object.keys(ROLES).map((r) => {
          const count = (permissionsMatrix[r] || []).length;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={`btn btn-sm py-1.5 px-3 rounded-pill d-flex align-items-center gap-1.5 ${
                selectedRole === r ? 'btn-teal' : 'btn-outline-secondary'
              }`}
              style={{ fontSize: '0.75rem' }}
            >
              <Shield size={12} />
              <span>{r}</span>
              <span className={`badge ${selectedRole === r ? 'bg-white text-teal' : 'bg-secondary text-white'}`} style={{ fontSize: '0.65rem' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Comprehensive Role Permissions Matrix Table */}
      <div className="cx-card mb-4">
        <div className="cx-card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <ShieldCheck size={18} className="text-teal" />
            <h2 className="h6 mb-0 fw-bold">Role & Governance Permissions Matrix</h2>
          </div>
          <span className="badge bg-light text-dark border">Interactive Governance Matrix</span>
        </div>

        <div className="cx-card-body p-0">
          <div className="table-responsive">
            <table className="cx-table align-middle text-center" style={{ minWidth: '850px' }}>
              <thead>
                <tr className="text-start">
                  <th style={{ width: '280px' }}>Permission Capability</th>
                  {Object.keys(ROLES).map((r) => (
                    <th key={r} className="text-center" style={{ fontSize: '0.72rem' }}>
                      {r.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_PERMISSIONS.map((perm) => (
                  <tr key={perm.key} className="text-start">
                    <td>
                      <div>
                        <strong className="text-dark small d-block">{perm.label}</strong>
                        <span className="text-muted cx-font-mono" style={{ fontSize: '0.68rem' }}>
                          {perm.key} • {perm.category}
                        </span>
                      </div>
                    </td>

                    {Object.keys(ROLES).map((roleKey) => {
                      const isGranted = (permissionsMatrix[roleKey] || []).includes(perm.key);
                      const isLockedSuperAdmin =
                        roleKey === 'SUPER_ADMIN' &&
                        (perm.key === 'USER_MANAGE' || perm.key === 'SYSTEM_SETTINGS_MANAGE');

                      return (
                        <td key={roleKey} className="text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(roleKey, perm.key)}
                            disabled={isLockedSuperAdmin}
                            className={`btn btn-sm p-1 rounded-circle border-0 ${
                              isGranted ? 'text-teal' : 'text-muted opacity-50'
                            }`}
                            title={`${isGranted ? 'Revoke' : 'Grant'} ${perm.label} for ${roleKey}`}
                          >
                            {isLockedSuperAdmin ? (
                              <Lock size={16} className="text-secondary" />
                            ) : isGranted ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <XCircle size={18} />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default RolePermissionsPage;
