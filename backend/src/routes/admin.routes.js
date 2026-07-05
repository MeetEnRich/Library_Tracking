const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/dashboard', verifyToken(['admin']), adminController.getDashboardStats);
router.get('/reports', verifyToken(['admin']), adminController.getReports);
router.get('/students', verifyToken(['admin']), adminController.getStudents);
router.get('/students/:matricNo/logs', verifyToken(['admin']), adminController.getStudentLogs);
router.delete('/students/:matricNo', verifyToken(['admin']), adminController.deleteStudent);
router.delete('/logs/:id', verifyToken(['admin']), adminController.deleteLog);

module.exports = router;
