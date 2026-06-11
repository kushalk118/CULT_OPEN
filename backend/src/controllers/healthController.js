const db = require('../config/database');
const { logAction } = require('../utils/helpers');

async function getHealthReport(req, res) {
  try {
    const assets = await db.allAsync(`
      SELECT id, name, category, status, condition, quantity_total, quantity_available
      FROM assets
    `);

    const logs = await db.allAsync(`
      SELECT m.*, a.name as asset_name, u.name as reported_by_name
      FROM maintenance_logs m
      JOIN assets a ON m.asset_id = a.id
      JOIN users u ON m.reported_by = u.id
      ORDER BY m.created_at DESC
    `);

    res.json({ assets, logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch asset health details' });
  }
}

async function reportDamage(req, res) {
  try {
    const { asset_id, issue_description, condition } = req.body;
    if (!asset_id || !issue_description) {
      return res.status(400).json({ error: 'Asset ID and issue description are required' });
    }

    const asset = await db.getAsync('SELECT * FROM assets WHERE id = ?', [asset_id]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await db.runAsync(
      `INSERT INTO maintenance_logs (asset_id, reported_by, issue_description, status) VALUES (?, ?, ?, 'pending')`,
      [asset_id, req.user.id, issue_description]
    );

    const updatedCond = condition || 'damaged';
    await db.runAsync(
      `UPDATE assets SET condition = ?, status = 'maintenance' WHERE id = ?`,
      [updatedCond, asset_id]
    );

    await logAction(req.user.id, 'ASSET_DAMAGE_REPORTED', `Damage reported for ${asset.name}: ${issue_description}`);

    res.json({ message: 'Damage reported and asset moved to maintenance successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to report damage' });
  }
}

async function resolveMaintenance(req, res) {
  try {
    const { log_id, condition } = req.body;
    if (!log_id || !condition) {
      return res.status(400).json({ error: 'Log ID and new condition status are required' });
    }

    const log = await db.getAsync('SELECT * FROM maintenance_logs WHERE id = ?', [log_id]);
    if (!log) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }

    await db.runAsync("UPDATE maintenance_logs SET status = 'resolved' WHERE id = ?", [log_id]);

    await db.runAsync(
      `UPDATE assets SET status = 'active', condition = ? WHERE id = ?`,
      [condition, log.asset_id]
    );

    const asset = await db.getAsync('SELECT name FROM assets WHERE id = ?', [log.asset_id]);

    await logAction(req.user.id, 'MAINTENANCE_RESOLVED', `Resolved maintenance for ${asset ? asset.name : 'Asset ID ' + log.asset_id} to condition: ${condition}`);

    res.json({ message: 'Maintenance resolved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resolve maintenance' });
  }
}

module.exports = {
  getHealthReport,
  reportDamage,
  resolveMaintenance
};
