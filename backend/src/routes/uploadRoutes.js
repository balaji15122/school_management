const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

// Student Photo Upload
router.post('/photo', authenticate, uploadController.uploadStudentPhoto);

module.exports = router;
