const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Starting database seeding...');

  // 1. Create Tables
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

  console.log('Tables created successfully.');

  // 2. Seed default users
  const userCount = await db.getAsync('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const adminHash = await bcrypt.hash('admin123', 10);
    const consumerHash = await bcrypt.hash('consumer123', 10);

    await db.runAsync(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['Admin User', 'admin@example.com', adminHash, 'admin']
    );
    await db.runAsync(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['Consumer User', 'consumer@example.com', consumerHash, 'consumer']
    );
    console.log('Default users seeded: admin@example.com / consumer@example.com');
  }

  // 3. Seed default assets
  const assetCount = await db.getAsync('SELECT COUNT(*) as count FROM assets');
  if (assetCount.count === 0) {
    const initialAssets = [
      { name: 'Sony Alpha 7 III DSLR', category: 'DSLR Cameras', description: '24.2MP Mirrorless camera with 28-70mm lens, great for event coverage.', total: 3, cond: 'excellent' },
      { name: 'Canon EOS R6 Mark II', category: 'DSLR Cameras', description: 'Professional full-frame mirrorless camera.', total: 2, cond: 'excellent' },
      { name: 'Aputure Amaran 200d LED Light', category: 'Studio Lighting Equipment', description: 'Daylight-balanced LED light for video and photography.', total: 4, cond: 'good' },
      { name: 'Godox SL60W Studio Light', category: 'Studio Lighting Equipment', description: '60W continuous LED video light.', total: 5, cond: 'good' },
      { name: 'JBL EON715 Active PA Speaker', category: 'Audio Systems', description: '15-inch 1300W portable PA speaker with Bluetooth.', total: 4, cond: 'good' },
      { name: 'Rode Wireless GO II Microphone', category: 'Recording Equipment', description: 'Dual-channel wireless microphone system.', total: 6, cond: 'excellent' },
      { name: 'Zoom H6 Handy Recorder', category: 'Recording Equipment', description: '6-track portable field recorder.', total: 2, cond: 'excellent' },
      { name: 'Traditional Kathak Costumes', category: 'Costumes', description: 'Set of 5 traditional Kathak costumes for dance section.', total: 5, cond: 'good' },
      { name: 'Wooden Stage Platform (8x4 ft)', category: 'Event Infrastructure', description: 'Modular wooden platforms for stage setup.', total: 10, cond: 'good' },
      { name: 'Foldable Metal Props (Set of 10)', category: 'Stage Props', description: 'Metal structural props for theatrical designs.', total: 12, cond: 'good' }
    ];

    for (const asset of initialAssets) {
      const qrData = `CULT-ASSET-${asset.name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.runAsync(
        `INSERT INTO assets (name, category, description, quantity_total, quantity_available, status, condition, qr_code_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [asset.name, asset.category, asset.description, asset.total, asset.total, 'active', asset.cond, qrData]
      );
    }
    console.log('Initial assets seeded.');
  }

  // 4. Seed sample bookings
  const bookingCount = await db.getAsync('SELECT COUNT(*) as count FROM bookings');
  if (bookingCount.count === 0) {
    const user = await db.getAsync("SELECT id FROM users WHERE email = 'consumer@example.com'");
    const asset1 = await db.getAsync("SELECT id FROM assets WHERE name LIKE '%Sony%'");
    const asset2 = await db.getAsync("SELECT id FROM assets WHERE name LIKE '%JBL%'");

    if (user && asset1 && asset2) {
      await db.runAsync(
        `INSERT INTO bookings (user_id, asset_id, quantity, start_date, end_date, status, purpose, issued_at, returned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, asset1.id, 1, '2026-06-01', '2026-06-03', 'returned', 'Annual fest pre-shoot', '2026-06-01 10:00:00', '2026-06-03 17:00:00']
      );

      await db.runAsync(
        `INSERT INTO bookings (user_id, asset_id, quantity, start_date, end_date, status, purpose, issued_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, asset2.id, 2, '2026-06-10', '2026-06-15', 'issued', 'Music section rehearsal session', '2026-06-10 11:30:00']
      );

      await db.runAsync(`UPDATE assets SET quantity_available = quantity_total - 2 WHERE id = ?`, [asset2.id]);

      await db.runAsync(
        `INSERT INTO bookings (user_id, asset_id, quantity, start_date, end_date, status, purpose) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.id, asset1.id, 1, '2026-06-14', '2026-06-16', 'pending', 'Video shoot for web series']
      );

      console.log('Sample bookings seeded.');
    }
  }

  console.log('Database seeding finished successfully!');
  return;
}

module.exports = seed;
