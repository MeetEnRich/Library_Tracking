const occupancyService = require('../services/occupancy.service');

/**
 * Handle occupancy stats posted by the Python CV service.
 */
async function ingestOccupancy(req, res, next) {
  try {
    const { zoneId, count } = req.body;

    if (zoneId === undefined || count === undefined) {
      return res.status(400).json({ message: 'zoneId and count are required' });
    }

    const parsedZoneId = parseInt(zoneId, 10);
    const parsedCount = parseInt(count, 10);

    if (isNaN(parsedZoneId) || isNaN(parsedCount) || parsedCount < 0) {
      return res.status(400).json({ message: 'Invalid zoneId or occupancy count' });
    }

    const snapshot = await occupancyService.handleCVUpdate(parsedZoneId, parsedCount);

    res.status(201).json({
      message: 'Occupancy recorded successfully',
      snapshot
    });
  } catch (err) {
    if (err.message.includes('Zone not found')) {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
}

module.exports = {
  ingestOccupancy
};
