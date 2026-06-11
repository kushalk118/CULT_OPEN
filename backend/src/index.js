const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const seed = require('./seed');

const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const healthRoutes = require('./routes/healthRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/audit', auditRoutes);

app.get('/healthz', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

async function initDb() {
  try {
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'consumer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        quantity_total INTEGER NOT NULL,
        quantity_available INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        condition TEXT DEFAULT 'excellent',
        qr_code_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        asset_id INTEGER,
        quantity INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        purpose TEXT,
        issued_at TEXT,
        returned_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
      )
    `);
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER,
        reported_by INTEGER,
        issue_description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
        FOREIGN KEY(reported_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Database schema validated.');
  } catch (err) {
    console.error('Failed to validate database schema on startup:', err);
  }
}

app.listen(PORT, async () => {
  await initDb();
  await seed();
  console.log(`Server is running on port ${PORT}`);
});