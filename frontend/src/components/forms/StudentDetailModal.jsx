import React, { useState } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatters } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import { useToast } from '../common/Toast';
import { Edit, Send, CheckCircle2, XCircle } from 'lucide-react';

const StudentDetailModal = ({
  isOpen,
  onClose,
  student,
  onEdit,
  onStatusUpdated,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = user?.isSuperAdmin;

  const [confirmForwardOpen, setConfirmForwardOpen] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!student) return null;

  const isDraft = (student.status || '').toLowerCase() === 'draft';
  const isVerified = (student.status || '').toLowerCase() === 'verified';
  const isRejected = (student.status || '').toLowerCase() === 'rejected';

  // Handle Forward to Super Admin (School Admin)
  const handleForward = async () => {
    setIsProcessing(true);
    try {
      await studentService.forwardStudents({ studentId: student.id || student._id });
      showToast(`Forwarded ${student.name} to Super Admin!`, 'success');
      setConfirmForwardOpen(false);
      onStatusUpdated?.();
      onClose();
    } catch (err) {
      showToast(err.userMessage || 'Failed to forward record', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Approve / Verify (Super Admin)
  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await studentService.updateStatus(student.id || student._id, {
        status: 'verified',
      });
      showToast(`Verified ${student.name} successfully!`, 'success');
      setConfirmApproveOpen(false);
      onStatusUpdated?.();
      onClose();
    } catch (err) {
      showToast(err.userMessage || 'Failed to verify student', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reject (Super Admin)
  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;

    setIsProcessing(true);
    try {
      await studentService.updateStatus(student.id || student._id, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });
      showToast(`Student record rejected`, 'info');
      setRejectModalOpen(false);
      onStatusUpdated?.();
      onClose();
    } catch (err) {
      showToast(err.userMessage || 'Failed to reject record', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={student.name}
        subtitle={`${student.schoolName || student.schoolId?.name || 'School'} • Admission No: ${student.admissionNumber}`}
        maxWidth="560px"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>

            {/* School Admin actions */}
            {!isSuperAdmin && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onClose();
                    onEdit?.(student);
                  }}
                >
                  <Edit size={14} />
                  Edit
                </button>
                {isDraft && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setConfirmForwardOpen(true)}
                  >
                    <Send size={14} />
                    Forward to Super Admin
                  </button>
                )}
              </>
            )}

            {/* Super Admin review actions */}
            {isSuperAdmin && (
              <>
                {!isRejected && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      setRejectionReason('');
                      setRejectModalOpen(true);
                    }}
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                )}
                {!isVerified && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => setConfirmApproveOpen(true)}
                  >
                    <CheckCircle2 size={14} />
                    Approve & Verify
                  </button>
                )}
              </>
            )}
          </div>
        }
      >
        <div>
          {/* Header Profile Summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                flexShrink: 0,
                border: '2px solid var(--border-color)',
              }}
            >
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                formatters.getInitials(student.name)
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {student.name}
                </h4>
                <StatusBadge status={student.status} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Class {student.class || student.studentClass}-{student.section} • Roll: {student.rollNumber}
              </p>
            </div>
          </div>

          {/* Section: 10 Uploaded Fields */}
          <div style={{ marginBottom: '20px' }}>
            <h5
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-accent)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Student Details (10 Uploaded Fields)
            </h5>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                backgroundColor: 'var(--bg-canvas)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <InfoRow label="1. Full Name" value={student.name} />
              <InfoRow label="2. Admission No" value={student.admissionNumber} isBadge />
              <InfoRow label="3. Roll Number" value={student.rollNumber} />
              <InfoRow label="4. Class" value={student.class || student.studentClass} />
              <InfoRow label="5. Section" value={`Section ${student.section}`} />
              <InfoRow label="6. Date of Birth" value={formatters.formatDate(student.dob)} />
              <InfoRow label="7. Gender" value={(student.gender || '').toUpperCase()} />
              <InfoRow label="8. Blood Group" value={student.bloodGroup || 'N/A'} />
              <InfoRow label="9. Academic Session" value={student.academicSession || '2026–27'} />
              <InfoRow
                label="10. Photo Name"
                value={`${student.admissionNumber}.jpg`}
              />
            </div>
          </div>

          {/* Section: Audit & Lifecycle Details */}
          <div>
            <h5
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-accent)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Audit & Lifecycle Details
            </h5>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12.5px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>School Tenant:</span>
                <span style={{ fontWeight: 500 }}>
                  {student.schoolName || student.schoolId?.name || 'School'} ({student.schoolCode || student.schoolId?.code || ''})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Submitted By:</span>
                <span style={{ fontWeight: 500 }}>
                  {student.submittedBy?.name || 'Staff'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Forwarded Date:</span>
                <span style={{ fontWeight: 500 }}>
                  {formatters.formatDateTime(student.forwardedAt || student.createdAt)}
                </span>
              </div>
              {student.verifiedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Verified Date:</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-success)' }}>
                    {formatters.formatDateTime(student.verifiedAt)}
                  </span>
                </div>
              )}
              {student.rejectionReason && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-error-bg)',
                    color: 'var(--color-error-text)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '11px', marginBottom: '2px' }}>
                    Rejection Reason:
                  </div>
                  <div>{student.rejectionReason}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Forward Dialog */}
      <ConfirmDialog
        isOpen={confirmForwardOpen}
        onClose={() => setConfirmForwardOpen(false)}
        onConfirm={handleForward}
        title="Forward to Super Admin"
        message={`Send student record for ${student.name} to Super Admin now for verification?`}
        confirmLabel="Forward Now"
        isLoading={isProcessing}
      />

      {/* Confirm Approve Dialog */}
      <ConfirmDialog
        isOpen={confirmApproveOpen}
        onClose={() => setConfirmApproveOpen(false)}
        onConfirm={handleApprove}
        title="Approve & Verify Student"
        message={`Approve and verify ${student.name}'s admission records?`}
        confirmLabel="Approve"
        isLoading={isProcessing}
      />

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Student Record"
        maxWidth="440px"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isProcessing}
            >
              {isProcessing ? 'Rejecting...' : 'Reject Record'}
            </button>
          </>
        }
      >
        <form onSubmit={handleReject}>
          <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>
            Provide Reason for Rejection *
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="e.g. Roll number / Admission number collision, incomplete documents..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            autoFocus
          />
        </form>
      </Modal>
    </>
  );
};

const InfoRow = ({ label, value, isBadge = false }) => (
  <div>
    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
      {label}
    </div>
    <div
      style={{
        fontSize: '13px',
        fontWeight: isBadge ? 700 : 500,
        color: isBadge ? 'var(--color-accent)' : 'var(--text-primary)',
      }}
    >
      {value || 'N/A'}
    </div>
  </div>
);

export default StudentDetailModal;
