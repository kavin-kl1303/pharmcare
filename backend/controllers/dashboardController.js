const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get dashboard metrics computed live from MongoDB
// @route   GET /api/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { period = 'today', startDate, endDate } = req.query;

    const now = new Date();
    let queryStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    let queryEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (period === 'yesterday') {
      queryStart.setDate(queryStart.getDate() - 1);
      queryEnd = new Date(queryStart);
      queryEnd.setHours(23, 59, 59, 999);
    } else if (period === '7days') {
      queryStart = new Date();
      queryStart.setDate(queryStart.getDate() - 7);
      queryStart.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      queryStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (period === 'custom' && startDate && endDate) {
      queryStart = new Date(startDate);
      queryEnd = new Date(endDate);
      queryEnd.setHours(23, 59, 59, 999);
    }

    // 1. Sales & Profit in chosen period using MongoDB aggregation
    const salesAgg = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: queryStart, $lte: queryEnd },
          paymentStatus: 'PAID',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalCost: { $sum: '$costAmount' },
          totalProfit: { $sum: '$profitAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const periodSales = salesAgg[0] || { totalRevenue: 0, totalCost: 0, totalProfit: 0, count: 0 };
    const netRevenue = parseFloat((periodSales.totalRevenue || 0).toFixed(2));
    const netProfit = parseFloat((periodSales.totalProfit || 0).toFixed(2));
    const profitMargin = netRevenue > 0 ? parseFloat(((netProfit / netRevenue) * 100).toFixed(1)) : 0;
    const avgBillValue = periodSales.count > 0 ? parseFloat((netRevenue / periodSales.count).toFixed(2)) : 0;

    // 2. Inventory Totals
    const totalMedicines = await Medicine.countDocuments({ isActive: true });
    const lowStockMedicines = await Medicine.countDocuments({
      isActive: true,
      $expr: { $lte: ['$totalStock', '$reorderLevel'] },
    });

    // 3. Batches Totals (Valuation, Expired, Near-Expiry)
    const ninetyDays = new Date();
    ninetyDays.setDate(now.getDate() + 90);

    const batches = await MedicineBatch.find({ quantity: { $gt: 0 } });
    let inventoryCostValuation = 0;
    let inventoryMrpValuation = 0;
    let totalStockUnits = 0;
    let expiredBatchesCount = 0;
    let nearExpiryBatchesCount = 0;

    batches.forEach((b) => {
      totalStockUnits += b.quantity;
      inventoryCostValuation += b.purchasePrice * b.quantity;
      inventoryMrpValuation += b.mrp * b.quantity;

      const exp = new Date(b.expiryDate);
      if (exp <= now) {
        expiredBatchesCount++;
      } else if (exp <= ninetyDays) {
        nearExpiryBatchesCount++;
      }
    });

    // 4. Recent Sales (latest 10)
    const recentSales = await Sale.find({ paymentStatus: 'PAID' })
      .populate('dispensedBy', 'name licenseNumber')
      .sort({ createdAt: -1 })
      .limit(10);

    // 5. Purchase Orders counts
    const pendingPOs = await PurchaseOrder.countDocuments({ status: { $in: ['PENDING', 'PARTIALLY_RECEIVED'] } });

    // 6. Last 7 days trend aggregation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrend = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          paymentStatus: 'PAID',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          profit: { $sum: '$profitAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        financials: {
          period,
          totalRevenue: netRevenue,
          totalProfit: netProfit,
          profitMargin,
          billCount: periodSales.count,
          avgBillValue,
        },
        inventory: {
          totalMedicines,
          totalStockUnits,
          costValuation: parseFloat(inventoryCostValuation.toFixed(2)),
          mrpValuation: parseFloat(inventoryMrpValuation.toFixed(2)),
          lowStockMedicines,
          nearExpiryBatchesCount,
          expiredBatchesCount,
        },
        orders: {
          pendingPOs,
        },
        dailyTrend,
        recentSales,
      },
    });
  } catch (error) {
    next(error);
  }
};
