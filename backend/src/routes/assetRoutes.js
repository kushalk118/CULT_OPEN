const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, assetController.getAllAssets);
router.get('/qr', authenticateToken, assetController.getAssetByQR);
router.get('/:id', authenticateToken, assetController.getAssetById);
router.post('/', authenticateToken, requireAdmin, assetController.createAsset);
router.put('/:id', authenticateToken, requireAdmin, assetController.updateAsset);
router.delete('/:id', authenticateToken, requireAdmin, assetController.deleteAsset);

module.exports = router;
