const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const { getUsers, toggleUserStatus } = require('../controllers/userController');

router.use(authenticate);

router.get('/', authorize('super_admin', 'school_admin'), getUsers);
router.patch('/:id/toggle-status', authorize('super_admin'), toggleUserStatus);

module.exports = router;
