import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 28, text = 'Loading...', fullPage = false }) => {
  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <Loader2 size={size} className="spinner" style={{ color: 'var(--color-accent)' }} />
        {text && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{text}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <Loader2 size={size} className="spinner" style={{ color: 'currentColor' }} />
      {text && <span style={{ fontSize: '13px' }}>{text}</span>}
    </div>
  );
};

export default Loader;
