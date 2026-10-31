const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  receiveStock,
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getPurchaseOrders);
router.get('/:id', protect, getPurchaseOrderById);
router.post(
  '/',
  protect,
  authorize('ADMIN', 'INVENTORY_MANAGER', 'PHARMACIST'),
  createPurchaseOrder
);
router.post(
  '/:id/receipts',
  protect,
  authorize('ADMIN', 'INVENTORY_MANAGER', 'PHARMACIST'),
  receiveStock
);

module.exports = router;
