const School = require('../models/School');
const StudentRecord = require('../models/StudentRecord');
const ExportHistory = require('../models/ExportHistory');
const { generateSingleSchoolExcel, generateAllSchoolsMultiSheetExcel } = require('../services/excelExportService');
const {
  generateSingleSchoolPackageZip,
  generateAllSchoolsPackageZip,
  generateSchoolPhotosOnlyZip,
} = require('../services/packageExportService');
const { sanitizeSchoolCode } = require('../utils/photoStorageHelper');

/**
 * Export a single school's student records to Excel (.xlsx)
 */
const exportSingleSchool = async (req, res, next) => {
  try {
    let targetSchoolId = req.params.schoolId;

    // School admins can only export their own school
    if (req.user.role === 'school_admin') {
      targetSchoolId = req.user.schoolId._id ? req.user.schoolId._id.toString() : req.user.schoolId.toString();
    }

    const school = await School.findById(targetSchoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Optional query filters (class, section, status)
    const query = { schoolId: school._id };
    if (req.query.class) query.class = req.query.class;
    if (req.query.section) query.section = req.query.section.toUpperCase();
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status.toLowerCase();

    const records = await StudentRecord.find(query).sort({ class: 1, section: 1, admissionNumber: 1 });

    const buffer = await generateSingleSchoolExcel(school, records);

    const cleanSchoolCode = (school.code || 'SCHOOL').replace(/[^a-zA-Z0-9_-]/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${cleanSchoolCode}_Students_${dateStr}.xlsx`;

    // Log export history
    await ExportHistory.create({
      exportedBy: req.user._id,
      schoolId: school._id,
      exportType: 'single_school',
      fileName,
      filtersApplied: {
        class: req.query.class || null,
        section: req.query.section || null,
        status: req.query.status || null,
      },
      recordCount: records.length,
      fileSizeBytes: buffer.length,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export a single school's COMPLETE PACKAGE (.zip)
 * Contains: Excel file + photos/ folder (renamed with admission numbers) + Correlation guide
 */
const exportSchoolPackage = async (req, res, next) => {
  try {
    let targetSchoolId = req.params.schoolId;

    if (req.user.role === 'school_admin') {
      targetSchoolId = req.user.schoolId._id ? req.user.schoolId._id.toString() : req.user.schoolId.toString();
    }

    const school = await School.findById(targetSchoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    const query = { schoolId: school._id };
    if (req.query.class) query.class = req.query.class;
    if (req.query.section) query.section = req.query.section.toUpperCase();
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status.toLowerCase();

    const records = await StudentRecord.find(query).sort({ class: 1, section: 1, admissionNumber: 1 });

    const zipBuffer = await generateSingleSchoolPackageZip(school, records);

    const cleanSchoolCode = sanitizeSchoolCode(school.code || school.name);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${cleanSchoolCode}_Student_Data_Package_${dateStr}.zip`;

    // Log export history
    await ExportHistory.create({
      exportedBy: req.user._id,
      schoolId: school._id,
      exportType: 'single_school_package',
      fileName,
      filtersApplied: {
        class: req.query.class || null,
        section: req.query.section || null,
        status: req.query.status || null,
      },
      recordCount: records.length,
      fileSizeBytes: zipBuffer.length,
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', zipBuffer.length);

    return res.send(zipBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export photos only (.zip) for a school (renamed to admission numbers)
 */
const exportSchoolPhotosOnly = async (req, res, next) => {
  try {
    let targetSchoolId = req.params.schoolId;

    if (req.user.role === 'school_admin') {
      targetSchoolId = req.user.schoolId._id ? req.user.schoolId._id.toString() : req.user.schoolId.toString();
    }

    const school = await School.findById(targetSchoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    const records = await StudentRecord.find({ schoolId: school._id }).sort({ admissionNumber: 1 });
    const zipBuffer = await generateSchoolPhotosOnlyZip(school, records);

    const cleanSchoolCode = sanitizeSchoolCode(school.code || school.name);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${cleanSchoolCode}_Photos_${dateStr}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', zipBuffer.length);

    return res.send(zipBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export all schools as a multi-sheet workbook (Super Admin only)
 * One sheet per school + Summary tab
 */
const exportAllSchools = async (req, res, next) => {
  try {
    const schools = await School.find({ isActive: true }).sort({ name: 1 });

    const schoolsWithRecords = await Promise.all(
      schools.map(async (school) => {
        const records = await StudentRecord.find({ schoolId: school._id }).sort({
          class: 1,
          section: 1,
          admissionNumber: 1,
        });
        return { school, records };
      })
    );

    const buffer = await generateAllSchoolsMultiSheetExcel(schoolsWithRecords);

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `All_Schools_Master_Export_${dateStr}.xlsx`;

    const totalRecords = schoolsWithRecords.reduce((acc, curr) => acc + curr.records.length, 0);

    // Log export history
    await ExportHistory.create({
      exportedBy: req.user._id,
      schoolId: null,
      exportType: 'all_schools',
      fileName,
      filtersApplied: {},
      recordCount: totalRecords,
      fileSizeBytes: buffer.length,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export MASTER PACKAGE for all schools (.zip) (Super Admin only)
 * Contains multi-sheet Excel + photo folders for every school
 */
const exportAllSchoolsPackage = async (req, res, next) => {
  try {
    const schools = await School.find({ isActive: true }).sort({ name: 1 });

    const schoolsWithRecords = await Promise.all(
      schools.map(async (school) => {
        const records = await StudentRecord.find({ schoolId: school._id }).sort({
          class: 1,
          section: 1,
          admissionNumber: 1,
        });
        return { school, records };
      })
    );

    const zipBuffer = await generateAllSchoolsPackageZip(schoolsWithRecords);

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `All_Schools_Master_Package_${dateStr}.zip`;

    const totalRecords = schoolsWithRecords.reduce((acc, curr) => acc + curr.records.length, 0);

    // Log export history
    await ExportHistory.create({
      exportedBy: req.user._id,
      schoolId: null,
      exportType: 'all_schools_package',
      fileName,
      filtersApplied: {},
      recordCount: totalRecords,
      fileSizeBytes: zipBuffer.length,
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', zipBuffer.length);

    return res.send(zipBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export custom filtered subset (Admin / School Admin)
 */
const exportFiltered = async (req, res, next) => {
  try {
    const query = { ...req.schoolFilter };
    const { class: filterClass, section: filterSection, status: filterStatus, search } = req.query;

    if (filterClass) query.class = filterClass;
    if (filterSection) query.section = filterSection.toUpperCase();
    if (filterStatus && filterStatus !== 'all') query.status = filterStatus.toLowerCase();
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { admissionNumber: searchRegex }, { parentName: searchRegex }];
    }

    const records = await StudentRecord.find(query)
      .populate('schoolId', 'name code')
      .sort({ class: 1, section: 1, admissionNumber: 1 });

    let schoolInfo = null;
    if (req.user.role === 'school_admin' && req.user.schoolId) {
      schoolInfo = req.user.schoolId;
    } else if (req.query.schoolId && req.query.schoolId !== 'all') {
      schoolInfo = await School.findById(req.query.schoolId);
    } else {
      schoolInfo = { name: 'Filtered Student Records', code: 'FILTERED' };
    }

    const buffer = await generateSingleSchoolExcel(schoolInfo, records);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Filtered_Students_Export_${dateStr}.xlsx`;

    await ExportHistory.create({
      exportedBy: req.user._id,
      schoolId: schoolInfo && schoolInfo._id ? schoolInfo._id : null,
      exportType: 'filtered',
      fileName,
      filtersApplied: { class: filterClass, section: filterSection, status: filterStatus, search },
      recordCount: records.length,
      fileSizeBytes: buffer.length,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Get export logs history
 */
const getExportHistory = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'school_admin') {
      query.schoolId = req.user.schoolId._id || req.user.schoolId;
    }

    const history = await ExportHistory.find(query)
      .populate('exportedBy', 'name email role')
      .populate('schoolId', 'name code')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportSingleSchool,
  exportSchoolPackage,
  exportSchoolPhotosOnly,
  exportAllSchools,
  exportAllSchoolsPackage,
  exportFiltered,
  getExportHistory,
};

