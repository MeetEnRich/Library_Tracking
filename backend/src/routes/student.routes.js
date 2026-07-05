const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/me', verifyToken(['student']), studentController.getMe);
router.get('/me/history', verifyToken(['student']), studentController.getMyHistory);

module.exports = router;
