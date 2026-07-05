const prisma = require('../config/db');
const occupancyService = require('../services/occupancy.service');
const reportService = require('../services/report.service');

/**
 * Get aggregated statistics for the admin dashboard.
 */
async function getDashboardStats(req, res, next) {
  try {
    const liveZones = await occupancyService.getLiveOccupancy();

    const totalStudents = await prisma.student.count();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const checkinsToday = await prisma.log.count({
      where: {
        entryTime: {
          gte: startOfToday
        }
      }
    });

    const activeCheckins = await prisma.log.count({
      where: {
        exitTime: null
      }
    });

    // Recent activity feed (latest 10 logs)
    const recentActivity = await prisma.log.findMany({
      take: 10,
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

    res.status(200).json({
      liveZones,
      metrics: {
        totalStudents,
        checkinsToday,
        activeCheckins
      },
      recentActivity
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get historical logs for reports.
 */
async function getReports(req, res, next) {
  try {
    const { zoneId, from, to } = req.query;

    const logs = await reportService.generateHistoricalReport(zoneId, from, to);

    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
}

/**
 * Get list of all registered students.
 */
async function getStudents(req, res, next) {
  try {
    const students = await prisma.student.findMany({
      select: {
        matricNo: true,
        name: true,
        department: true,
        createdAt: true,
        _count: {
          select: { logs: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.status(200).json(students);
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a student record.
 */
async function deleteStudent(req, res, next) {
  try {
    const { matricNo } = req.params;

    await prisma.student.delete({
      where: { matricNo }
    });

    res.status(200).json({ message: 'Student record deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a specific log record.
 */
async function deleteLog(req, res, next) {
  try {
    const logId = parseInt(req.params.id, 10);

    if (isNaN(logId)) {
      return res.status(400).json({ message: 'Invalid log ID' });
    }

    await prisma.log.delete({
      where: { id: logId }
    });

    res.status(200).json({ message: 'Log record deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
  getReports,
  getStudents,
  deleteStudent,
  deleteLog
};
