const MedicineBatch = require('../models/MedicineBatch');
const Medicine = require('../models/Medicine');
const InventoryMovement = require('../models/InventoryMovement');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// Helper to update a medicine's totalStock from its active batches
const syncMedicineTotalStock = async (medicineId) => {
  const batches = await MedicineBatch.find({
    medicine: medicineId,
    status: { $in: ['ACTIVE', 'NEAR_EXPIRY'] },
    quantity: { $gt: 0 },
  });
  const total = batches.reduce((sum, b) => sum + b.quantity, 0);
  await Medicine.findByIdAndUpdate(medicineId, { totalStock: total });
  return total;
};

// @desc    Get batches with status filters (all, near-expiry, expired, active)
// @route   GET /api/batches
exports.getBatches = async (req, res, next) => {
  try {
    const { status, medicineId, search, page = 1, limit = 50 } = req.query;
    const now = new Date();
    const query = {};

    if (medicineId) {
      query.medicine = medicineId;
    }

    if (search) {
      query.batchNumber = new RegExp(search, 'i');
    }

    if (status === 'EXPIRED') {
      query.$or = [{ status: 'EXPIRED' }, { expiryDate: { $lte: now } }];
    } else if (status === 'NEAR_EXPIRY') {
      const ninetyDays = new Date();
      ninetyDays.setDate(now.getDate() + 90);
      query.expiryDate = { $gt: now, $lte: ninetyDays };
      query.quantity = { $gt: 0 };
    } else if (status === 'ACTIVE') {
      query.expiryDate = { $gt: now };
      query.quantity = { $gt: 0 };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await MedicineBatch.countDocuments(query);
    const batches = await MedicineBatch.find(query)
      .populate('medicine', 'name genericName dosageForm strength schedule rackLocation reorderLevel')
      .populate('supplier', 'companyName name')
      .sort({ expiryDate: 1 })
      .skip(skip)
      .limit(limitNum);

    // Update statuses dynamically
    const enrichedBatches = batches.map((batch) => {
      batch.updateStatusBasedOnDate();
      return batch;
    });

    res.json({
      success: true,
      data: enrichedBatches,
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

// @desc    Add a new batch to a medicine
// @route   POST /api/batches
exports.createBatch = async (req, res, next) => {
  try {
    const {
      medicineId,
      batchNumber,
      manufacturingDate,
      expiryDate,
      purchasePrice,
      mrp,
      sellingPrice,
      quantity,
      supplierId,
      rackLocation,
    } = req.body;

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check duplicate batch
    const existing = await MedicineBatch.findOne({ medicine: medicineId, batchNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: `Batch ${batchNumber} already exists for this medicine` });
    }

    const batch = new MedicineBatch({
      medicine: medicineId,
      batchNumber,
      manufacturingDate,
      expiryDate,
      purchasePrice,
      mrp,
      sellingPrice,
      initialQuantity: quantity,
      quantity,
      supplier: supplierId || undefined,
      rackLocation: rackLocation || medicine.rackLocation,
    });

    batch.updateStatusBasedOnDate();
    await batch.save();

    // Sync medicine total stock
    await syncMedicineTotalStock(medicineId);

    // Record movement
    await InventoryMovement.create({
      medicine: medicineId,
      batch: batch._id,
      type: 'ADJUSTMENT_ADD',
      quantity,
      previousStock: 0,
      newStock: quantity,
      reason: 'Direct batch creation / opening stock',
      performedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Batch added successfully',
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Adjust batch stock (add, deduct, discard expired)
// @route   POST /api/batches/:id/adjust
exports.adjustStock = async (req, res, next) => {
  try {
    const { adjustmentType, quantity, reason } = req.body;
    const batch = await MedicineBatch.findById(req.params.id).populate('medicine');
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const changeQty = Math.abs(parseInt(quantity, 10));
    const previousStock = batch.quantity;
    let newStock = previousStock;

    if (adjustmentType === 'ADD') {
      newStock = previousStock + changeQty;
    } else if (adjustmentType === 'DEDUCT' || adjustmentType === 'EXPIRED_DISCARD') {
      if (previousStock < changeQty) {
        return res.status(400).json({
          success: false,
          message: `Cannot deduct ${changeQty} units. Only ${previousStock} units available in batch.`,
        });
      }
      newStock = previousStock - changeQty;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid adjustmentType (ADD, DEDUCT, EXPIRED_DISCARD)' });
    }

    batch.quantity = newStock;
    batch.updateStatusBasedOnDate();
    await batch.save();

    // Sync medicine stock
    const updatedTotal = await syncMedicineTotalStock(batch.medicine._id);

    // Record inventory movement
    const movement = await InventoryMovement.create({
      medicine: batch.medicine._id,
      batch: batch._id,
      type: adjustmentType === 'ADD' ? 'ADJUSTMENT_ADD' : adjustmentType === 'EXPIRED_DISCARD' ? 'EXPIRED_DISCARD' : 'ADJUSTMENT_DEDUCT',
      quantity: adjustmentType === 'ADD' ? changeQty : -changeQty,
      previousStock,
      newStock,
      reason: reason || `Manual stock adjustment (${adjustmentType})`,
      performedBy: req.user._id,
    });

    // Check low stock alert
    if (updatedTotal <= batch.medicine.reorderLevel) {
      await Notification.create({
        title: `Low Stock: ${batch.medicine.name}`,
        message: `Medicine stock is at ${updatedTotal} units, at or below reorder level (${batch.medicine.reorderLevel}).`,
        type: 'LOW_STOCK',
        severity: 'WARNING',
        referenceId: batch.medicine._id.toString(),
      });
    }

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      batch,
      movement,
    });
  } catch (error) {
    next(error);
  }
};
