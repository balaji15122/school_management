import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Building2,
  Users,
  FileSpreadsheet,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../utils/constants';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.isSuperAdmin;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      title: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      title: 'Schools',
      path: '/admin/schools',
      icon: Building2,
      show: isSuperAdmin,
    },
    {
      title: isSuperAdmin ? 'All Students' : 'Student Upload',
      path: '/admin/students',
      icon: Users,
      show: true,
    },
    {
      title: 'Export Center',
      path: '/admin/export',
      icon: FileSpreadsheet,
      show: true,
    },
    {
      title: 'Users',
      path: '/admin/users',
      icon: ShieldCheck,
      show: isSuperAdmin,
    },
  ];

  return (
    <aside
      style={{
        width: '220px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        zIndex: 40,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '18px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-accent)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
            flexShrink: 0,
          }}
        >
          <GraduationCap size={20} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {APP_NAME}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isSuperAdmin ? 'Super Admin' : (user?.schoolName || 'School Portal')}
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)',
                  })}
                >
                  <Icon size={18} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                </NavLink>
              );
            })}
        </nav>
      </div>

      {/* Footer / Sign Out */}
      <div
        style={{
          padding: '10px 8px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--color-error)',
            transition: 'background-color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-error-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
