const express = require('express');
const router = express.Router();
const { createSale, getSales, getSaleById } = require('../controllers/saleController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getSales);
router.get('/:id', protect, getSaleById);
router.post('/', protect, createSale);

module.exports = router;
