import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import {
  SCHOOL_CLASSES,
  CLASS_SECTIONS,
  GENDERS,
  BLOOD_GROUPS,
  ACADEMIC_SESSIONS,
  SAMPLE_AVATARS,
  STORAGE_KEYS,
} from '../../utils/constants';
import { studentService } from '../../services/studentService';
import { useToast } from '../common/Toast';
import { Upload, Image as ImageIcon, CheckCircle2, AlertCircle, Save, Send } from 'lucide-react';

const StudentFormModal = ({
  isOpen,
  onClose,
  studentToEdit,
  onStudentSaved,
}) => {
  const { showToast } = useToast();
  const isEditing = !!studentToEdit;

  // Form State (10 Fields)
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_AVATARS[0]);
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [studentClass, setStudentClass] = useState('Grade 10');
  const [section, setSection] = useState('A');
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('2010-01-01');
  const [gender, setGender] = useState('male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [academicSession, setAcademicSession] = useState('2026–27');

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset or Populate fields on Open
  useEffect(() => {
    if (!isOpen) return;

    if (studentToEdit) {
      setName(studentToEdit.name || '');
      setPhotoUrl(studentToEdit.photoUrl || SAMPLE_AVATARS[0]);
      setAdmissionNumber(studentToEdit.admissionNumber || '');
      setStudentClass(studentToEdit.class || studentToEdit.studentClass || 'Grade 10');
      setSection(studentToEdit.section || 'A');
      setRollNumber(studentToEdit.rollNumber || '');
      setDob(
        studentToEdit.dob
          ? new Date(studentToEdit.dob).toISOString().split('T')[0]
          : '2010-01-01'
      );
      setGender((studentToEdit.gender || 'male').toLowerCase());
      setBloodGroup(studentToEdit.bloodGroup || 'O+');
      setAcademicSession(studentToEdit.academicSession || '2026–27');
      setUploadedFileName('');
      setUploadSuccessMsg('');
      setErrorMessage('');
    } else {
      // Check if draft exists
      const savedDraft = localStorage.getItem(STORAGE_KEYS.STUDENT_FORM_DRAFT);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setName(draft.name || '');
          setPhotoUrl(draft.photoUrl || SAMPLE_AVATARS[0]);
          setAdmissionNumber(draft.admissionNumber || '');
          setStudentClass(draft.class || 'Grade 10');
          setSection(draft.section || 'A');
          setRollNumber(draft.rollNumber || '');
          setDob(draft.dob || '2010-01-01');
          setGender(draft.gender || 'male');
          setBloodGroup(draft.bloodGroup || 'O+');
          setAcademicSession(draft.academicSession || '2026–27');
        } catch {
          // ignore error
        }
      } else {
        setName('');
        setPhotoUrl(SAMPLE_AVATARS[0]);
        setAdmissionNumber('');
        setStudentClass('Grade 10');
        setSection('A');
        setRollNumber('');
        setDob('2010-01-01');
        setGender('male');
        setBloodGroup('O+');
        setAcademicSession('2026–27');
      }
      setUploadedFileName('');
      setUploadSuccessMsg('');
      setErrorMessage('');
    }
  }, [isOpen, studentToEdit]);

  // Handle Photo File Upload
  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Selected photo exceeds 5MB size limit');
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMessage('');
    setUploadSuccessMsg('');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      try {
        const res = await studentService.uploadPhoto({
          imageBase64: base64Data,
          fileName: file.name,
          admissionNumber: admissionNumber.trim() || null,
        });

        if (res.success && res.data) {
          setPhotoUrl(res.data.photoUrl || base64Data);
          setUploadedFileName(res.data.fileName || file.name);
          setUploadSuccessMsg(`Photo uploaded & linked to: ${res.data.fileName || file.name}`);
        } else {
          setPhotoUrl(base64Data);
          setUploadedFileName(file.name);
          setUploadSuccessMsg(`Photo loaded: ${file.name}`);
        }
      } catch (err) {
        setPhotoUrl(base64Data);
        setUploadedFileName(file.name);
        setUploadSuccessMsg(`Photo preview ready (local)`);
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = async (status) => {
    setErrorMessage('');

    if (!name.trim()) return setErrorMessage('Student Full Name is required');
    if (!admissionNumber.trim()) return setErrorMessage('Admission Number / Student ID is required');
    if (!rollNumber.trim()) return setErrorMessage('Roll Number is required');
    if (!dob) return setErrorMessage('Date of Birth is required');

    setIsSaving(true);

    const payload = {
      name: name.trim(),
      photoUrl: photoUrl.trim() || null,
      admissionNumber: admissionNumber.trim().toUpperCase(),
      class: studentClass,
      section,
      rollNumber: rollNumber.trim(),
      dob,
      gender,
      bloodGroup,
      academicSession,
      status,
    };

    try {
      if (isEditing) {
        await studentService.updateStudent(studentToEdit.id || studentToEdit._id, payload);
        showToast('Student record updated successfully!', 'success');
      } else {
        await studentService.createStudent(payload);
        // Clear saved draft
        localStorage.removeItem(STORAGE_KEYS.STUDENT_FORM_DRAFT);
        showToast(
          status === 'forwarded'
            ? 'Student created and forwarded to Super Admin!'
            : 'Student saved as draft!',
          'success'
        );
      }
      onStudentSaved?.();
      onClose();
    } catch (err) {
      setErrorMessage(err.userMessage || 'Failed to save student record');
    } finally {
      setIsSaving(false);
    }
  };

  // Save progress as draft to local storage
  const handleSaveLocalDraft = () => {
    const draft = {
      name,
      photoUrl,
      admissionNumber,
      class: studentClass,
      section,
      rollNumber,
      dob,
      gender,
      bloodGroup,
      academicSession,
    };
    localStorage.setItem(STORAGE_KEYS.STUDENT_FORM_DRAFT, JSON.stringify(draft));
    showToast('Form draft saved locally in browser!', 'info');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Student: ${studentToEdit.name}` : 'Student Admission & Data Entry'}
      subtitle="Complete student profile with 10 standard educational parameters"
      maxWidth="620px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {!isEditing ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSaveLocalDraft}
            >
              <Save size={14} />
              Save Local Draft
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleSubmit('draft')}
              disabled={isSaving || isUploadingPhoto}
            >
              Save as Draft
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleSubmit('forwarded')}
              disabled={isSaving || isUploadingPhoto}
            >
              <Send size={14} />
              {isSaving ? 'Saving...' : 'Submit & Forward'}
            </button>
          </div>
        </div>
      }
    >
      <div>
        {errorMessage && (
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
            <span>{errorMessage}</span>
          </div>
        )}

        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={(e) => e.preventDefault()}>
          {/* Section: Student Identity & Photo */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Student Identity & Photo
            </div>

            {/* Photo Picker & Preview */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid var(--border-color)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <ImageIcon size={24} color="var(--text-muted)" />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    <Upload size={14} />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      style={{ display: 'none' }}
                      disabled={isUploadingPhoto}
                    />
                  </label>
                  {isUploadingPhoto && (
                    <span style={{ fontSize: '12px', color: 'var(--color-accent)' }}>
                      Uploading & processing...
                    </span>
                  )}
                </div>

                {uploadSuccessMsg && (
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--color-success-text)',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>{uploadSuccessMsg}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sample Avatars Selector */}
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Or select a preset avatar:
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {SAMPLE_AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPhotoUrl(avatar);
                      setUploadSuccessMsg('Sample avatar selected');
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-full)',
                      border: photoUrl === avatar ? '2px solid var(--color-accent)' : '1px solid var(--border-color)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      padding: 0,
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  >
                    <img src={avatar} alt={`Avatar ${idx}`} style={{ width: '100%', height: '100%' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 1. Full Name & 2. Admission Number */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Alexander Hayes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Admission No / Student ID *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ADM-0105"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
                required
              />
            </div>
          </div>

          {/* 3. Class, 4. Section, 5. Roll Number */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Class *</label>
              <select
                className="form-select"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
              >
                {SCHOOL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Section *</label>
              <select
                className="form-select"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                {CLASS_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Roll Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 101"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 6. Date of Birth, 7. Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                className="form-input"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select
                className="form-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g.toLowerCase()}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 8. Blood Group, 9. Academic Session */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                className="form-select"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Session *</label>
              <select
                className="form-select"
                value={academicSession}
                onChange={(e) => setAcademicSession(e.target.value)}
              >
                {ACADEMIC_SESSIONS.map((ses) => (
                  <option key={ses} value={ses}>
                    {ses}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default StudentFormModal;
