const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const scopeToSchool = require('../middleware/tenantScope');
const {
  exportSingleSchool,
  exportSchoolPackage,
  exportSchoolPhotosOnly,
  exportAllSchools,
  exportAllSchoolsPackage,
  exportFiltered,
  getExportHistory,
} = require('../controllers/exportController');

router.use(authenticate);

// Export single school Excel (.xlsx)
router.get('/school/:schoolId/xlsx', authorize('super_admin', 'school_admin'), exportSingleSchool);

// Export single school Complete Package (Excel + photos folder) (.zip)
router.get('/school/:schoolId/package', authorize('super_admin', 'school_admin'), exportSchoolPackage);

// Export single school photos only (.zip)
router.get('/school/:schoolId/photos', authorize('super_admin', 'school_admin'), exportSchoolPhotosOnly);

// Export all schools as multi-sheet workbook (Super admin only) (.xlsx)
router.get('/all/xlsx', authorize('super_admin'), exportAllSchools);

// Export all schools master package (Super admin only) (.zip)
router.get('/all/package', authorize('super_admin'), exportAllSchoolsPackage);

// Export filtered subset (.xlsx)
router.get('/filtered/xlsx', authorize('super_admin', 'school_admin'), scopeToSchool, exportFiltered);

// Export logs
router.get('/history', authorize('super_admin', 'school_admin'), getExportHistory);

module.exports = router;

