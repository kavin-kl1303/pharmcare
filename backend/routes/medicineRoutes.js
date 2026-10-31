const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getCategories,
} = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/auth');

router.get('/categories', protect, getCategories);
router.get('/', protect, getMedicines);
router.get('/:id', protect, getMedicineById);

router.post(
  '/',
  protect,
  authorize('ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'),
  createMedicine
);

router.put(
  '/:id',
  protect,
  authorize('ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'),
  updateMedicine
);

router.delete(
  '/:id',
  protect,
  authorize('ADMIN', 'INVENTORY_MANAGER'),
  deleteMedicine
);

module.exports = router;
