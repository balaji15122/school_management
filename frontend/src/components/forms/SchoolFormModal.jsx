import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { schoolService } from '../../services/schoolService';
import { useToast } from '../common/Toast';
import { Building2, AlertCircle } from 'lucide-react';

const SchoolFormModal = ({ isOpen, onClose, onSchoolCreated }) => {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCode('');
      setPhone('');
      setContactEmail('');
      setAddress('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('School Name is required');
    if (!code.trim()) return setError('School Code is required');
    if (!contactEmail.trim()) return setError('Contact Email is required');

    setIsLoading(true);

    try {
      await schoolService.createSchool({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactPhone: phone.trim(),
        contactEmail: contactEmail.trim(),
        address: address.trim(),
      });
      showToast('School tenant created successfully!', 'success');
      onSchoolCreated?.();
      onClose();
    } catch (err) {
      setError(err.userMessage || 'Failed to create school. Ensure school code is unique.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register School Tenant"
      subtitle="Provision an isolated multi-tenant organization"
      maxWidth="480px"
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="school-form"
            className="btn btn-primary btn-sm"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create School'}
          </button>
        </>
      }
    >
      <div>
        {error && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error-text)',
              fontSize: '12.5px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} color="var(--color-error)" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form
          id="school-form"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div className="form-group">
            <label className="form-label">School Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cambridge International Academy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Code (Unique) *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CIA2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Email *</label>
            <input
              type="email"
              className="form-input"
              placeholder="contact@cambridgeacademy.edu"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Campus address, city, state"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SchoolFormModal;
