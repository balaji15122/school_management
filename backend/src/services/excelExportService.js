const ExcelJS = require('exceljs');

/**
 * Sanitizes sheet names for Excel compatibility:
 * - Max length 31 characters
 * - Prohibited characters removed: \ / ? * [ ] :
 * - Ensures uniqueness
 */
const sanitizeSheetName = (rawName, existingNames = new Set()) => {
  let clean = (rawName || 'Sheet')
    .replace(/[\\/?*[\]:]/g, '_')
    .trim()
    .slice(0, 28); // leave room for suffix if collision

  if (!clean) clean = 'School';

  let uniqueName = clean;
  let counter = 1;
  while (existingNames.has(uniqueName.toLowerCase())) {
    uniqueName = `${clean.slice(0, 25)}_${counter}`;
    counter++;
  }
  existingNames.add(uniqueName.toLowerCase());
  return uniqueName;
};

// Styling constants
const HEADER_STYLE = {
  font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Slate 800
  },
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  },
};

const ZEBRA_EVEN_STYLE = {
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' }, // Slate 50
  },
};

const BORDER_CELL = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

const STUDENT_COLUMNS = [
  { header: 'S.No', key: 'sno', width: 8 },
  { header: 'Admission No / ID', key: 'admissionNumber', width: 20 },
  { header: 'Student Full Name', key: 'name', width: 26 },
  { header: 'Photo File Name (In photos/ folder)', key: 'photoFileName', width: 30 },
  { header: 'Photo URL / Link', key: 'photoUrl', width: 32 },
  { header: 'Class', key: 'class', width: 12 },
  { header: 'Section', key: 'section', width: 10 },
  { header: 'Roll No', key: 'rollNumber', width: 12 },
  { header: 'Academic Session', key: 'academicSession', width: 18 },
  { header: 'Gender', key: 'gender', width: 12 },
  { header: 'Date of Birth', key: 'dob', width: 16 },
  { header: 'Blood Group', key: 'bloodGroup', width: 14 },
  { header: 'Status', key: 'status', width: 16 },
  { header: 'Forwarded Date', key: 'forwardedAt', width: 18 },
];

/**
 * Format a student worksheet with data and styles
 */
const formatStudentWorksheet = (worksheet, records, schoolInfo = null) => {
  // Title banner if school info provided
  let startRow = 1;
  if (schoolInfo) {
    worksheet.mergeCells('A1:N1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${schoolInfo.name.toUpperCase()} (Code: ${schoolInfo.code || schoolInfo.name})`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }, // Blue 500
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:N2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `Export Generated: ${new Date().toLocaleString()} | Total Records: ${records.length} | Photo files named by Admission No in photos/ folder`;
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    startRow = 4;
  }

  // Freeze top rows
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: startRow }];

  // Column definitions
  worksheet.columns = STUDENT_COLUMNS;

  // Header Row
  const headerRow = worksheet.getRow(startRow);
  STUDENT_COLUMNS.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    Object.assign(cell, HEADER_STYLE);
  });
  headerRow.height = 26;

  // Data Rows
  records.forEach((record, index) => {
    const rowNumber = startRow + 1 + index;
    const row = worksheet.getRow(rowNumber);

    const dobStr = record.dob ? new Date(record.dob).toISOString().split('T')[0] : 'N/A';
    const forwardedStr = record.forwardedAt
      ? new Date(record.forwardedAt).toISOString().split('T')[0]
      : (record.createdAt ? new Date(record.createdAt).toISOString().split('T')[0] : 'N/A');
    const statusCap = (record.status || 'forwarded').toUpperCase();
    const photoFileName = record.photoFileName || (record.admissionNumber ? `${record.admissionNumber}.jpg` : 'N/A');
    const photoUrlStr = record.photoUrl || 'N/A';

    row.values = [
      index + 1,
      record.admissionNumber || '',
      record.name || '',
      photoFileName,
      photoUrlStr,
      record.class || '',
      record.section || '',
      record.rollNumber || '',
      record.academicSession || '2026–27',
      (record.gender || '').toUpperCase(),
      dobStr,
      record.bloodGroup || 'N/A',
      statusCap,
      forwardedStr,
    ];

    // Style row cells
    for (let c = 1; c <= STUDENT_COLUMNS.length; c++) {
      const cell = row.getCell(c);
      cell.border = BORDER_CELL;
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: [1, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14].includes(c) ? 'center' : 'left',
      };

      // Zebra striping
      if (index % 2 === 1) {
        cell.fill = ZEBRA_EVEN_STYLE.fill;
      }

      // Photo file name highlighting
      if (c === 4) {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2563EB' } };
      }

      // Status color highlighting
      if (c === 13) {
        if (statusCap === 'VERIFIED') {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF15803D' } }; // Green
        } else if (statusCap === 'FORWARDED' || statusCap === 'PENDING') {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFB45309' } }; // Amber
        } else if (statusCap === 'REJECTED') {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFB91C1C' } }; // Red
        } else if (statusCap === 'DRAFT') {
          cell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }; // Slate
        }
      }
    }
    row.height = 22;
  });

  // Auto-fit column widths
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: false }, (cell, rowNum) => {
      if (rowNum >= startRow) {
        const val = cell.value ? cell.value.toString() : '';
        if (val.length > maxLength) maxLength = val.length;
      }
    });
    column.width = Math.max(column.width || 12, maxLength + 4);
  });
};

