const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { generateSingleSchoolExcel, generateAllSchoolsMultiSheetExcel } = require('./excelExportService');
const { findPhotoPath, sanitizeAdmissionNumber, sanitizeSchoolCode, getSchoolPhotoDir } = require('../utils/photoStorageHelper');
const { fetchPhotoBuffer } = require('./storageService');

/**
 * Creates a Zip archive stream compatible with various archiver versions
 */
const createZipArchive = (options = { zlib: { level: 9 } }) => {
  if (typeof archiver === 'function') {
    return archiver('zip', options);
  }
  if (archiver.ZipArchive) {
    return new archiver.ZipArchive(options);
  }
  if (archiver.default && typeof archiver.default === 'function') {
    return archiver.default('zip', options);
  }
  return new archiver.Archiver('zip', options);
};

/**
 * Generate a complete School Data Package ZIP
 * Contains:
 *  - <SchoolCode>_Students_<Date>.xlsx
 *  - photos/ folder with all student photos named <admissionNumber>.<ext>
 *  - README_CORRELATION_GUIDE.txt
 */
const generateSingleSchoolPackageZip = async (school, records) => {
  return new Promise(async (resolve, reject) => {
    try {
      const archive = createZipArchive({ zlib: { level: 9 } });
      const chunks = [];

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (err) => reject(err));

      const cleanSchoolCode = sanitizeSchoolCode(school.code || school.name);
      const dateStr = new Date().toISOString().split('T')[0];
      const excelFileName = `${cleanSchoolCode}_Students_${dateStr}.xlsx`;

      // 1. Generate and attach the formatted Excel Workbook
      const excelBuffer = await generateSingleSchoolExcel(school, records);
      archive.append(excelBuffer, { name: excelFileName });

      // 2. Generate and attach Correlation Guide
      const guideContent = `======================================================================
SCHOOL STUDENT DATA & PHOTO CORRELATION GUIDE
======================================================================
School Name : ${school.name}
School Code : ${school.code || cleanSchoolCode}
Export Date : ${new Date().toLocaleString()}
Total Count : ${records.length} Students

HOW TO CORRELATE STUDENT DATA AND PHOTOS:
1. Open the included Excel file: ${excelFileName}
2. Find any student row and look at the "Admission No / ID" (e.g. ${records[0]?.admissionNumber || 'GWH-101'})
   and "Photo File Name" column.
3. Open the "photos/" directory in this package.
4. The photo file named "<AdmissionNo>.jpg" (or .png) directly matches
   the student's record in the Excel spreadsheet.

Folder Structure:
├── ${excelFileName}
├── README_CORRELATION_GUIDE.txt
└── photos/
${records.slice(0, 5).map((r) => `    ├── ${sanitizeAdmissionNumber(r.admissionNumber)}.jpg`).join('\n')}
${records.length > 5 ? `    └── ... (${records.length - 5} more photo files)` : ''}
======================================================================
`;
      archive.append(guideContent, { name: 'README_CORRELATION_GUIDE.txt' });

      // 3. Attach student photos into "photos/" directory
      for (const record of records) {
        const cleanAdm = sanitizeAdmissionNumber(record.admissionNumber);
        const photoBuffer = await fetchPhotoBuffer(record.photoUrl, record.admissionNumber, cleanSchoolCode);
        let photoExt = 'jpg';
        if (record.photoUrl && record.photoUrl.includes('.png')) photoExt = 'png';
        else if (record.photoUrl && record.photoUrl.includes('.webp')) photoExt = 'webp';

        const photoNameInZip = `photos/${cleanAdm}.${photoExt}`;

        if (photoBuffer) {
          archive.append(photoBuffer, { name: photoNameInZip });
        } else {
          // Add a lightweight placeholder text/info file if photo is absent
          const placeholderInfo = `Photo not uploaded yet for ${record.name} (${record.admissionNumber})`;
          archive.append(placeholderInfo, { name: `photos/${cleanAdm}_NO_PHOTO.txt` });
        }
      }

      await archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate All Schools Master Package ZIP (Super Admin)
 * Contains:
 *  - All_Schools_Master_Export_<Date>.xlsx (Multi-sheet workbook)
 *  - Folders per school with renamed photos: <SchoolCode>_Photos/<admissionNumber>.<ext>
 *  - MASTER_INDEX.txt
 */
const generateAllSchoolsPackageZip = async (schoolsWithRecords) => {
  return new Promise(async (resolve, reject) => {
    try {
      const archive = createZipArchive({ zlib: { level: 9 } });
      const chunks = [];

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (err) => reject(err));

      const dateStr = new Date().toISOString().split('T')[0];
      const masterExcelName = `All_Schools_Master_Export_${dateStr}.xlsx`;

      // 1. Generate master multi-sheet workbook
      const masterBuffer = await generateAllSchoolsMultiSheetExcel(schoolsWithRecords);
      archive.append(masterBuffer, { name: masterExcelName });

      // 2. Master Correlation Index
      const totalStudents = schoolsWithRecords.reduce((sum, s) => sum + s.records.length, 0);
      const masterIndexContent = `======================================================================
MASTER ALL-SCHOOLS DATA & PHOTOS PACKAGE
======================================================================
Export Date   : ${new Date().toLocaleString()}
Total Schools : ${schoolsWithRecords.length}
Total Students: ${totalStudents}

PACKAGE CONTENTS:
1. ${masterExcelName} (Multi-sheet workbook with Overview Summary + sheet per school)
2. Dedicated photo folders for each school organized by Admission Number:
${schoolsWithRecords.map((s) => `   - ${sanitizeSchoolCode(s.school.code)}_Photos/ (${s.records.length} students)`).join('\n')}

HOW TO CORRELATE:
- Open the Master Excel file. Each school's tab lists all student admission numbers.
- Open the corresponding "<SchoolCode>_Photos/" folder.
- Each photo is named "<AdmissionNumber>.jpg" or ".png" for immediate 1-to-1 matching.
======================================================================
`;
      archive.append(masterIndexContent, { name: 'MASTER_CORRELATION_INDEX.txt' });

      // 3. Append photos for all schools
      for (const item of schoolsWithRecords) {
        const { school, records } = item;
        const cleanCode = sanitizeSchoolCode(school.code || school.name);

        for (const record of records) {
          const cleanAdm = sanitizeAdmissionNumber(record.admissionNumber);
          const photoBuffer = await fetchPhotoBuffer(record.photoUrl, record.admissionNumber, cleanCode);
          let photoExt = 'jpg';
          if (record.photoUrl && record.photoUrl.includes('.png')) photoExt = 'png';
          else if (record.photoUrl && record.photoUrl.includes('.webp')) photoExt = 'webp';

          const photoNameInZip = `${cleanCode}_Photos/${cleanAdm}.${photoExt}`;
          if (photoBuffer) {
            archive.append(photoBuffer, { name: photoNameInZip });
          }
        }
      }

      await archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate ZIP containing student photos only
 */
const generateSchoolPhotosOnlyZip = async (school, records) => {
  return new Promise(async (resolve, reject) => {
    try {
      const archive = createZipArchive({ zlib: { level: 9 } });
      const chunks = [];

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (err) => reject(err));

      const cleanSchoolCode = sanitizeSchoolCode(school.code || school.name);

      for (const record of records) {
        const cleanAdm = sanitizeAdmissionNumber(record.admissionNumber);
        const photoBuffer = await fetchPhotoBuffer(record.photoUrl, record.admissionNumber, cleanSchoolCode);
        let photoExt = 'jpg';
        if (record.photoUrl && record.photoUrl.includes('.png')) photoExt = 'png';
        else if (record.photoUrl && record.photoUrl.includes('.webp')) photoExt = 'webp';

        if (photoBuffer) {
          archive.append(photoBuffer, { name: `${cleanAdm}.${photoExt}` });
        }
      }

      await archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateSingleSchoolPackageZip,
  generateAllSchoolsPackageZip,
  generateSchoolPhotosOnlyZip,
};
