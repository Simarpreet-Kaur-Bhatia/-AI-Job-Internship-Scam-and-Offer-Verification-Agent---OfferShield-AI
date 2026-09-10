const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/offershield',
  jwtSecret: process.env.JWT_SECRET || 'offershield_dev_secret_2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
