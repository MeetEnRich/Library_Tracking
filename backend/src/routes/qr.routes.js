const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qr.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/scan', verifyToken(['student']), qrController.scanQR);

module.exports = router;
