const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/stats', authenticateToken, dashboardController.getStats);
router.get('/charts', authenticateToken, requireAdmin, dashboardController.getChartsData);

module.exports = router;
