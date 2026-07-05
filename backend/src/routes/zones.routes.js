const express = require('express');
const router = express.Router();
const zonesController = require('../controllers/zones.controller');
const { verifyToken } = require('../middleware/auth');

// GET /api/zones - Fetch occupancy data for all zones
router.get('/', verifyToken(['student', 'admin']), zonesController.getZones);

module.exports = router;
