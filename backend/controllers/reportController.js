const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Medicine = require('../models/Medicine');
const Category = require('../models/Category');

// @desc    Get detailed financial and sales report by date range
// @route   GET /api/reports/sales
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { paymentStatus: 'PAID' };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    // Daily breakdown
    const dailyBreakdown = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$totalAmount' },
          totalCost: { $sum: '$costAmount' },
          totalProfit: { $sum: '$profitAmount' },
          totalTax: { $sum: '$taxAmount' },
          invoicesCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Summary totals
    const summaryAgg = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          grossRevenue: { $sum: '$subtotal' },
          totalDiscount: { $sum: '$discountAmount' },
          totalTax: { $sum: '$taxAmount' },
          netRevenue: { $sum: '$totalAmount' },
          totalCost: { $sum: '$costAmount' },
          netProfit: { $sum: '$profitAmount' },
          totalBills: { $sum: 1 },
        },
      },
    ]);

    const summary = summaryAgg[0] || {
      grossRevenue: 0,
      totalDiscount: 0,
      totalTax: 0,
      netRevenue: 0,
      totalCost: 0,
      netProfit: 0,
      totalBills: 0,
    };

    res.json({
      success: true,
      data: {
        summary: {
          ...summary,
          profitMargin: summary.netRevenue > 0 ? parseFloat(((summary.netProfit / summary.netRevenue) * 100).toFixed(1)) : 0,
        },
        dailyBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Medicine-wise sales & volume report
// @route   GET /api/reports/medicines
exports.getMedicineWiseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    const match = {};

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    const itemsAgg = await SaleItem.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$medicine',
          medicineName: { $first: '$medicineName' },
          totalQuantitySold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$total' },
          totalProfit: { $sum: '$itemProfit' },
          transactionsCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit, 10) },
    ]);

    // Populate category & current stock
    const medicineIds = itemsAgg.map((i) => i._id);
    const medicines = await Medicine.find({ _id: { $in: medicineIds } }).populate('category', 'name');
    const medMap = {};
    medicines.forEach((m) => {
      medMap[m._id] = m;
    });

    const report = itemsAgg.map((item) => {
      const med = medMap[item._id];
      return {
        ...item,
        categoryName: med?.category?.name || 'General',
        dosageForm: med?.dosageForm || 'Tablet',
        currentStock: med?.totalStock || 0,
      };
    });

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Category-wise sales report
// @route   GET /api/reports/categories
exports.getCategoryWiseReport = async (req, res, next) => {
  try {
    const report = await SaleItem.aggregate([
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicine',
          foreignField: '_id',
          as: 'medicineDoc',
        },
      },
      { $unwind: '$medicineDoc' },
      {
        $lookup: {
          from: 'categories',
          localField: 'medicineDoc.category',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryDoc._id',
          categoryName: { $first: '$categoryDoc.name' },
          totalUnitsSold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$total' },
          totalProfit: { $sum: '$itemProfit' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    const formatted = report.map((r) => ({
      categoryId: r._id,
      categoryName: r.categoryName || 'Uncategorized',
      totalUnitsSold: r.totalUnitsSold,
      totalRevenue: parseFloat(r.totalRevenue.toFixed(2)),
      totalProfit: parseFloat(r.totalProfit.toFixed(2)),
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Export sales data as CSV
// @route   GET /api/reports/export/csv
exports.exportSalesCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { paymentStatus: 'PAID' };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const sales = await Sale.find(query)
      .populate('dispensedBy', 'name licenseNumber')
      .sort({ createdAt: -1 });

    const headers = 'Invoice Number,Date,Customer Name,Phone,Doctor Name,Subtotal,Tax (GST),Discount,Total Amount,Net Profit,Pharmacist\n';
    const rows = sales.map((s) => {
      const date = new Date(s.createdAt).toLocaleDateString('en-IN');
      const invoice = `"${s.invoiceNumber}"`;
      const cust = `"${s.customerName || 'Walk-in'}"`;
      const phone = `"${s.customerPhone || ''}"`;
      const doc = `"${s.doctorName || ''}"`;
      const pharm = `"${s.dispensedBy?.name || ''}"`;
      return `${invoice},${date},${cust},${phone},${doc},${s.subtotal},${s.taxAmount},${s.discountAmount},${s.totalAmount},${s.profitAmount},${pharm}`;
    });

    const csvContent = headers + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="pharmacare_sales_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
