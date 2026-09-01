import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = '#2563EB', onClick }) => {
  return (
    <div
      className="card stats-card"
      onClick={onClick}
      style={{
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-subtle)';
        }
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: `${color}1A`, // 10% opacity
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginTop: '4px' }}>
          {title}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
