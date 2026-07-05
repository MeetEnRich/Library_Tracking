const { cvServiceSecret } = require('../config/env');

const verifyCVService = (req, res, next) => {
  const authHeader = req.headers['x-cv-service-key'];

  if (!authHeader || authHeader !== cvServiceSecret) {
    return res.status(401).json({ message: 'Access Denied: Invalid CV Service Key' });
  }

  next();
};

module.exports = { verifyCVService };
