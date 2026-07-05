const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { jwtSecret } = require('../config/env');

/**
 * Register a new student.
 */
async function registerStudent(req, res, next) {
  try {
    const { matricNo, name, department, password } = req.body;

    if (!matricNo || !name || !department || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if student already exists
    const existingStudent = await prisma.student.findUnique({
      where: { matricNo }
    });

    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this matriculation number already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create student
    const student = await prisma.student.create({
      data: {
        matricNo,
        name,
        department,
        passwordHash
      }
    });

    res.status(201).json({
      message: 'Student registered successfully',
      student: {
        matricNo: student.matricNo,
        name: student.name,
        department: student.department
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Log in a student.
 */
async function loginStudent(req, res, next) {
  try {
    const { matricNo, password } = req.body;

    if (!matricNo || !password) {
      return res.status(400).json({ message: 'Matriculation number and password are required' });
    }

    // Find student
    const student = await prisma.student.findUnique({
      where: { matricNo }
    });

    if (!student) {
      return res.status(401).json({ message: 'Invalid matriculation number or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, student.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid matriculation number or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { matricNo: student.matricNo, name: student.name, role: 'student' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        matricNo: student.matricNo,
        name: student.name,
        department: student.department,
        role: 'student'
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Log in an administrator.
 */
async function loginAdmin(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: admin.username, role: 'admin' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        username: admin.username,
        role: 'admin'
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerStudent,
  loginStudent,
  loginAdmin
};
