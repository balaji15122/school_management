const School = require('../models/School');
const StudentRecord = require('../models/StudentRecord');
const User = require('../models/User');

/**
 * Get all schools with statistics (Super Admin only)
 */
const getSchools = async (req, res, next) => {
  try {
    const { search, isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { code: searchRegex }, { contactEmail: searchRegex }];
    }

    const schools = await School.find(query)
      .populate('adminUserId', 'name email phone')
      .sort({ createdAt: -1 });

    // Aggregate student counts per school
    const schoolStats = await StudentRecord.aggregate([
      {
        $group: {
          _id: '$schoolId',
          totalStudents: { $sum: 1 },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = {};
    schoolStats.forEach((stat) => {
      statsMap[stat._id.toString()] = stat;
    });

    const schoolsWithStats = schools.map((school) => {
      const stats = statsMap[school._id.toString()] || {
        totalStudents: 0,
        verifiedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
      };

      return {
        id: school._id,
        name: school.name,
        code: school.code,
        address: school.address,
        contactEmail: school.contactEmail,
        contactPhone: school.contactPhone,
        adminUser: school.adminUserId,
        isActive: school.isActive,
        createdAt: school.createdAt,
        stats: {
          totalStudents: stats.totalStudents,
          verified: stats.verifiedCount,
          pending: stats.pendingCount,
          rejected: stats.rejectedCount,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: schoolsWithStats.length,
      data: schoolsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get school by code (Public for student registration onboarding)
 */
const getSchoolByCode = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const school = await School.findOne({ code, isActive: true }).select('name code address contactEmail');

    if (!school) {
      return res.status(404).json({
        success: false,
        message: `No active school found with code '${code}'`,
      });
    }

    res.status(200).json({
      success: true,
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single school by ID
 */
const getSchoolById = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id).populate('adminUserId', 'name email phone');

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // If school admin, ensure they can only access their own school
    if (req.user.role === 'school_admin' && req.user.schoolId._id.toString() !== school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view other schools',
      });
    }

    const studentStats = await StudentRecord.aggregate([
      { $match: { schoolId: school._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = { total: 0, pending: 0, verified: 0, rejected: 0 };
    studentStats.forEach((s) => {
      stats[s._id] = s.count;
      stats.total += s.count;
    });

    res.status(200).json({
      success: true,
      data: {
        ...school.toJSON(),
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new school (Super admin)
 */
const createSchool = async (req, res, next) => {
  try {
    const { name, code, address, contactEmail, contactPhone } = req.body;
    const normalizedCode = code.toUpperCase().trim();

    const existing = await School.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `School code '${normalizedCode}' already exists`,
      });
    }

    const school = await School.create({
      name: name.trim(),
      code: normalizedCode,
      address: address || '',
      contactEmail: contactEmail.toLowerCase().trim(),
      contactPhone: contactPhone || '',
    });

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update school details
 */
const updateSchool = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    if (req.user.role === 'school_admin' && req.user.schoolId._id.toString() !== school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to update other schools',
      });
    }

    const { name, address, contactEmail, contactPhone, isActive } = req.body;

    if (name) school.name = name.trim();
    if (address !== undefined) school.address = address.trim();
    if (contactEmail) school.contactEmail = contactEmail.toLowerCase().trim();
    if (contactPhone !== undefined) school.contactPhone = contactPhone.trim();

    // Only super admin can toggle active status
    if (isActive !== undefined && req.user.role === 'super_admin') {
      school.isActive = isActive;
    }

    await school.save();

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchools,
  getSchoolByCode,
  getSchoolById,
  createSchool,
  updateSchool,
};
