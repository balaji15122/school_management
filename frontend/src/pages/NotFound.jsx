import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg-canvas)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-accent-subtle)',
          color: 'var(--color-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <HelpCircle size={32} />
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
        404 — Page Not Found
      </h1>
      <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '24px' }}>
        The page you are looking for does not exist or you might not have the required role permissions to access it.
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => navigate('/admin/dashboard')}
      >
        <ArrowLeft size={16} />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};

export default NotFound;
