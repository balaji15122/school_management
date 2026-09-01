const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  registerSchoolSchema,
  loginSchema,
} = require('../utils/validators');
const {
  registerSchool,
  login,
  refreshToken,
  getMe,
  logout,
} = require('../controllers/authController');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register-school', authLimiter, validate(registerSchoolSchema), registerSchool);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;
