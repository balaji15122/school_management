import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Building,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../utils/constants';

const Login = () => {
  const { login, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('super_admin');
  const [email, setEmail] = useState('admin@platform.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const fillDemoCredentials = (role) => {
    setSelectedRole(role);
    setFormError('');
    if (role === 'super_admin') {
      setEmail('admin@platform.com');
      setPassword('admin123');
    } else {
      setEmail('admin@greenwood.edu');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setFormError('Password is required');
      return;
    }

    const result = await login(email.trim(), password);
    if (result.success) {
      navigate('/admin/dashboard');
    }
  };

  const displayedError = formError || authError;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-accent)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              marginBottom: '14px',
            }}
          >
            <GraduationCap size={28} />
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
            }}
          >
            {APP_NAME}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Super Admin & School Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          {/* 1-Tap Quick Role Tabs */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              Select Login Role (1-Tap Demo Fill)
            </label>
            <div
              style={{
                display: 'flex',
                padding: '3px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                gap: '3px',
              }}
            >
              <button
                type="button"
                onClick={() => fillDemoCredentials('super_admin')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: selectedRole === 'super_admin' ? 600 : 500,
                  backgroundColor:
                    selectedRole === 'super_admin' ? 'var(--bg-surface)' : 'transparent',
                  color:
                    selectedRole === 'super_admin'
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                  boxShadow:
                    selectedRole === 'super_admin' ? 'var(--shadow-subtle)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('school_admin')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: selectedRole === 'school_admin' ? 600 : 500,
                  backgroundColor:
                    selectedRole === 'school_admin' ? 'var(--bg-surface)' : 'transparent',
                  color:
                    selectedRole === 'school_admin'
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                  boxShadow:
                    selectedRole === 'school_admin' ? 'var(--shadow-subtle)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                School Login
              </button>
            </div>
          </div>

          {/* Error Message */}
          {displayedError && (
            <div
              className="animate-fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-error-bg)',
                color: 'var(--color-error-text)',
                fontSize: '12.5px',
                marginBottom: '16px',
                border: '1px solid rgba(220, 38, 38, 0.2)',
              }}
            >
              <AlertCircle size={16} color="var(--color-error)" style={{ flexShrink: 0 }} />
              <span>{displayedError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '36px', paddingRight: '36px' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    padding: '4px',
                    display: 'flex',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ width: '100%', height: '42px', marginTop: '6px' }}
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom School Registration Link */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link
            to="/register-school"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-accent)',
            }}
          >
            <Building size={16} />
            <span>Register New School Tenant</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
