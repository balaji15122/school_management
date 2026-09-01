const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const scopeToSchool = require('../middleware/tenantScope');
const { getDashboardStats } = require('../controllers/dashboardController');

router.use(authenticate);
router.use(scopeToSchool);

router.get('/stats', authorize('super_admin', 'school_admin'), getDashboardStats);

module.exports = router;
