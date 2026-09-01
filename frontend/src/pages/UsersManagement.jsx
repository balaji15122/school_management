import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import StatusBadge from '../components/common/StatusBadge';
import Loader from '../components/common/Loader';
import EmptyStateView from '../components/common/EmptyStateView';
import ErrorStateView from '../components/common/ErrorStateView';
import { userService } from '../services/userService';
import { useToast } from '../components/common/Toast';
import { formatters } from '../utils/formatters';
import { Users, ShieldCheck, RefreshCw } from 'lucide-react';

const UsersManagement = () => {
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await userService.getUsers();
      if (res?.success && Array.isArray(res?.data)) {
        setUsers(res.data);
      } else {
        throw new Error(res?.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load user accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    const id = user.id || user._id;
    setTogglingId(id);
    try {
      const res = await userService.toggleUserStatus(id);
      showToast(res?.message || 'User status updated successfully', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.userMessage || 'Failed to update user status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (selectedRole !== 'all' && u.role !== selectedRole) return false;
    return true;
  });

  return (
    <AppLayout title="Users & Permissions">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Role Filter Chips Bar */}
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '6px' }}>
              Filter by Role:
            </span>
            <button
              type="button"
              onClick={() => setSelectedRole('all')}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: selectedRole === 'all' ? 600 : 500,
                backgroundColor: selectedRole === 'all' ? 'var(--color-accent-subtle)' : 'var(--bg-canvas)',
                color: selectedRole === 'all' ? 'var(--color-accent)' : 'var(--text-secondary)',
                border: selectedRole === 'all' ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              All ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('super_admin')}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: selectedRole === 'super_admin' ? 600 : 500,
                backgroundColor: selectedRole === 'super_admin' ? 'var(--color-accent-subtle)' : 'var(--bg-canvas)',
                color: selectedRole === 'super_admin' ? 'var(--color-accent)' : 'var(--text-secondary)',
                border: selectedRole === 'super_admin' ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              Super Admins
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('school_admin')}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: selectedRole === 'school_admin' ? 600 : 500,
                backgroundColor: selectedRole === 'school_admin' ? 'var(--color-accent-subtle)' : 'var(--bg-canvas)',
                color: selectedRole === 'school_admin' ? 'var(--color-accent)' : 'var(--text-secondary)',
                border: selectedRole === 'school_admin' ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              School Admins
            </button>
          </div>
        </div>

        {/* Users Content */}
        {isLoading ? (
          <Loader fullPage text="Loading user accounts..." />
        ) : error ? (
          <ErrorStateView message={error} onRetry={fetchUsers} />
        ) : filteredUsers.length === 0 ? (
          <EmptyStateView
            title="No Users Found"
            message="No user accounts match the selected role filter."
          />
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    <th style={{ padding: '12px 16px' }}>User</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>Role</th>
                    <th style={{ padding: '12px 16px' }}>School Tenant</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const id = u.id || u._id;
                    const isToggling = togglingId === id;
                    const isActive = u.isActive ?? true;

                    return (
                      <tr
                        key={id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background-color var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--color-accent-subtle)',
                                color: 'var(--color-accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              {formatters.getInitials(u.name)}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {u.name}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {u.email}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <StatusBadge status={u.role} />
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {u.schoolName || u.schoolId?.name || (u.role === 'super_admin' ? 'All Schools' : 'N/A')}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: isActive ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                              color: isActive ? 'var(--color-success-text)' : 'var(--color-error-text)',
                            }}
                          >
                            {isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => handleToggleStatus(u)}
                            disabled={isToggling}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11.5px',
                              color: isActive ? 'var(--color-error)' : 'var(--color-success)',
                            }}
                          >
                            {isToggling ? 'Updating...' : isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default UsersManagement;
