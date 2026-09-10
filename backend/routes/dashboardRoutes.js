const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/stats', optionalAuth, getDashboardStats);

module.exports = router;
