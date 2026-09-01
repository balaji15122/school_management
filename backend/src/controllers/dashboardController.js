const School = require('../models/School');
const StudentRecord = require('../models/StudentRecord');
const User = require('../models/User');

/**
 * Get aggregated dashboard statistics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const { role } = req.user;
    const baseFilter = { ...req.schoolFilter };

    // Total schools (super admin sees all; school admin sees 1)
    let totalSchools = 1;
    if (role === 'super_admin') {
      totalSchools = await School.countDocuments({ isActive: true });
    }

    // Student counts
    const [totalStudents, verifiedCount, pendingCount, rejectedCount] = await Promise.all([
      StudentRecord.countDocuments(baseFilter),
      StudentRecord.countDocuments({ ...baseFilter, status: 'verified' }),
      StudentRecord.countDocuments({ ...baseFilter, status: 'pending' }),
      StudentRecord.countDocuments({ ...baseFilter, status: 'rejected' }),
    ]);

    // Submissions last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySubmissions = await StudentRecord.aggregate([
      {
        $match: {
          ...baseFilter,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Class distribution
    const classDistribution = await StudentRecord.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$class',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Recent 5 submissions
    const recentSubmissions = await StudentRecord.find(baseFilter)
      .populate('schoolId', 'name code')
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSchools,
          totalStudents,
          verified: verifiedCount,
          pending: pendingCount,
          rejected: rejectedCount,
        },
        dailySubmissions: dailySubmissions.map((d) => ({
          date: d._id,
          count: d.count,
        })),
        classDistribution: classDistribution.map((c) => ({
          class: c._id,
          count: c.count,
        })),
        recentSubmissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
