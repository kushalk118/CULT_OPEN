const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/logs', authenticateToken, requireAdmin, auditController.getAuditLogs);
router.get('/notifications', authenticateToken, auditController.getNotifications);
router.patch('/notifications/:id/read', authenticateToken, auditController.markNotificationAsRead);

module.exports = router;
