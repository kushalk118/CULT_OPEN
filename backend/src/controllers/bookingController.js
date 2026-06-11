const db = require('../config/database');
const { logAction, sendNotification } = require('../utils/helpers');

async function createBooking(req, res) {
  try {
    const { asset_id, quantity, start_date, end_date, purpose } = req.body;
    const userId = req.user.id;

    if (!asset_id || !quantity || !start_date || !end_date) {
      return res.status(400).json({ error: 'Asset ID, quantity, start date, and end date are required' });
    }

    const qty = parseInt(quantity, 10);
    if (qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero' });
    }

    const asset = await db.getAsync('SELECT * FROM assets WHERE id = ?', [asset_id]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.status !== 'active') {
      return res.status(400).json({ error: 'Asset is currently not active/available' });
    }

    if (asset.quantity_available < qty) {
      return res.status(400).json({ error: 'Requested quantity exceeds available inventory' });
    }

    const result = await db.runAsync(
      `INSERT INTO bookings (user_id, asset_id, quantity, start_date, end_date, purpose, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, asset_id, qty, start_date, end_date, purpose || '']
    );

    const admins = await db.allAsync("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
      await sendNotification(admin.id, `New booking request: ${qty}x ${asset.name} by ${req.user.email}`);
    }

    await sendNotification(userId, `Your booking request for ${qty}x ${asset.name} has been submitted.`);
    await logAction(userId, 'BOOKING_REQUESTED', `Requested ${qty}x ${asset.name} (Booking ID: ${result.lastID})`);

    res.status(201).json({ id: result.lastID, asset_id, quantity: qty, start_date, end_date, purpose, status: 'pending' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking request' });
  }
}

async function getAllBookings(req, res) {
  try {
    let query = `
      SELECT b.*, u.name as user_name, u.email as user_email, a.name as asset_name, a.category as asset_category, a.qr_code_data as asset_qr
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN assets a ON b.asset_id = a.id
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ' WHERE b.user_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY b.created_at DESC';

    const bookings = await db.allAsync(query, params);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

async function updateBookingStatus(req, res) {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status update. Must be approved or rejected' });
    }

    const booking = await db.getAsync('SELECT b.*, a.name as asset_name FROM bookings b JOIN assets a ON b.asset_id = a.id WHERE b.id = ?', [bookingId]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking status can only be updated from pending' });
    }

    await db.runAsync('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);

    await sendNotification(booking.user_id, `Your booking request for ${booking.quantity}x ${booking.asset_name} was ${status}.`);
    await logAction(req.user.id, `BOOKING_${status.toUpperCase()}`, `Booking ID ${bookingId} was ${status} by admin`);

    res.json({ message: `Booking status updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
}

async function issueBooking(req, res) {
  try {
    const bookingId = req.params.id;
    const booking = await db.getAsync('SELECT b.*, a.name as asset_name, a.quantity_available, a.status as asset_status FROM bookings b JOIN assets a ON b.asset_id = a.id WHERE b.id = ?', [bookingId]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved bookings can be issued' });
    }

    if (booking.quantity_available < booking.quantity) {
      return res.status(400).json({ error: 'Insufficient available inventory to issue this asset now' });
    }

    await db.runAsync('UPDATE assets SET quantity_available = quantity_available - ? WHERE id = ?', [booking.quantity, booking.asset_id]);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await db.runAsync("UPDATE bookings SET status = 'issued', issued_at = ? WHERE id = ?", [nowStr, bookingId]);

    await sendNotification(booking.user_id, `Asset ${booking.asset_name} (x${booking.quantity}) has been issued to you.`);
    await logAction(req.user.id, 'ASSET_ISSUED', `Issued ${booking.quantity}x ${booking.asset_name} for Booking ID ${bookingId}`);

    res.json({ message: 'Asset issued successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to issue asset' });
  }
}

async function returnBooking(req, res) {
  try {
    const bookingId = req.params.id;
    const { condition, maintenance_reported, issue_description } = req.body;

    const booking = await db.getAsync('SELECT b.*, a.name as asset_name, a.condition as asset_cond FROM bookings b JOIN assets a ON b.asset_id = a.id WHERE b.id = ?', [bookingId]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'issued') {
      return res.status(400).json({ error: 'Only issued assets can be returned' });
    }

    await db.runAsync('UPDATE assets SET quantity_available = quantity_available + ? WHERE id = ?', [booking.quantity, booking.asset_id]);

    if (condition) {
      await db.runAsync('UPDATE assets SET condition = ? WHERE id = ?', [condition, booking.asset_id]);
    }

    if (maintenance_reported && issue_description) {
      await db.runAsync(
        'INSERT INTO maintenance_logs (asset_id, reported_by, issue_description, status) VALUES (?, ?, ?, ?)',
        [booking.asset_id, req.user.id, issue_description, 'pending']
      );
      await db.runAsync("UPDATE assets SET status = 'maintenance' WHERE id = ?", [booking.asset_id]);
      await logAction(req.user.id, 'ASSET_SENT_TO_MAINTENANCE', `Asset ID ${booking.asset_id} sent to maintenance: ${issue_description}`);
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await db.runAsync("UPDATE bookings SET status = 'returned', returned_at = ? WHERE id = ?", [nowStr, bookingId]);

    await sendNotification(booking.user_id, `Asset ${booking.asset_name} (x${booking.quantity}) has been successfully returned.`);
    await logAction(req.user.id, 'ASSET_RETURNED', `Returned ${booking.quantity}x ${booking.asset_name} for Booking ID ${bookingId}`);

    res.json({ message: 'Asset returned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to return asset' });
  }
}

module.exports = {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  issueBooking,
  returnBooking
};
