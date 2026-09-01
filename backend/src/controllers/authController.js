const jwt = require('jsonwebtoken');
const User = require('../models/User');
const School = require('../models/School');
const { generateAccessToken, generateRefreshToken } = require('../middleware/auth');

/**
 * Register a new school along with its school admin user
 */
const registerSchool = async (req, res, next) => {
  try {
    const {
      schoolName,
      schoolCode,
      schoolAddress,
      schoolContactEmail,
      schoolContactPhone,
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
    } = req.body;

    // Check if school code already exists
    const normalizedCode = schoolCode.toUpperCase().trim();
    const existingSchool = await School.findOne({ code: normalizedCode });
    if (existingSchool) {
      return res.status(409).json({
        success: false,
        message: `School code '${normalizedCode}' is already registered. Please choose another code.`,
      });
    }

    // Check if admin email already exists
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `Admin email '${adminEmail}' is already in use.`,
      });
    }

    // Create school first
    const school = await School.create({
      name: schoolName.trim(),
      code: normalizedCode,
      address: schoolAddress || '',
      contactEmail: schoolContactEmail.toLowerCase().trim(),
      contactPhone: schoolContactPhone || '',
    });

    // Create school admin user linked to the school
    const adminUser = await User.create({
      name: adminName.trim(),
      email: adminEmail.toLowerCase().trim(),
      phone: adminPhone || '',
      passwordHash: adminPassword,
      role: 'school_admin',
      schoolId: school._id,
    });

    // Update school with adminUserId
    school.adminUserId = adminUser._id;
    await school.save();

    const accessToken = generateAccessToken(adminUser);
    const refreshToken = generateRefreshToken(adminUser);

    res.status(201).json({
      success: true,
      message: 'School and Admin account registered successfully',
      data: {
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          schoolId: {
            id: school._id,
            name: school.name,
            code: school.code,
          },
        },
        school: {
          id: school._id,
          name: school.name,
          code: school.code,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Login for all roles
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .populate('schoolId', 'name code address isActive');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          schoolId: user.schoolId,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_development_2026_secure!'
    );

    const user = await User.findById(decoded.id).populate('schoolId', 'name code address isActive');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token or user not active',
      });
    }

    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

/**
 * Get current user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('schoolId', 'name code address contactEmail contactPhone');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 */
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = {
  registerSchool,
  login,
  refreshToken,
  getMe,
  logout,
};
