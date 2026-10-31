const express = require('express');
const router = express.Router();
const { getMovements, getInventorySummary } = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.get('/movements', protect, getMovements);
router.get('/summary', protect, getInventorySummary);

module.exports = router;
