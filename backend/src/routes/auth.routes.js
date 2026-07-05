const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.registerStudent);
router.post('/login', authController.loginStudent);
router.post('/admin/login', authController.loginAdmin);

module.exports = router;
