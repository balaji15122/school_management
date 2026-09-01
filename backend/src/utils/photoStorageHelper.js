const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

/**
 * Ensures a directory exists
 */
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

/**
 * Sanitizes an admission number for filesystem safety
 */
const sanitizeAdmissionNumber = (admissionNumber) => {
  if (!admissionNumber) return 'STUDENT_' + Date.now();
  return admissionNumber
    .trim()
    .toUpperCase()
    .replace(/[\\/:*?"<>|\s]/g, '_');
};

/**
 * Sanitizes school code
 */
const sanitizeSchoolCode = (schoolCode) => {
  if (!schoolCode) return 'DEFAULT';
  return schoolCode
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '_');
};

/**
 * Gets or creates the photo directory for a specific school
 */
const getSchoolPhotoDir = (schoolCode) => {
  const cleanCode = sanitizeSchoolCode(schoolCode);
  const dirPath = path.join(UPLOADS_ROOT, 'schools', cleanCode, 'photos');
  return ensureDir(dirPath);
};

/**
 * Gets the root uploads directory
 */
const getRootUploadsDir = () => {
  return ensureDir(UPLOADS_ROOT);
};

/**
 * Saves photo buffer to both the school folder and root uploads
 */
const savePhotoBuffer = ({ buffer, ext = 'jpg', admissionNumber, schoolCode = 'DEFAULT' }) => {
  const cleanAdm = sanitizeAdmissionNumber(admissionNumber);
  const cleanExt = ext.replace(/^\./, '').toLowerCase() || 'jpg';
  const fileName = `${cleanAdm}.${cleanExt}`;

  // 1. Save in school-specific folder: uploads/schools/<code>/photos/<admissionNumber>.<ext>
  const schoolDir = getSchoolPhotoDir(schoolCode);
  const schoolFilePath = path.join(schoolDir, fileName);
  fs.writeFileSync(schoolFilePath, buffer);

  // 2. Also save/link in root uploads for direct access: uploads/<admissionNumber>.<ext>
  const rootDir = getRootUploadsDir();
  const rootFilePath = path.join(rootDir, fileName);
  fs.writeFileSync(rootFilePath, buffer);

  // 3. Return relative paths and fileName
  return {
    fileName,
    schoolFilePath,
    rootFilePath,
    relativeSchoolUrl: `/uploads/schools/${sanitizeSchoolCode(schoolCode)}/photos/${fileName}`,
    relativeRootUrl: `/uploads/${fileName}`,
  };
};

/**
 * Renames photo file when admission number changes
 */
const renamePhotoForAdmissionNumber = ({ oldAdmissionNumber, newAdmissionNumber, schoolCode = 'DEFAULT' }) => {
  if (!oldAdmissionNumber || !newAdmissionNumber || oldAdmissionNumber === newAdmissionNumber) {
    return null;
  }

  const oldClean = sanitizeAdmissionNumber(oldAdmissionNumber);
  const newClean = sanitizeAdmissionNumber(newAdmissionNumber);
  const schoolDir = getSchoolPhotoDir(schoolCode);
  const rootDir = getRootUploadsDir();

  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  let renamedFile = null;

  for (const ext of extensions) {
    const oldSchoolFile = path.join(schoolDir, `${oldClean}.${ext}`);
    const newSchoolFile = path.join(schoolDir, `${newClean}.${ext}`);
    if (fs.existsSync(oldSchoolFile)) {
      fs.renameSync(oldSchoolFile, newSchoolFile);
      renamedFile = `${newClean}.${ext}`;
    }

    const oldRootFile = path.join(rootDir, `${oldClean}.${ext}`);
    const newRootFile = path.join(rootDir, `${newClean}.${ext}`);
    if (fs.existsSync(oldRootFile)) {
      fs.renameSync(oldRootFile, newRootFile);
      renamedFile = `${newClean}.${ext}`;
    }
  }

  return renamedFile;
};

/**
 * Locates an existing photo on disk for a student
 */
const findPhotoPath = (admissionNumber, schoolCode = 'DEFAULT') => {
  if (!admissionNumber) return null;
  const cleanAdm = sanitizeAdmissionNumber(admissionNumber);
  const cleanCode = sanitizeSchoolCode(schoolCode);
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

  // Check in school folder first
  for (const ext of extensions) {
    const p = path.join(UPLOADS_ROOT, 'schools', cleanCode, 'photos', `${cleanAdm}.${ext}`);
    if (fs.existsSync(p)) return p;
  }

  // Check in root uploads
  for (const ext of extensions) {
    const p = path.join(UPLOADS_ROOT, `${cleanAdm}.${ext}`);
    if (fs.existsSync(p)) return p;
  }

  return null;
};

module.exports = {
  UPLOADS_ROOT,
  sanitizeAdmissionNumber,
  sanitizeSchoolCode,
  getSchoolPhotoDir,
  getRootUploadsDir,
  savePhotoBuffer,
  renamePhotoForAdmissionNumber,
  findPhotoPath,
};
