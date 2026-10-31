const InventoryMovement = require('../models/InventoryMovement');
const MedicineBatch = require('../models/MedicineBatch');
const Medicine = require('../models/Medicine');

// @desc    Get inventory movements log
// @route   GET /api/inventory/movements
exports.getMovements = async (req, res, next) => {
  try {
    const { type, medicineId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (type) query.type = type;
    if (medicineId) query.medicine = medicineId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await InventoryMovement.countDocuments(query);
    const movements = await InventoryMovement.find(query)
      .populate('medicine', 'name genericName dosageForm')
      .populate('batch', 'batchNumber expiryDate rackLocation')
      .populate('performedBy', 'name email roleCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: movements,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory valuation and summary statistics
// @route   GET /api/inventory/summary
exports.getInventorySummary = async (req, res, next) => {
  try {
    const now = new Date();
    const ninetyDays = new Date();
    ninetyDays.setDate(now.getDate() + 90);

    const activeBatches = await MedicineBatch.find({
      quantity: { $gt: 0 },
    }).populate('medicine', 'name reorderLevel');

    let totalPurchaseCost = 0;
    let totalMrpValue = 0;
    let totalUnits = 0;
    let expiredBatchesCount = 0;
    let nearExpiryBatchesCount = 0;

    activeBatches.forEach((b) => {
      totalUnits += b.quantity;
      totalPurchaseCost += b.purchasePrice * b.quantity;
      totalMrpValue += b.mrp * b.quantity;

      const exp = new Date(b.expiryDate);
      if (exp <= now) {
        expiredBatchesCount++;
      } else if (exp <= ninetyDays) {
        nearExpiryBatchesCount++;
      }
    });

    const lowStockMedicines = await Medicine.countDocuments({
      isActive: true,
      $expr: { $lte: ['$totalStock', '$reorderLevel'] },
    });

    const totalMedicines = await Medicine.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        totalMedicines,
        totalUnits,
        totalPurchaseCost: parseFloat(totalPurchaseCost.toFixed(2)),
        totalMrpValue: parseFloat(totalMrpValue.toFixed(2)),
        lowStockMedicines,
        nearExpiryBatchesCount,
        expiredBatchesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
