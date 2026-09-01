import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorStateView = ({
  message = 'An unexpected error occurred while fetching data.',
  onRetry,
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '36px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(220, 38, 38, 0.2)',
        backgroundColor: 'var(--color-error-bg)',
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          color: 'var(--color-error)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
        }}
      >
        <AlertCircle size={24} />
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-error-text)', marginBottom: '6px' }}>
        Failed to Load Data
      </h3>
      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: onRetry ? '18px' : 0 }}>
        {message}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorStateView;
