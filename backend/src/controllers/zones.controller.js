const occupancyService = require('../services/occupancy.service');

/**
 * Get live occupancy and statistics for all library zones.
 */
async function getZones(req, res, next) {
  try {
    const liveZones = await occupancyService.getLiveOccupancy();
    res.status(200).json(liveZones);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getZones
};
