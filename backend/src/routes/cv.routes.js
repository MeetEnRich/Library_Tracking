const express = require('express');
const router = express.Router();
const cvController = require('../controllers/cv.controller');
const { verifyCVService } = require('../middleware/cvServiceAuth');

router.post('/occupancy', verifyCVService, cvController.ingestOccupancy);

module.exports = router;
