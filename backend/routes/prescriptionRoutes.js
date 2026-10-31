const express = require('express');
const router = express.Router();
const {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  verifyPrescription,
} = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getPrescriptions);
router.get('/:id', protect, getPrescriptionById);
router.post('/', protect, createPrescription);
router.put('/:id/verify', protect, authorize('ADMIN', 'PHARMACIST'), verifyPrescription);

module.exports = router;
