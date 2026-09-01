import React from 'react';
import { CheckCircle2, Clock, XCircle, FileEdit, Shield, User } from 'lucide-react';

const StatusBadge = ({ status, className = '' }) => {
  const norm = (status || '').toLowerCase();

  if (norm === 'verified' || norm === 'approved') {
    return (
      <span className={`badge badge-verified ${className}`}>
        <CheckCircle2 size={12} />
        Verified
      </span>
    );
  }

  if (norm === 'forwarded' || norm === 'pending') {
    return (
      <span className={`badge badge-forwarded ${className}`}>
        <Clock size={12} />
        {norm === 'forwarded' ? 'Forwarded' : 'Pending'}
      </span>
    );
  }

  if (norm === 'rejected') {
    return (
      <span className={`badge badge-rejected ${className}`}>
        <XCircle size={12} />
        Rejected
      </span>
    );
  }

  if (norm === 'draft') {
    return (
      <span className={`badge badge-draft ${className}`}>
        <FileEdit size={12} />
        Draft
      </span>
    );
  }

  if (norm === 'super_admin') {
    return (
      <span className={`badge badge-role ${className}`}>
        <Shield size={12} />
        Super Admin
      </span>
    );
  }

  if (norm === 'school_admin') {
    return (
      <span className={`badge badge-role ${className}`}>
        <User size={12} />
        School Admin
      </span>
    );
  }

  return (
    <span className={`badge badge-draft ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
