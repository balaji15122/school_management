import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import SchoolFormModal from '../components/forms/SchoolFormModal';
import Loader from '../components/common/Loader';
import EmptyStateView from '../components/common/EmptyStateView';
import ErrorStateView from '../components/common/ErrorStateView';
import { schoolService } from '../services/schoolService';
import { exportService } from '../services/exportService';
import { useToast } from '../components/common/Toast';
import {
  Building2,
  Plus,
  Search,
  X,
  Users,
  Download,
  FolderArchive,
  Mail,
} from 'lucide-react';

const SchoolsManagement = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await schoolService.getSchools();
      if (res?.success && Array.isArray(res?.data)) {
        setSchools(res.data);
      } else {
        throw new Error(res?.message || 'Failed to fetch schools');
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to fetch registered schools');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // Filter schools by search query
  const filteredSchools = schools.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.code || '').toLowerCase().includes(q) ||
      (s.contactEmail || '').toLowerCase().includes(q)
    );
  });

  const handleExportZip = async (school) => {
    setExportingId(school.id || school._id);
    showToast(`Downloading Complete Package (.ZIP) for ${school.name}...`, 'info');
    try {
      await exportService.exportSchoolPackage(school.id || school._id, school.name);
      showToast(`Package downloaded for ${school.name}!`, 'success');
    } catch (err) {
      showToast(err.userMessage || 'Failed to download ZIP package', 'error');
    } finally {
      setExportingId(null);
    }
  };

  const handleExportExcel = async (school) => {
    setExportingId(school.id || school._id);
    showToast(`Downloading Excel (.XLSX) for ${school.name}...`, 'info');
    try {
      await exportService.exportSingleSchool(school.id || school._id, school.name);
      showToast(`Excel file downloaded for ${school.name}!`, 'success');
    } catch (err) {
      showToast(err.userMessage || 'Failed to download Excel file', 'error');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <AppLayout
      title="Registered Schools"
      actions={
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={15} />
          <span>Add School</span>
        </button>
      }
    >
      {/* Search Toolbar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '18px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
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
            placeholder="Search by school name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
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
      </div>

      {/* Main Content */}
      {isLoading ? (
        <Loader fullPage text="Loading registered schools..." />
      ) : error ? (
        <ErrorStateView message={error} onRetry={fetchSchools} />
      ) : filteredSchools.length === 0 ? (
        <EmptyStateView
          title={search ? 'No Matching Schools' : 'No Schools Registered'}
          message={
            search
              ? 'No registered schools match your search term.'
              : 'There are no schools registered on the platform yet.'
          }
          actionLabel="Add First School"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredSchools.map((school) => {
            const stats = school.stats || { totalStudents: 0, verified: 0, pending: 0 };
            const isDownloading = exportingId === (school.id || school._id);

            return (
              <div
                key={school.id || school._id}
                className="card"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-accent-subtle)',
                      color: 'var(--color-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Building2 size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {school.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--color-accent)',
                          backgroundColor: 'var(--bg-canvas)',
                          border: '1px solid var(--border-color)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {school.code}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '3px',
                      }}
                    >
                      {school.contactEmail || 'No email provided'}
                    </p>
                  </div>
                </div>

                {/* Stats Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-canvas)',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {stats.totalStudents || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Total</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success-text)' }}>
                      {stats.verified || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Verified</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-warning-text)' }}>
                      {stats.pending || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Pending</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-text btn-sm"
                    onClick={() => navigate(`/admin/students?schoolId=${school.id || school._id}`)}
                  >
                    <Users size={14} />
                    <span>Students</span>
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExportZip(school)}
                      disabled={isDownloading}
                      title="Download complete data package with photos (.ZIP)"
                    >
                      <FolderArchive size={13} color="var(--color-accent)" />
                      <span>.ZIP</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExportExcel(school)}
                      disabled={isDownloading}
                      title="Download styled Excel spreadsheet (.XLSX)"
                    >
                      <Download size={13} />
                      <span>.XLSX</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add School Modal */}
      <SchoolFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSchoolCreated={fetchSchools}
      />
    </AppLayout>
  );
};

export default SchoolsManagement;
