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
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../utils/constants';

export const MobileDrawer = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.isSuperAdmin;

  if (!isOpen) return null;

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const navItems = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, show: true },
    { title: 'Schools', path: '/admin/schools', icon: Building2, show: isSuperAdmin },
    { title: isSuperAdmin ? 'All Students' : 'Student Upload', path: '/admin/students', icon: Users, show: true },
    { title: 'Export Center', path: '/admin/export', icon: FileSpreadsheet, show: true },
    { title: 'Users', path: '/admin/users', icon: ShieldCheck, show: isSuperAdmin },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 100,
        display: 'flex',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '280px',
          height: '100%',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-dropdown)',
          animation: 'fadeIn 0.15s ease forwards',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-accent)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap size={18} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {APP_NAME}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {user?.name}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', padding: '4px' }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links */}
        <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13.5px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                      textDecoration: 'none',
                    })}
                  >
                    <Icon size={18} />
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
          </nav>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-error)',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const BottomNavBar = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin;

  const quickNav = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    ifAdmin(isSuperAdmin, { title: 'Schools', path: '/admin/schools', icon: Building2 }),
    { title: 'Students', path: '/admin/students', icon: Users },
    { title: 'Export', path: '/admin/export', icon: FileSpreadsheet },
    ifAdmin(isSuperAdmin, { title: 'Users', path: '/admin/users', icon: ShieldCheck }),
  ].filter(Boolean);

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 30,
      }}
    >
      {quickNav.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '6px 8px',
              fontSize: '10px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-accent)' : 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)',
            })}
          >
            <Icon size={18} />
            <span>{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

function ifAdmin(condition, obj) {
  return condition ? obj : null;
}
