const prisma = require('../config/db');

/**
 * Fetch logs matching the filter parameters.
 */
async function generateHistoricalReport(zoneId, fromDateStr, toDateStr) {
  const where = {};

  if (zoneId && zoneId !== 'all') {
    where.zoneId = parseInt(zoneId, 10);
  }

  // Handle date filters
  if (fromDateStr || toDateStr) {
    where.entryTime = {};
    if (fromDateStr) {
      where.entryTime.gte = new Date(fromDateStr);
    }
    if (toDateStr) {
      // Set to end of day if toDateStr is provided to include the whole day
      const toDate = new Date(toDateStr);
      toDate.setHours(23, 59, 59, 999);
      where.entryTime.lte = toDate;
    }
  }

  const logs = await prisma.log.findMany({
    where,
    include: {
      student: {
        select: {
          name: true,
          department: true
        }
      },
      zone: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      entryTime: 'desc'
    }
  });

  return logs;
}

module.exports = {
  generateHistoricalReport
};
