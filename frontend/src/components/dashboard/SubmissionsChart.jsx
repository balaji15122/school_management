import React, { useState } from 'react';
import { formatters } from '../../utils/formatters';

const SubmissionsChart = ({ dailySubmissions = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!dailySubmissions || dailySubmissions.length === 0) {
    return (
      <div
        style={{
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}
      >
        No submission trends available
      </div>
    );
  }

  // Calculate scaling
  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxCount = Math.max(
    5,
    ...dailySubmissions.map((d) => (typeof d.count === 'number' ? d.count : 0))
  );

  const getX = (index) => {
    if (dailySubmissions.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (dailySubmissions.length - 1)) * innerWidth;
  };

  const getY = (count) => {
    return padding.top + innerHeight - (count / maxCount) * innerHeight;
  };

  // Generate points string for polyline
  const points = dailySubmissions
    .map((d, i) => `${getX(i)},${getY(d.count || 0)}`)
    .join(' ');

  // Generate area path string
  const areaPath = `M ${getX(0)},${padding.top + innerHeight} ${points
    .split(' ')
    .map((p) => `L ${p}`)
    .join(' ')} L ${getX(dailySubmissions.length - 1)},${padding.top + innerHeight} Z`;

  // Generate Y-axis grid ticks
  const yTicks = [0, Math.round(maxCount / 2), maxCount];

  // Generate X-axis tick indices (every 5-6 points)
  const step = Math.max(1, Math.floor(dailySubmissions.length / 5));
  const xIndices = [];
  for (let i = 0; i < dailySubmissions.length; i += step) {
    xIndices.push(i);
  }
  if (!xIndices.includes(dailySubmissions.length - 1)) {
    xIndices.push(dailySubmissions.length - 1);
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Gridlines & Y-Axis labels */}
        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--border-color)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Filled Gradient Area */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Primary Line */}
        <polyline
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Interactive Data Points */}
        {dailySubmissions.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.count || 0);
          const isHovered = hoveredPoint?.index === i;

          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 5 : 3}
                fill={isHovered ? 'var(--color-accent)' : 'var(--bg-surface)'}
                stroke="var(--color-accent)"
                strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                onMouseEnter={() => setHoveredPoint({ ...d, index: i, cx, cy })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        })}

        {/* X-Axis labels */}
        {xIndices.map((idx) => {
          const item = dailySubmissions[idx];
          if (!item) return null;
          const x = getX(idx);
          let label = item.date;
          try {
            const dt = new Date(item.date);
            label = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } catch {
            // keep raw
          }

          return (
            <text
              key={idx}
              x={x}
              y={height - 8}
              textAnchor="middle"
              fontSize="9.5"
              fill="var(--text-muted)"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredPoint && (
        <div
          className="card animate-fade-in"
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.cx / width) * 100}%`,
            top: `${(hoveredPoint.cy / height) * 100}%`,
            transform: 'translate(-50%, -125%)',
            pointerEvents: 'none',
            padding: '4px 8px',
            backgroundColor: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-dropdown)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <div style={{ color: 'var(--text-primary)' }}>
            {hoveredPoint.count} student{hoveredPoint.count === 1 ? '' : 's'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>
            {formatters.formatDate(hoveredPoint.date)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsChart;
