const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const {
  getSchools,
  getSchoolByCode,
  getSchoolById,
  createSchool,
  updateSchool,
} = require('../controllers/schoolController');

// Public lookup route (for student onboarding)
router.get('/by-code/:code', getSchoolByCode);

// Protected routes
router.use(authenticate);

router.route('/')
  .get(authorize('super_admin'), getSchools)
  .post(authorize('super_admin'), createSchool);

router.route('/:id')
  .get(authorize('super_admin', 'school_admin'), getSchoolById)
  .patch(authorize('super_admin', 'school_admin'), updateSchool);

module.exports = router;
