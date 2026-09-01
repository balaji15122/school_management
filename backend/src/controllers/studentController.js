const School = require('../models/School');
const StudentRecord = require('../models/StudentRecord');
const {
  renamePhotoForAdmissionNumber,
  sanitizeAdmissionNumber,
  sanitizeSchoolCode,
} = require('../utils/photoStorageHelper');
const { uploadPhoto } = require('../services/storageService');

/**
 * Create a new student record (School Admin)
 */
const createStudent = async (req, res, next) => {
  try {
    const schoolId = req.schoolFilter?.schoolId || (req.user?.schoolId?._id || req.user?.schoolId) || req.body.schoolId;
    const {
      name,
      photoUrl: inputPhotoUrl,
      admissionNumber,
      class: className,
      section,
      rollNumber,
      dob,
      gender,
      bloodGroup,
      academicSession,
      status = 'forwarded',
    } = req.body;

    const normalizedAdmission = admissionNumber.trim().toUpperCase();

    // Check uniqueness within the school
    const existing = await StudentRecord.findOne({
      schoolId,
      admissionNumber: normalizedAdmission,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A student with admission number / ID '${normalizedAdmission}' already exists in this school.`,
      });
    }

    // Lookup School to get school code
    const schoolDoc = await School.findById(schoolId);
    const schoolCode = schoolDoc ? schoolDoc.code : 'SCHOOL';

    let finalPhotoUrl = inputPhotoUrl || null;
    let finalPhotoFileName = null;

    // Process photo if provided as Base64 data URI
    if (inputPhotoUrl && inputPhotoUrl.startsWith('data:image/')) {
      const matches = inputPhotoUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        let ext = 'jpg';
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';

        const buffer = Buffer.from(matches[2], 'base64');
        const saved = await uploadPhoto({
          buffer,
          ext,
          admissionNumber: normalizedAdmission,
          schoolCode,
          req,
        });

        finalPhotoUrl = saved.photoUrl;
        finalPhotoFileName = saved.fileName;
      }
    } else if (inputPhotoUrl) {
      finalPhotoFileName = `${sanitizeAdmissionNumber(normalizedAdmission)}.jpg`;
    }

    const student = await StudentRecord.create({
      schoolId,
      submittedBy: req.user._id,
      name: name.trim(),
      photoUrl: finalPhotoUrl,
      photoFileName: finalPhotoFileName,
      admissionNumber: normalizedAdmission,
      class: className.trim(),
      section: section.trim().toUpperCase(),
      rollNumber: rollNumber ? rollNumber.trim() : '',
      dob: new Date(dob),
      gender: gender.toLowerCase(),
      bloodGroup: bloodGroup ? bloodGroup.trim().toUpperCase() : '',
      academicSession: academicSession ? academicSession.trim() : '2026–27',
      status: status || 'forwarded',
      forwardedAt: new Date(),
    });

    const populatedStudent = await StudentRecord.findById(student._id)
      .populate('schoolId', 'name code')
      .populate('submittedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      data: populatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student records with filtering, searching, and pagination
 */
const getStudents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      class: filterClass,
      section: filterSection,
      status: filterStatus,
      academicSession: filterSession,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Start with tenant-scoped filter from middleware
    const query = { ...req.schoolFilter };

    if (filterClass && filterClass !== 'all') {
      query.class = filterClass;
    }

    if (filterSection && filterSection !== 'all') {
      query.section = filterSection.toUpperCase();
    }

    if (filterSession && filterSession !== 'all') {
      query.academicSession = filterSession;
    }

    if (filterStatus && filterStatus !== 'all') {
      // Map pending to forwarded or pending
      if (filterStatus === 'pending' || filterStatus === 'forwarded') {
        query.status = { $in: ['pending', 'forwarded'] };
      } else {
        query.status = filterStatus.toLowerCase();
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { admissionNumber: searchRegex },
        { rollNumber: searchRegex },
        { academicSession: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [students, total] = await Promise.all([
      StudentRecord.find(query)
        .populate('schoolId', 'name code address contactEmail')
        .populate('submittedBy', 'name email role')
        .populate('verifiedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      StudentRecord.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forward student record(s) to Super Admin
 */
const forwardToSuperAdmin = async (req, res, next) => {
  try {
    const { ids } = req.body;
    let query = { ...req.schoolFilter };

    if (req.params.id) {
      query._id = req.params.id;
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      query._id = { $in: ids };
    } else {
      // Forward all draft records for this school
      query.status = 'draft';
    }

    const updateResult = await StudentRecord.updateMany(query, {
      $set: {
        status: 'forwarded',
        forwardedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: `Successfully forwarded ${updateResult.modifiedCount} student record(s) to Super Admin`,
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single student record by ID
 */
const getStudentById = async (req, res, next) => {
  try {
    const query = { _id: req.params.id, ...req.schoolFilter };
    const student = await StudentRecord.findOne(query)
      .populate('schoolId', 'name code address contactEmail contactPhone')
      .populate('submittedBy', 'name email role')
      .populate('verifiedBy', 'name email');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found or access unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a student record
 */
const updateStudent = async (req, res, next) => {
  try {
    const query = { _id: req.params.id, ...req.schoolFilter };
    const student = await StudentRecord.findOne(query);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found or access unauthorized',
      });
    }

    const updates = req.body;
    const oldAdmissionNumber = student.admissionNumber;

    if (updates.admissionNumber) {
      const normalizedAdmission = updates.admissionNumber.trim().toUpperCase();
      // Check collision if changed
      if (normalizedAdmission !== student.admissionNumber) {
        const existing = await StudentRecord.findOne({
          schoolId: student.schoolId,
          admissionNumber: normalizedAdmission,
          _id: { $ne: student._id },
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: `Admission number '${normalizedAdmission}' already exists in this school.`,
          });
        }
        student.admissionNumber = normalizedAdmission;

        // Auto-rename photo files on disk
        const schoolDoc = await School.findById(student.schoolId);
        const schoolCode = schoolDoc ? schoolDoc.code : 'SCHOOL';
        const renamedFile = renamePhotoForAdmissionNumber({
          oldAdmissionNumber,
          newAdmissionNumber: normalizedAdmission,
          schoolCode,
        });

        if (renamedFile) {
          student.photoFileName = renamedFile;
          if (student.photoUrl && student.photoUrl.includes('/uploads/')) {
            const protocol = req.protocol || 'http';
            const host = req.get('host') || 'localhost:5050';
            student.photoUrl = `${protocol}://${host}/uploads/schools/${sanitizeSchoolCode(schoolCode)}/photos/${renamedFile}`;
          }
        } else {
          student.photoFileName = `${sanitizeAdmissionNumber(normalizedAdmission)}.jpg`;
        }
      }
    }

    // Process new Base64 photo update if provided
    if (updates.photoUrl && updates.photoUrl.startsWith('data:image/')) {
      const schoolDoc = await School.findById(student.schoolId);
      const schoolCode = schoolDoc ? schoolDoc.code : 'SCHOOL';
      const matches = updates.photoUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        let ext = 'jpg';
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';

        const buffer = Buffer.from(matches[2], 'base64');
        const saved = await uploadPhoto({
          buffer,
          ext,
          admissionNumber: student.admissionNumber,
          schoolCode,
          req,
        });

        student.photoUrl = saved.photoUrl;
        student.photoFileName = saved.fileName;
      }
    } else if (updates.photoUrl !== undefined) {
      student.photoUrl = updates.photoUrl;
      if (updates.photoUrl) {
        student.photoFileName = `${sanitizeAdmissionNumber(student.admissionNumber)}.jpg`;
      }
    }

    const allowedFields = [
      'name',
      'class',
      'section',
      'rollNumber',
      'dob',
      'gender',
      'bloodGroup',
      'academicSession',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        student[field] = updates[field];
      }
    });

    await student.save();

    const updated = await StudentRecord.findById(student._id)
      .populate('schoolId', 'name code')
      .populate('submittedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a student record
 */
const deleteStudent = async (req, res, next) => {
  try {
    const query = { _id: req.params.id, ...req.schoolFilter };
    const student = await StudentRecord.findOne(query);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found or access unauthorized',
      });
    }

    await StudentRecord.deleteOne({ _id: student._id });

    res.status(200).json({
      success: true,
      message: 'Student record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update verification status (Super Admin / Admin)
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const query = { _id: req.params.id, ...req.schoolFilter };

    const student = await StudentRecord.findOne(query);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found or access unauthorized',
      });
    }

    student.status = status;
    student.rejectionReason = status === 'rejected' ? rejectionReason || 'Information incomplete or invalid' : '';
    student.verifiedBy = req.user._id;
    student.verifiedAt = new Date();

    await student.save();

    const updated = await StudentRecord.findById(student._id)
      .populate('schoolId', 'name code')
      .populate('submittedBy', 'name email')
      .populate('verifiedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Student status updated to '${status}' successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update verification status (Super Admin / Admin)
 */
const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, status, rejectionReason } = req.body;

    const query = {
      _id: { $in: ids },
      ...req.schoolFilter,
    };

    const updateFields = {
      status,
      rejectionReason: status === 'rejected' ? rejectionReason || 'Bulk rejected by administrator' : '',
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
    };

    const result = await StudentRecord.updateMany(query, { $set: updateFields });

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} student record(s) to '${status}'`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudent,
  getStudents,
  forwardToSuperAdmin,
  getStudentById,
  updateStudent,
  deleteStudent,
  updateStatus,
  bulkUpdateStatus,
};
