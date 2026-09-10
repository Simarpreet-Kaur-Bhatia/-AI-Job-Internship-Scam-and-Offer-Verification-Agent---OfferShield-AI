const mongoose = require('mongoose');
const { mongoUri } = require('./config');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.warn('Running in demo mode without database connection.');
    return null;
  }
};

module.exports = connectDB;
