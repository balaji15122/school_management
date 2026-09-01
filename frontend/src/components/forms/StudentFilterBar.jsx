import React from 'react';
import { Search, X, FilterX } from 'lucide-react';
import {
  SCHOOL_CLASSES,
  CLASS_SECTIONS,
  ACADEMIC_SESSIONS,
} from '../../utils/constants';

const StudentFilterBar = ({
  search,
  onSearchChange,
  schoolId,
  onSchoolChange,
  studentClass,
  onClassChange,
  section,
  onSectionChange,
  academicSession,
  onSessionChange,
  status,
  onStatusChange,
  onResetFilters,
  schools = [],
  isSuperAdmin = false,
}) => {
  const statusChips = [
    { label: 'All', value: 'all' },
    { label: 'Forwarded to Super Admin', value: 'forwarded' },
    { label: 'Verified / Approved', value: 'verified' },
    { label: 'Draft Records', value: 'draft' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
      {/* Top Filter Controls Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '32px', paddingRight: search ? '30px' : '10px', height: '38px' }}
            placeholder="Search name, adm no, roll..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                padding: '2px',
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Super Admin School Filter */}
        {isSuperAdmin && (
          <select
            className="form-select"
            style={{ width: '170px', height: '38px' }}
            value={schoolId || 'all'}
            onChange={(e) => onSchoolChange(e.target.value)}
          >
            <option value="all">All Schools</option>
            {schools.map((s) => (
              <option key={s.id || s._id} value={s.id || s._id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {/* Academic Session Filter */}
        <select
          className="form-select"
          style={{ width: '130px', height: '38px' }}
          value={academicSession || 'all'}
          onChange={(e) => onSessionChange(e.target.value)}
        >
          <option value="all">All Sessions</option>
          {ACADEMIC_SESSIONS.map((ses) => (
            <option key={ses} value={ses}>
              {ses}
            </option>
          ))}
        </select>

        {/* Class Filter */}
        <select
          className="form-select"
          style={{ width: '125px', height: '38px' }}
          value={studentClass || 'all'}
          onChange={(e) => onClassChange(e.target.value)}
        >
          <option value="all">All Classes</option>
          {SCHOOL_CLASSES.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>

        {/* Section Filter */}
        <select
          className="form-select"
          style={{ width: '105px', height: '38px' }}
          value={section || 'all'}
          onChange={(e) => onSectionChange(e.target.value)}
        >
          <option value="all">All Sec</option>
          {CLASS_SECTIONS.map((sec) => (
            <option key={sec} value={sec}>
              Sec {sec}
            </option>
          ))}
        </select>

        {/* Reset Filters Button */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ height: '38px' }}
          onClick={onResetFilters}
          title="Reset all filters"
        >
          <FilterX size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Status Filter Chips Row */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingTop: '12px',
          marginTop: '12px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {statusChips.map((chip) => {
          const isSelected = (status || 'all') === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onStatusChange(chip.value)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11.5px',
                fontWeight: isSelected ? 600 : 500,
                backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--bg-canvas)',
                color: isSelected ? 'var(--color-accent)' : 'var(--text-secondary)',
                border: isSelected
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--border-color)',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudentFilterBar;
