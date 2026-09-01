import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StudentFilterBar from '../components/forms/StudentFilterBar';
import StudentFormModal from '../components/forms/StudentFormModal';
import StudentDetailModal from '../components/forms/StudentDetailModal';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';
import EmptyStateView from '../components/common/EmptyStateView';
import ErrorStateView from '../components/common/ErrorStateView';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { studentService } from '../services/studentService';
import { schoolService } from '../services/schoolService';
import { exportService } from '../services/exportService';
import { formatters } from '../utils/formatters';
import {
  Plus,
  Send,
  Download,
  FolderArchive,
  Eye,
  Edit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const StudentsManagement = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSuperAdmin = user?.isSuperAdmin;

  // Filter state
  const [search, setSearch] = useState('');
  const [schoolId, setSchoolId] = useState(searchParams.get('schoolId') || 'all');
  const [studentClass, setStudentClass] = useState('all');
  const [section, setSection] = useState('all');
  const [academicSession, setAcademicSession] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Data state
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [inspectStudent, setInspectStudent] = useState(null);
  const [confirmForwardAllOpen, setConfirmForwardAllOpen] = useState(false);
  const [selectSchoolExportOpen, setSelectSchoolExportOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load schools for Super Admin selector
  useEffect(() => {
    if (isSuperAdmin) {
      schoolService.getSchools().then((res) => {
        if (res?.success && Array.isArray(res?.data)) {
          setSchools(res.data);
        }
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  // Sync schoolId with URL query params
  useEffect(() => {
    const urlSchoolId = searchParams.get('schoolId');
    if (urlSchoolId && urlSchoolId !== schoolId) {
      setSchoolId(urlSchoolId);
    }
  }, [searchParams]);

  // Query Params builder
  const buildQueryParams = useCallback(() => {
    const params = { page, limit };
    if (search.trim()) params.search = search.trim();
    if (schoolId && schoolId !== 'all') params.schoolId = schoolId;
    if (studentClass && studentClass !== 'all') params.class = studentClass;
    if (section && section !== 'all') params.section = section;
    if (academicSession && academicSession !== 'all') params.academicSession = academicSession;
    if (status && status !== 'all') params.status = status;
    return params;
  }, [page, limit, search, schoolId, studentClass, section, academicSession, status]);

  // Fetch student records
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = buildQueryParams();
      const res = await studentService.getStudents(params);
      if (res?.success && Array.isArray(res?.data)) {
        setStudents(res.data);
        const pag = res.pagination || {};
        setTotal(pag.total || res.data.length);
        setTotalPages(pag.totalPages || 1);
      } else {
        throw new Error(res?.message || 'Failed to fetch students');
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load student records');
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Row selection helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map((s) => s.id || s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setSearch('');
    setSchoolId('all');
    setStudentClass('all');
    setSection('all');
    setAcademicSession('all');
    setStatus('all');
    setPage(1);
    setSearchParams({});
  };

  // Forward All Drafts (School Admin)
  const handleForwardAllDrafts = async () => {
    setIsProcessing(true);
    try {
      await studentService.forwardStudents();
      showToast('All draft student records forwarded to Super Admin!', 'success');
      setConfirmForwardAllOpen(false);
      fetchStudents();
    } catch (err) {
      showToast(err.userMessage || 'Failed to forward drafts', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Forward Selected (School Admin)
  const handleBulkForward = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      await studentService.forwardStudents({ ids: selectedIds });
      showToast(`Forwarded ${selectedIds.length} student records to Super Admin!`, 'success');
      setSelectedIds([]);
      fetchStudents();
    } catch (err) {
      showToast(err.userMessage || 'Failed to forward records', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Verify (Super Admin)
  const handleBulkVerify = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      await studentService.bulkUpdateStatus({ ids: selectedIds, status: 'verified' });
      showToast(`Verified ${selectedIds.length} student records!`, 'success');
      setSelectedIds([]);
      fetchStudents();
    } catch (err) {
      showToast(err.userMessage || 'Failed to verify records', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Reject (Super Admin)
  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      await studentService.bulkUpdateStatus({ ids: selectedIds, status: 'rejected' });
      showToast(`Rejected ${selectedIds.length} student records`, 'info');
      setSelectedIds([]);
      fetchStudents();
    } catch (err) {
      showToast(err.userMessage || 'Failed to reject records', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export triggers
  const handleExportPackage = async () => {
    if (isSuperAdmin) {
      if (schoolId && schoolId !== 'all') {
        const currentSchool = schools.find((s) => (s.id || s._id) === schoolId);
        const name = currentSchool?.name || 'School';
        showToast(`Generating Complete Package for ${name}...`, 'info');
        await exportService.exportSchoolPackage(schoolId, name, buildQueryParams());
        showToast(`Package downloaded for ${name}!`, 'success');
      } else {
        setSelectSchoolExportOpen(true);
      }
    } else {
      const currentSchoolId = user?.schoolId;
      const currentSchoolName = user?.schoolName || 'School';
      showToast(`Generating Complete Package for ${currentSchoolName}...`, 'info');
      await exportService.exportSchoolPackage(currentSchoolId, currentSchoolName, buildQueryParams());
      showToast(`Package downloaded for ${currentSchoolName}!`, 'success');
    }
  };

  const handleExportFiltered = async () => {
    showToast('Generating Filtered Excel Export...', 'info');
    try {
      await exportService.exportFiltered(buildQueryParams());
      showToast('Filtered Excel file downloaded!', 'success');
    } catch (err) {
      showToast(err.userMessage || 'Failed to export filtered records', 'error');
    }
  };

  const allSelected = students.length > 0 && students.every((s) => selectedIds.includes(s.id || s._id));

  return (
    <AppLayout
      title={isSuperAdmin ? 'All School Students' : 'Student Admissions & Upload'}
      actions={
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!isSuperAdmin && (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setStudentToEdit(null);
                  setIsFormModalOpen(true);
                }}
              >
                <Plus size={15} />
                <span>Add Student</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmForwardAllOpen(true)}
              >
                <Send size={14} />
                <span>Forward All Drafts</span>
              </button>
            </>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportPackage}
            title="Export ZIP data package with Excel and student photos"
          >
            <FolderArchive size={14} color="var(--color-accent)" />
            <span>Export Package (.ZIP)</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportFiltered}
            title="Export filtered student records as styled Excel file"
          >
            <Download size={14} />
            <span>Export .XLSX</span>
          </button>
        </div>
      }
    >
      {/* Filter Bar */}
      <StudentFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        schoolId={schoolId}
        onSchoolChange={(v) => { setSchoolId(v); setPage(1); }}
        studentClass={studentClass}
        onClassChange={(v) => { setStudentClass(v); setPage(1); }}
        section={section}
        onSectionChange={(v) => { setSection(v); setPage(1); }}
        academicSession={academicSession}
        onSessionChange={(v) => { setAcademicSession(v); setPage(1); }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        onResetFilters={handleResetFilters}
        schools={schools}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Bulk Selection Bar */}
      {selectedIds.length > 0 && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '10px 16px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(37, 99, 235, 0.4)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {selectedIds.length} student record{selectedIds.length === 1 ? '' : 's'} selected
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isSuperAdmin ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleBulkForward}
                disabled={isProcessing}
              >
                <Send size={13} />
                <span>Forward Selected to Super Admin</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={handleBulkVerify}
                  disabled={isProcessing}
                >
                  <CheckCircle2 size={13} />
                  <span>Verify</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleBulkReject}
                  disabled={isProcessing}
                >
                  <span>Reject</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              style={{
                color: 'var(--text-muted)',
                padding: '4px',
                display: 'flex',
                borderRadius: 'var(--radius-sm)',
              }}
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Student Records List / Table */}
      {isLoading ? (
        <Loader fullPage text="Loading students..." />
      ) : error ? (
        <ErrorStateView message={error} onRetry={fetchStudents} />
      ) : students.length === 0 ? (
        <EmptyStateView
          title="No Students Found"
          message={
            isSuperAdmin
              ? 'No student records match the active filter criteria.'
              : 'No students uploaded yet. Click "+ Add Student" to upload your first student record!'
          }
          actionLabel={isSuperAdmin ? 'Reset Filters' : '+ Add Student'}
          onAction={() => {
            if (isSuperAdmin) {
              handleResetFilters();
            } else {
              setStudentToEdit(null);
              setIsFormModalOpen(true);
            }
          }}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Scrollable Data Table Container */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <th style={{ padding: '12px 14px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '12px 14px' }}>Student Full Name</th>
                  <th style={{ padding: '12px 14px' }}>Student ID / Adm No</th>
                  <th style={{ padding: '12px 14px' }}>Roll No</th>
                  {isSuperAdmin && <th style={{ padding: '12px 14px' }}>School Tenant</th>}
                  <th style={{ padding: '12px 14px' }}>Class & Sec</th>
                  <th style={{ padding: '12px 14px' }}>Academic Session</th>
                  <th style={{ padding: '12px 14px' }}>Blood Group</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const id = student.id || student._id;
                  const isSelected = selectedIds.includes(id);
                  const isDraft = (student.status || '').toLowerCase() === 'draft';
                  const isVerified = (student.status || '').toLowerCase() === 'verified';

                  return (
                    <tr
                      key={id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isSelected
                          ? 'var(--color-accent-subtle)'
                          : 'transparent',
                        transition: 'background-color var(--transition-fast)',
                        fontSize: '13px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '12px 14px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* Photo Avatar & Name */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--color-accent-subtle)',
                              color: 'var(--color-accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                              overflow: 'hidden',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            {student.photoUrl ? (
                              <img
                                src={student.photoUrl}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              formatters.getInitials(student.name)
                            )}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {student.name}
                          </span>
                        </div>
                      </td>

                      {/* Admission Number */}
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--color-accent)' }}>
                        {student.admissionNumber}
                      </td>

                      {/* Roll Number */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {student.rollNumber}
                      </td>

                      {/* School Tenant (if Super Admin) */}
                      {isSuperAdmin && (
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                          {student.schoolName || student.schoolId?.name || 'School'}
                        </td>
                      )}

                      {/* Class & Section */}
                      <td style={{ padding: '12px 14px' }}>
                        {student.class || student.studentClass}-{student.section}
                      </td>

                      {/* Academic Session */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                        {student.academicSession || '2026–27'}
                      </td>

                      {/* Blood Group */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                        {student.bloodGroup || 'N/A'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge status={student.status} />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setInspectStudent(student)}
                            style={{ padding: '5px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}
                            title="View Full Details"
                          >
                            <Eye size={16} />
                          </button>

                          {!isSuperAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setStudentToEdit(student);
                                  setIsFormModalOpen(true);
                                }}
                                style={{ padding: '5px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}
                                title="Edit Student"
                              >
                                <Edit size={16} />
                              </button>

                              {isDraft && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await studentService.forwardStudents({ studentId: id });
                                    showToast(`Forwarded ${student.name} to Super Admin!`, 'success');
                                    fetchStudents();
                                  }}
                                  style={{ padding: '5px', borderRadius: 'var(--radius-sm)', color: 'var(--color-accent)' }}
                                  title="Forward to Super Admin"
                                >
                                  <Send size={16} />
                                </button>
                              )}
                            </>
                          )}

                          {isSuperAdmin && !isVerified && (
                            <button
                              type="button"
                              onClick={async () => {
                                await studentService.updateStatus(id, { status: 'verified' });
                                showToast(`Verified ${student.name}!`, 'success');
                                fetchStudents();
                              }}
                              style={{ padding: '5px', borderRadius: 'var(--radius-sm)', color: 'var(--color-success)' }}
                              title="Approve & Verify"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {students.length} of {total} records
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', padding: '0 4px' }}>
                {page} / {totalPages}
              </span>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Form Modal */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setStudentToEdit(null);
        }}
        studentToEdit={studentToEdit}
        onStudentSaved={fetchStudents}
      />

      {/* Inspect Student Detail Modal */}
      <StudentDetailModal
        isOpen={!!inspectStudent}
        student={inspectStudent}
        onClose={() => setInspectStudent(null)}
        onEdit={(s) => {
          setStudentToEdit(s);
          setIsFormModalOpen(true);
        }}
        onStatusUpdated={fetchStudents}
      />

      {/* Forward All Drafts Confirmation */}
      <ConfirmDialog
        isOpen={confirmForwardAllOpen}
        onClose={() => setConfirmForwardAllOpen(false)}
        onConfirm={handleForwardAllDrafts}
        title="Forward All Drafts"
        message="Send all unsubmitted draft student records to Super Admin for verification?"
        confirmLabel="Forward All"
        isLoading={isProcessing}
      />

      {/* Super Admin School Selection Modal for ZIP Package */}
      <Modal
        isOpen={selectSchoolExportOpen}
        onClose={() => setSelectSchoolExportOpen(false)}
        title="Select School for ZIP Package Export"
        subtitle="Choose a specific school to download its complete data package (Excel + Student Photos)"
        maxWidth="480px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {schools.map((s) => (
            <div
              key={s.id || s._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {s.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Code: {s.code} • {s.stats?.totalStudents || 0} Students
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  setSelectSchoolExportOpen(false);
                  showToast(`Downloading Complete Package for ${s.name}...`, 'info');
                  await exportService.exportSchoolPackage(s.id || s._id, s.name, buildQueryParams());
                  showToast(`Package downloaded for ${s.name}!`, 'success');
                }}
              >
                <Download size={13} />
                <span>Download .ZIP</span>
              </button>
            </div>
          ))}
        </div>
      </Modal>
    </AppLayout>
  );
};

export default StudentsManagement;
