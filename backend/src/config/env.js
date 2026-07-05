const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'CV_SERVICE_SECRET'];
const missingEnv = [];

for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    missingEnv.push(envVar);
  }
}

if (missingEnv.length > 0) {
  console.error(`CRITICAL CONFIGURATION ERROR: Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  cvServiceSecret: process.env.CV_SERVICE_SECRET,
  port: parseInt(process.env.PORT, 10) || 5000
};
