const prisma = require('../config/db');

/**
 * Get profile of logged-in student.
 */
async function getMe(req, res, next) {
  try {
    const { matricNo } = req.user;

    const student = await prisma.student.findUnique({
      where: { matricNo },
      select: {
        matricNo: true,
        name: true,
        department: true,
        createdAt: true
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json(student);
  } catch (err) {
    next(err);
  }
}

/**
 * Get check-in history of logged-in student.
 */
async function getMyHistory(req, res, next) {
  try {
    const { matricNo } = req.user;

    const history = await prisma.log.findMany({
      where: { matricNo },
      include: {
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

    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  getMyHistory
};
