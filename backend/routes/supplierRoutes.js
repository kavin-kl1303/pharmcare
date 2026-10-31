const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier } = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getSuppliers);
router.post('/', protect, authorize('ADMIN', 'INVENTORY_MANAGER', 'PHARMACIST'), createSupplier);
router.put('/:id', protect, authorize('ADMIN', 'INVENTORY_MANAGER'), updateSupplier);

module.exports = router;
