const occupancyService = require('../services/occupancy.service');

/**
 * Scan a QR token to check in or out.
 */
async function scanQR(req, res, next) {
  try {
    const { qrToken } = req.body;
    const { matricNo } = req.user;

    if (!qrToken) {
      return res.status(400).json({ message: 'QR token is required' });
    }

    const result = await occupancyService.handleQRScan(matricNo, qrToken);

    res.status(200).json({
      message: `Successfully checked ${result.action === 'in' ? 'in to' : 'out of'} ${result.zoneName}`,
      action: result.action,
      zoneName: result.zoneName,
      log: result.log
    });
  } catch (err) {
    if (err.message.includes('Invalid library zone') || err.message.includes('Student record not found')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

module.exports = {
  scanQR
};