/**
 * Generate Excel workbook for a single school
 */
const generateSingleSchoolExcel = async (school, records) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'School Management Platform';
  workbook.lastModifiedBy = 'Super Admin';
  workbook.created = new Date();

  const sheetName = sanitizeSheetName(school.code || school.name);
  const worksheet = workbook.addWorksheet(sheetName);

  formatStudentWorksheet(worksheet, records, school);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Generate Multi-Sheet Excel workbook for all schools
 * Sheet 1: Executive Summary & Overview
 * Sheet 2..N: Individual School Worksheets (one sheet per school)
 */
const generateAllSchoolsMultiSheetExcel = async (schoolsWithRecords) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'School Management Platform';
  workbook.created = new Date();

  const existingSheetNames = new Set();

  // 1. Overview / Summary Sheet
  const summarySheet = workbook.addWorksheet('Overview Summary');
  summarySheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

  summarySheet.mergeCells('A1:F1');
  const sumTitle = summarySheet.getCell('A1');
  sumTitle.value = 'MULTI-TENANT SCHOOLS DATA EXPORT SUMMARY';
  sumTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  sumTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E1B4B' }, // Deep Indigo 950
  };
  sumTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 32;

  summarySheet.mergeCells('A2:F2');
  summarySheet.getCell('A2').value = `Generated at: ${new Date().toLocaleString()} | Total Schools: ${schoolsWithRecords.length}`;
  summarySheet.getCell('A2').font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
  summarySheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(2).height = 20;

  // Summary headers
  const sumHeaders = ['S.No', 'School Code', 'School Name', 'Total Students', 'Verified', 'Pending', 'Sheet Tab Name'];
  summarySheet.columns = [
    { width: 8 },
    { width: 16 },
    { width: 32 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 22 },
  ];

  const sumHeaderRow = summarySheet.getRow(3);
  sumHeaders.forEach((h, idx) => {
    const cell = sumHeaderRow.getCell(idx + 1);
    cell.value = h;
    Object.assign(cell, HEADER_STYLE);
  });
  sumHeaderRow.height = 26;

  existingSheetNames.add('overview summary');

  // 2. Loop each school and add individual sheet
  let totalAllStudents = 0;
  let totalAllVerified = 0;
  let totalAllPending = 0;

  schoolsWithRecords.forEach((item, index) => {
    const { school, records } = item;
    const sheetTabName = sanitizeSheetName(`${school.code} - ${school.name}`, existingSheetNames);

    const verifiedCount = records.filter((r) => r.status === 'verified').length;
    const pendingCount = records.filter((r) => r.status === 'pending').length;

    totalAllStudents += records.length;
    totalAllVerified += verifiedCount;
    totalAllPending += pendingCount;

    // Add row to summary sheet
    const sRow = summarySheet.getRow(4 + index);
    sRow.values = [
      index + 1,
      school.code,
      school.name,
      records.length,
      verifiedCount,
      pendingCount,
      sheetTabName,
    ];
    for (let c = 1; c <= 7; c++) {
      const cell = sRow.getCell(c);
      cell.border = BORDER_CELL;
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: [1, 2, 4, 5, 6].includes(c) ? 'center' : 'left' };
      if (index % 2 === 1) cell.fill = ZEBRA_EVEN_STYLE.fill;
    }
    sRow.height = 22;

    // Create school worksheet
    const schoolWorksheet = workbook.addWorksheet(sheetTabName);
    formatStudentWorksheet(schoolWorksheet, records, school);
  });

  // Total summary row
  const totalRow = summarySheet.getRow(4 + schoolsWithRecords.length);
  totalRow.values = ['Total', '', 'All Schools Combined', totalAllStudents, totalAllVerified, totalAllPending, ''];
  for (let c = 1; c <= 7; c++) {
    const cell = totalRow.getCell(c);
    cell.font = { name: 'Arial', size: 11, bold: true };
    cell.border = { top: { style: 'medium' }, bottom: { style: 'double' } };
    cell.alignment = { vertical: 'middle', horizontal: [1, 4, 5, 6].includes(c) ? 'center' : 'left' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  generateSingleSchoolExcel,
  generateAllSchoolsMultiSheetExcel,
  sanitizeSheetName,
};
