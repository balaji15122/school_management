const User = require('../models/User');

/**
 * Get all users (Super Admin only, or school admin for their school)
 */
const getUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'school_admin') {
      query.schoolId = req.user.schoolId._id || req.user.schoolId;
    } else if (req.query.schoolId && req.query.schoolId !== 'all') {
      query.schoolId = req.query.schoolId;
    }

    if (req.query.role && req.query.role !== 'all') {
      query.role = req.query.role;
    }

    const users = await User.find(query)
      .populate('schoolId', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user active status
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  toggleUserStatus,
};
