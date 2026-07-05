const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

const verifyToken = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;

      // If roles are specified, check if the user's role matches
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient Permissions' });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or Expired Token' });
    }
  };
};

module.exports = { verifyToken };
