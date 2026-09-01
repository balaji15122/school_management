import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Phone,
  Mail,
  MapPin,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterSchool = () => {
  const { registerSchool, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();

  // Institution profile fields
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');

  // Admin user fields
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!schoolName.trim()) return setFormError('School Name is required');
    if (!schoolCode.trim()) return setFormError('School Code is required');
    if (!schoolEmail.trim()) return setFormError('School Contact Email is required');
    if (!adminName.trim()) return setFormError('Administrator Name is required');
    if (!adminEmail.trim()) return setFormError('Administrator Email is required');
    if (!adminPassword || adminPassword.length < 6) {
      return setFormError('Admin password must be at least 6 characters');
    }

    const payload = {
      schoolName: schoolName.trim(),
      schoolCode: schoolCode.trim().toUpperCase(),
      schoolContactEmail: schoolEmail.trim(),
      schoolContactPhone: schoolPhone.trim(),
      schoolAddress: schoolAddress.trim(),
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim(),
      adminPhone: adminPhone.trim(),
      adminPassword: adminPassword.trim(),
    };

    const res = await registerSchool(payload);
    if (res.success) {
      navigate('/admin/dashboard');
    }
  };

  const displayedError = formError || authError;

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '30px 16px',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '580px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Link
            to="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Register School Tenant
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Provision a new isolated school tenant with its designated school administrator
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {displayedError && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error-text)',
              fontSize: '13px',
              marginBottom: '18px',
              border: '1px solid rgba(220, 38, 38, 0.2)',
            }}
          >
            <AlertCircle size={16} color="var(--color-error)" style={{ flexShrink: 0 }} />
            <span>{displayedError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Section 1: Institution Profile */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Building2 size={18} color="var(--color-accent)" />
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                1. School Institution Profile
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">School Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cambridge International Academy"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">School Code (Unique) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CIA2026"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">School Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+1 555-0199"
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Official Contact Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="contact@cambridgeacademy.edu"
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Campus Address</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="100 Academy Way, Springfield"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: School Administrator Account */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <User size={18} color="var(--color-accent)" />
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                2. School Administrator Account
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Administrator Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Arthur Pendelton"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Admin Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="admin@cambridgeacademy.edu"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+1 555-0198"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Admin Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '36px' }}
                    placeholder="Create a strong password (min 6 chars)"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
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
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', height: '44px', fontSize: '14px' }}
          >
            {isLoading ? 'Creating Tenant & Account...' : 'Complete School Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterSchool;
