const express = require('express');
const router = express.Router();
const { getBatches, createBatch, adjustStock } = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getBatches);
router.post(
  '/',
  protect,
  authorize('ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'),
  createBatch
);
router.post(
  '/:id/adjust',
  protect,
  authorize('ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'),
  adjustStock
);

module.exports = router;
