import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Loader from '../components/common/Loader';
import ErrorStateView from '../components/common/ErrorStateView';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { exportService } from '../services/exportService';
import { schoolService } from '../services/schoolService';
import { formatters } from '../utils/formatters';
import { SCHOOL_CLASSES } from '../utils/constants';
import {
  FileSpreadsheet,
  Download,
  FolderArchive,
  ImageIcon,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';

const ExportCenter = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = user?.isSuperAdmin;

  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Load schools for selection
  useEffect(() => {
    if (isSuperAdmin) {
      schoolService.getSchools().then((res) => {
        if (res?.success && Array.isArray(res?.data)) {
          setSchools(res.data);
          if (res.data.length > 0) {
            setSelectedSchoolId(res.data[0].id || res.data[0]._id);
          }
        }
      }).catch(() => {});
    } else if (user?.schoolId) {
      setSelectedSchoolId(user.schoolId);
    }
  }, [isSuperAdmin, user]);

  // Load export audit logs
  const fetchExportHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await exportService.getExportHistory();
      if (res?.success && Array.isArray(res?.data)) {
        setHistory(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchExportHistory();
  }, [fetchExportHistory]);

  // Master workbook export
  const handleExportAllMaster = async () => {
    setIsExporting(true);
    showToast('Generating All Schools Master Workbook (.XLSX)...', 'info');
    try {
      await exportService.exportAllSchools();
      showToast('Master Workbook (.XLSX) downloaded successfully!', 'success');
      fetchExportHistory();
    } catch (err) {
      showToast(err.userMessage || 'Failed to download Master Workbook', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Single school complete package
  const handleExportSchoolPackage = async () => {
    const targetId = selectedSchoolId || user?.schoolId;
    const currentSchool = schools.find((s) => (s.id || s._id) === targetId);
    const targetName = currentSchool?.name || user?.schoolName || 'School';

    setIsExporting(true);
    showToast(`Generating Complete Package (.ZIP) for ${targetName}...`, 'info');
    try {
      await exportService.exportSchoolPackage(targetId, targetName);
      showToast(`Package (.ZIP) downloaded for ${targetName}!`, 'success');
      fetchExportHistory();
    } catch (err) {
      showToast(err.userMessage || 'Failed to download package', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Single school excel only
  const handleExportSchoolExcel = async () => {
    const targetId = selectedSchoolId || user?.schoolId;
    const currentSchool = schools.find((s) => (s.id || s._id) === targetId);
    const targetName = currentSchool?.name || user?.schoolName || 'School';

    setIsExporting(true);
    showToast(`Downloading Excel (.XLSX) for ${targetName}...`, 'info');
    try {
      await exportService.exportSingleSchool(targetId, targetName);
      showToast(`Excel file downloaded for ${targetName}!`, 'success');
      fetchExportHistory();
    } catch (err) {
      showToast(err.userMessage || 'Failed to download Excel file', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Single school photos only
  const handleExportSchoolPhotos = async () => {
    const targetId = selectedSchoolId || user?.schoolId;
    const currentSchool = schools.find((s) => (s.id || s._id) === targetId);
    const targetName = currentSchool?.name || user?.schoolName || 'School';

    setIsExporting(true);
    showToast(`Generating Photos Archive for ${targetName}...`, 'info');
    try {
      await exportService.exportSchoolPhotos(targetId, targetName);
      showToast(`Photos archive downloaded for ${targetName}!`, 'success');
      fetchExportHistory();
    } catch (err) {
      showToast(err.userMessage || 'Failed to download photos archive', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Filtered export
  const handleExportFiltered = async () => {
    const params = {};
    if (selectedClass !== 'all') params.class = selectedClass;
    if (selectedStatus !== 'all') params.status = selectedStatus;

    setIsExporting(true);
    showToast('Generating Filtered Excel Export...', 'info');
    try {
      await exportService.exportFiltered(params);
      showToast('Filtered Excel (.XLSX) downloaded successfully!', 'success');
      fetchExportHistory();
    } catch (err) {
      showToast(err.userMessage || 'Failed to export filtered records', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppLayout title="Excel Export Center">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Master Multi-Sheet Card (Super Admin Only) */}
        {isSuperAdmin && (
          <div
            className="card"
            style={{
              padding: '22px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              borderLeft: '4px solid var(--color-accent)',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileSpreadsheet size={24} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  All Schools Master Workbook (.XLSX)
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#6366F1',
                  }}
                >
                  MULTI-SHEET
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '680px' }}>
                Generates a multi-sheet spreadsheet with an Overview & Summary KPI tab and dedicated, formatted worksheets for every registered school tenant.
              </p>

              <div style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleExportAllMaster}
                  disabled={isExporting}
                >
                  <Download size={14} />
                  <span>Download Master Excel (.XLSX)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scoped Exports Row (School Data Package + Custom Filtered) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px',
          }}
        >
          {/* Card 1: School Data & Photos Package */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FolderArchive size={18} color="var(--color-success)" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  School Data & Photos Package
                </h3>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-success-bg)',
                    color: 'var(--color-success-text)',
                  }}
                >
                  EXCEL + PHOTOS
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Exports an Excel sheet accompanied by student photos named by Admission Number for seamless physical and digital record correlation.
              </p>

              {/* School Tenant Dropdown (Super Admin) or Label */}
              {isSuperAdmin ? (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Select School Tenant
                  </label>
                  <select
                    className="form-select"
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                  >
                    {schools.map((s) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                  School: {user?.schoolName || 'Your School'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleExportSchoolPackage}
                disabled={isExporting || !selectedSchoolId}
              >
                <FolderArchive size={13} />
                <span>Export Package (.ZIP)</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportSchoolExcel}
                disabled={isExporting || !selectedSchoolId}
              >
                <FileSpreadsheet size={13} />
                <span>Excel (.XLSX)</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportSchoolPhotos}
                disabled={isExporting || !selectedSchoolId}
              >
                <ImageIcon size={13} />
                <span>Photos (.ZIP)</span>
              </button>
            </div>
          </div>

          {/* Card 2: Custom Filtered Export */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Filter size={18} color="var(--color-accent)" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Custom Filtered Export
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Generate tailored spreadsheets filtered specifically by class placement or verification status.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Class
                  </label>
                  <select
                    className="form-select"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    {SCHOOL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Status
                  </label>
                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="verified">Verified</option>
                    <option value="forwarded">Pending/Forwarded</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportFiltered}
                disabled={isExporting}
              >
                <Download size={13} />
                <span>Export Filtered .XLSX</span>
              </button>
            </div>
          </div>
        </div>

        {/* Audit History Log */}
        <div className="card" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Export Audit History
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Recorded export events with timestamps and file sizes
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchExportHistory}
              disabled={isLoadingHistory}
              title="Refresh logs"
            >
              <RefreshCw size={13} className={isLoadingHistory ? 'spinner' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingHistory ? (
            <Loader text="Loading audit records..." />
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
              No export operations recorded yet
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                    }}
                  >
                    <th style={{ padding: '10px 12px' }}>File Name</th>
                    <th style={{ padding: '10px 12px' }}>Type</th>
                    <th style={{ padding: '10px 12px' }}>Records</th>
                    <th style={{ padding: '10px 12px' }}>Size</th>
                    <th style={{ padding: '10px 12px' }}>Exported Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((log) => (
                    <tr
                      key={log.id || log._id}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={15} color="var(--color-accent)" />
                          <span>{log.fileName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-canvas)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {(log.exportType || 'single').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{log.recordCount || 0}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                        {formatters.formatBytes(log.fileSizeBytes)}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                        {formatters.formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ExportCenter;
