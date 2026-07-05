const prisma = require('../config/db');

/**
 * Automatically checks out student sessions that were left open
 * (where exitTime is null and entryTime is older than 8 hours).
 * Closes the session setting the exit time to entryTime + 2 hours.
 */
async function autoCheckoutForgottenSessions() {
  const now = new Date();
  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);

  try {
    const uncompletedLogs = await prisma.log.findMany({
      where: {
        exitTime: null,
        entryTime: {
          lt: eightHoursAgo
        }
      }
    });

    if (uncompletedLogs.length === 0) {
      return;
    }

    console.log(`[Auto-Checkout] Found ${uncompletedLogs.length} uncompleted library sessions older than 8 hours.`);

    let count = 0;
    for (const log of uncompletedLogs) {
      // Auto-set exitTime to entryTime + 2 hours to approximate a typical study session length
      const estimatedExitTime = new Date(log.entryTime.getTime() + 2 * 60 * 60 * 1000);
      
      await prisma.log.update({
        where: { id: log.id },
        data: { exitTime: estimatedExitTime }
      });
      count++;
    }

    console.log(`[Auto-Checkout] Successfully checked out ${count} forgotten student sessions.`);
  } catch (error) {
    console.error('[Auto-Checkout] Error running session cleanup:', error);
  }
}

module.exports = {
  autoCheckoutForgottenSessions
};
