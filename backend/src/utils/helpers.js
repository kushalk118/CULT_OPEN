const db = require('../config/database');

async function logAction(userId, action, details) {
  try {
    await db.runAsync(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)`,
      [userId || null, action, details]
    );
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

async function sendNotification(userId, message) {
  try {
    await db.runAsync(
      `INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
      [userId, message]
    );
  } catch (err) {
    console.error('Notification insertion failed:', err);
  }
}

module.exports = {
  logAction,
  sendNotification
};
