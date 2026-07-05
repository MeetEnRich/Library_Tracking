const prisma = require('../config/db');
const sockets = require('../sockets');

/**
 * Handle a QR code scan by a student. Toggles check-in and check-out.
 */
async function handleQRScan(matricNo, qrToken) {
  const now = new Date();

  // 1. Verify zone exists
  const zone = await prisma.zone.findUnique({
    where: { qrToken }
  });

  if (!zone) {
    throw new Error('Invalid library zone QR code');
  }

  // 2. Verify student exists
  const student = await prisma.student.findUnique({
    where: { matricNo }
  });

  if (!student) {
    throw new Error('Student record not found');
  }

  // 3. Find any active check-in (log where exitTime is null)
  const activeLog = await prisma.log.findFirst({
    where: {
      matricNo,
      exitTime: null
    },
    include: { zone: true }
  });

  let action = 'in';
  let log = null;

  if (activeLog) {
    if (activeLog.zoneId === zone.id) {
      // Checked in to the SAME zone -> Check-out
      log = await prisma.log.update({
        where: { id: activeLog.id },
        data: { exitTime: now }
      });
      action = 'out';
      
      // Get new occupancy count for this zone
      const activeCount = await prisma.log.count({
        where: { zoneId: zone.id, exitTime: null }
      });

      // Save snapshot and broadcast
      await prisma.occupancySnapshot.create({
        data: {
          zoneId: zone.id,
          source: 'qr',
          count: activeCount,
          timestamp: now
        }
      });

      sockets.broadcast('occupancy:update', {
        zoneId: zone.id,
        occupied: activeCount,
        totalSeats: zone.totalSeats,
        source: 'qr',
        timestamp: now
      });

    } else {
      // Checked in to a DIFFERENT zone -> Auto-checkout old, check-in new
      // Checkout old zone
      await prisma.log.update({
        where: { id: activeLog.id },
        data: { exitTime: now }
      });

      const oldZoneActiveCount = await prisma.log.count({
        where: { zoneId: activeLog.zoneId, exitTime: null }
      });

      await prisma.occupancySnapshot.create({
        data: {
          zoneId: activeLog.zoneId,
          source: 'qr',
          count: oldZoneActiveCount,
          timestamp: now
        }
      });

      sockets.broadcast('occupancy:update', {
        zoneId: activeLog.zoneId,
        occupied: oldZoneActiveCount,
        totalSeats: activeLog.zone.totalSeats,
        source: 'qr',
        timestamp: now
      });

      // Check-in new zone
      log = await prisma.log.create({
        data: {
          matricNo,
          zoneId: zone.id,
          entryTime: now
        }
      });
      action = 'in';

      const newZoneActiveCount = await prisma.log.count({
        where: { zoneId: zone.id, exitTime: null }
      });

      await prisma.occupancySnapshot.create({
        data: {
          zoneId: zone.id,
          source: 'qr',
          count: newZoneActiveCount,
          timestamp: now
        }
      });

      sockets.broadcast('occupancy:update', {
        zoneId: zone.id,
        occupied: newZoneActiveCount,
        totalSeats: zone.totalSeats,
        source: 'qr',
        timestamp: now
      });
    }
  } else {
    // No active log -> Check-in
    log = await prisma.log.create({
      data: {
        matricNo,
        zoneId: zone.id,
        entryTime: now
      }
    });
    action = 'in';

    const activeCount = await prisma.log.count({
      where: { zoneId: zone.id, exitTime: null }
    });

    await prisma.occupancySnapshot.create({
      data: {
        zoneId: zone.id,
        source: 'qr',
        count: activeCount,
        timestamp: now
      }
    });

    sockets.broadcast('occupancy:update', {
      zoneId: zone.id,
      occupied: activeCount,
      totalSeats: zone.totalSeats,
      source: 'qr',
      timestamp: now
    });
  }

  return {
    action,
    zoneName: zone.name,
    log
  };
}

/**
 * Handle occupancy updates received from the CV Camera Service.
 */
async function handleCVUpdate(zoneId, count) {
  const now = new Date();

  // Verify zone exists
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId }
  });

  if (!zone) {
    throw new Error('Zone not found');
  }

  // Create Occupancy Snapshot for CV
  const snapshot = await prisma.occupancySnapshot.create({
    data: {
      zoneId,
      source: 'cv',
      count,
      timestamp: now
    }
  });

  // Broadcast the update
  sockets.broadcast('occupancy:update', {
    zoneId: zone.id,
    occupied: count,
    totalSeats: zone.totalSeats,
    source: 'cv',
    timestamp: now
  });

  return snapshot;
}

/**
 * Get the current occupancy stats across all library zones.
 * Combines both QR (logs) and CV (latest snapshot).
 */
async function getLiveOccupancy() {
  const zones = await prisma.zone.findMany();
  const results = [];

  for (const zone of zones) {
    // Get QR count (active logs)
    const qrOccupied = await prisma.log.count({
      where: { zoneId: zone.id, exitTime: null }
    });

    // Get CV count (latest cv snapshot in the last 15 minutes, otherwise default to qrOccupied or 0)
    const latestCVSnapshot = await prisma.occupancySnapshot.findFirst({
      where: {
        zoneId: zone.id,
        source: 'cv',
        timestamp: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // 15 mins fresh
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    const cvOccupied = latestCVSnapshot ? latestCVSnapshot.count : qrOccupied;

    results.push({
      zoneId: zone.id,
      name: zone.name,
      totalSeats: zone.totalSeats,
      qrOccupied,
      cvOccupied,
      qrToken: zone.qrToken
    });
  }

  return results;
}

module.exports = {
  handleQRScan,
  handleCVUpdate,
  getLiveOccupancy
};
