const db = require('../config/database');
const qr = require('qrcode');
const { logAction } = require('../utils/helpers');

async function getAllAssets(req, res) {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM assets';
    const params = [];

    if (category || search) {
      query += ' WHERE';
      const clauses = [];
      if (category) {
        clauses.push(' category = ?');
        params.push(category);
      }
      if (search) {
        clauses.push(' (name LIKE ? OR description LIKE ? OR qr_code_data LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      query += clauses.join(' AND');
    }

    const assets = await db.allAsync(query, params);
    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
}

async function getAssetById(req, res) {
  try {
    const asset = await db.getAsync('SELECT * FROM assets WHERE id = ?', [req.params.id]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    const qrDataUrl = await qr.toDataURL(asset.qr_code_data || `CULT-ASSET-${asset.id}`);
    res.json({ ...asset, qr_code_data_url: qrDataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
}

async function getAssetByQR(req, res) {
  try {
    const { qrCodeText } = req.query;
    if (!qrCodeText) {
      return res.status(400).json({ error: 'QR Code text is required' });
    }
    const asset = await db.getAsync('SELECT * FROM assets WHERE qr_code_data = ?', [qrCodeText]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found for scanned QR code' });
    }
    const qrDataUrl = await qr.toDataURL(asset.qr_code_data);
    res.json({ ...asset, qr_code_data_url: qrDataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to find asset by QR code' });
  }
}

async function createAsset(req, res) {
  try {
    const { name, category, description, quantity_total, status, condition } = req.body;
    if (!name || !category || quantity_total === undefined) {
      return res.status(400).json({ error: 'Name, category, and total quantity are required' });
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const cleanedName = name.replace(/[^A-Za-z0-9]/g, '');
    const codePrefix = (cleanedName.substring(0, 3).toUpperCase() || 'AST');
    const qrCodeText = `CULT-ASSET-${codePrefix}-${randomCode}`;

    const totalQty = parseInt(quantity_total, 10);
    const assetStatus = status || 'active';
    const assetCond = condition || 'excellent';

    const result = await db.runAsync(
      `INSERT INTO assets (name, category, description, quantity_total, quantity_available, status, condition, qr_code_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, description, totalQty, totalQty, assetStatus, assetCond, qrCodeText]
    );

    await logAction(req.user.id, 'ASSET_CREATED', `Created asset ${name} in category ${category} with quantity ${totalQty}`);

    res.status(201).json({ id: result.lastID, name, category, description, quantity_total: totalQty, quantity_available: totalQty, status: assetStatus, condition: assetCond, qr_code_data: qrCodeText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
}

async function updateAsset(req, res) {
  try {
    const { name, category, description, quantity_total, status, condition } = req.body;
    const assetId = req.params.id;

    const currentAsset = await db.getAsync('SELECT * FROM assets WHERE id = ?', [assetId]);
    if (!currentAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const newTotal = quantity_total !== undefined ? parseInt(quantity_total, 10) : currentAsset.quantity_total;
    const qtyDiff = newTotal - currentAsset.quantity_total;
    const newAvailable = currentAsset.quantity_available + qtyDiff;

    if (newAvailable < 0) {
      return res.status(400).json({ error: 'New quantity total is less than currently checked-out quantity' });
    }

    const updatedName = name || currentAsset.name;
    const updatedCategory = category || currentAsset.category;
    const updatedDesc = description !== undefined ? description : currentAsset.description;
    const updatedStatus = status || currentAsset.status;
    const updatedCondition = condition || currentAsset.condition;

    await db.runAsync(
      `UPDATE assets SET name = ?, category = ?, description = ?, quantity_total = ?, quantity_available = ?, status = ?, condition = ? WHERE id = ?`,
      [updatedName, updatedCategory, updatedDesc, newTotal, newAvailable, updatedStatus, updatedCondition, assetId]
    );

    await logAction(req.user.id, 'ASSET_UPDATED', `Updated asset ${updatedName} (ID: ${assetId})`);

    res.json({ id: assetId, name: updatedName, category: updatedCategory, description: updatedDesc, quantity_total: newTotal, quantity_available: newAvailable, status: updatedStatus, condition: updatedCondition, qr_code_data: currentAsset.qr_code_data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update asset' });
  }
}

async function deleteAsset(req, res) {
  try {
    const assetId = req.params.id;
    const asset = await db.getAsync('SELECT * FROM assets WHERE id = ?', [assetId]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await db.runAsync('DELETE FROM assets WHERE id = ?', [assetId]);
    await logAction(req.user.id, 'ASSET_DELETED', `Deleted asset ${asset.name} (ID: ${assetId})`);

    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
}

module.exports = {
  getAllAssets,
  getAssetById,
  getAssetByQR,
  createAsset,
  updateAsset,
  deleteAsset
};
