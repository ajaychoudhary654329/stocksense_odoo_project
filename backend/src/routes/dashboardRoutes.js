const express = require('express');
const { getDashboardMetrics } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getDashboardMetrics);

module.exports = router;
