const db = require('../config/database');

async function getAuditLogs(req, res) {
  try {
    const logs = await db.allAsync(`
      SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

async function getNotifications(req, res) {
  try {
    const logs = await db.allAsync(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const notifId = req.params.id;
    await db.runAsync(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [notifId, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
}

module.exports = {
  getAuditLogs,
  getNotifications,
  markNotificationAsRead
};
