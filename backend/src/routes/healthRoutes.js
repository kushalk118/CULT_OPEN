const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, healthController.getHealthReport);
router.post('/report', authenticateToken, healthController.reportDamage);
router.post('/resolve', authenticateToken, requireAdmin, healthController.resolveMaintenance);

module.exports = router;
