const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const scopeToSchool = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const {
  studentRecordSchema,
  studentStatusUpdateSchema,
  bulkStatusUpdateSchema,
} = require('../utils/validators');
const {
  createStudent,
  getStudents,
  forwardToSuperAdmin,
  getStudentById,
  updateStudent,
  deleteStudent,
  updateStatus,
  bulkUpdateStatus,
} = require('../controllers/studentController');

// All routes require authentication & tenant scoping
router.use(authenticate);
router.use(scopeToSchool);

// General student list & create
router.route('/')
  .post(validate(studentRecordSchema), createStudent)
  .get(authorize('super_admin', 'school_admin'), getStudents);

// Forward to Super Admin
router.post('/forward', forwardToSuperAdmin);
router.patch('/bulk/forward', forwardToSuperAdmin);
router.patch('/:id/forward', forwardToSuperAdmin);

// Bulk status update (Admin only)
router.patch(
  '/bulk/status',
  authorize('super_admin', 'school_admin'),
  validate(bulkStatusUpdateSchema),
  bulkUpdateStatus
);

// Single student operations
router.route('/:id')
  .get(getStudentById)
  .patch(updateStudent)
  .delete(deleteStudent);

// Single status update (Admin only)
router.patch(
  '/:id/status',
  authorize('super_admin', 'school_admin'),
  validate(studentStatusUpdateSchema),
  updateStatus
);

module.exports = router;
