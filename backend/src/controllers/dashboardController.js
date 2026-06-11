const db = require('../config/database');

async function getStats(req, res) {
  try {
    const today = new Date().toISOString().substring(0, 10);

    const totalAssets = await db.getAsync('SELECT SUM(quantity_total) as total, SUM(quantity_available) as available FROM assets');
    const pendingBookings = await db.getAsync("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'");
    const activeAllocations = await db.getAsync("SELECT COUNT(*) as count FROM bookings WHERE status = 'issued'");
    const overdueReturns = await db.getAsync("SELECT COUNT(*) as count FROM bookings WHERE status = 'issued' AND end_date < ?", [today]);

    res.json({
      total_inventory: totalAssets.total || 0,
      available_inventory: totalAssets.available || 0,
      pending_requests: pendingBookings.count || 0,
      active_bookings: activeAllocations.count || 0,
      overdue_returns: overdueReturns.count || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

async function getChartsData(req, res) {
  try {
    const topAssets = await db.allAsync(`
      SELECT a.name, COUNT(b.id) as booking_count
      FROM bookings b
      JOIN assets a ON b.asset_id = a.id
      GROUP BY a.id
      ORDER BY booking_count DESC
      LIMIT 5
    `);

    const categoryDistribution = await db.allAsync(`
      SELECT a.category, COUNT(b.id) as booking_count
      FROM bookings b
      JOIN assets a ON b.asset_id = a.id
      GROUP BY a.category
      ORDER BY booking_count DESC
    `);

    const healthStats = await db.allAsync(`
      SELECT condition, COUNT(*) as count
      FROM assets
      GROUP BY condition
    `);

    const monthlyTrends = await db.allAsync(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM bookings
      GROUP BY month
      ORDER BY month ASC
      LIMIT 6
    `);

    res.json({
      top_assets: topAssets,
      category_bookings: categoryDistribution,
      health_stats: healthStats,
      monthly_trends: monthlyTrends
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chart analytics data' });
  }
}

module.exports = {
  getStats,
  getChartsData
};
