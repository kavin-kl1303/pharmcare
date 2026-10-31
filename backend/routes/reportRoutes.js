const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getMedicineWiseReport,
  getCategoryWiseReport,
  exportSalesCSV,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/sales', protect, getSalesReport);
router.get('/medicines', protect, getMedicineWiseReport);
router.get('/categories', protect, getCategoryWiseReport);
router.get('/export/csv', protect, exportSalesCSV);

module.exports = router;
