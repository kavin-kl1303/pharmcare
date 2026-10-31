const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');

// @desc    Get all medicines with search, filtering, sorting, pagination
// @route   GET /api/medicines
exports.getMedicines = async (req, res, next) => {
  try {
    const {
      search,
      category,
      dosageForm,
      schedule,
      stockStatus,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isActive: true };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { genericName: searchRegex },
        { manufacturer: searchRegex },
        { barcode: searchRegex },
        { rackLocation: searchRegex },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (dosageForm && dosageForm !== 'ALL') {
      query.dosageForm = new RegExp(`^${dosageForm}$`, 'i');
    }

    if (schedule && schedule !== 'ALL') {
      query.schedule = schedule;
    }

    if (stockStatus === 'low') {
      query.$expr = { $lte: ['$totalStock', '$reorderLevel'] };
    } else if (stockStatus === 'out') {
      query.totalStock = { $lte: 0 };
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Medicine.countDocuments(query);
    const medicines = await Medicine.find(query)
      .populate('category', 'name code')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Also attach batch details summary for each medicine
    const medicineIds = medicines.map((m) => m._id);
    const batches = await MedicineBatch.find({
      medicine: { $in: medicineIds },
      status: { $ne: 'DEPLETED' },
    }).sort({ expiryDate: 1 });

    const batchesByMed = {};
    batches.forEach((b) => {
      if (!batchesByMed[b.medicine]) batchesByMed[b.medicine] = [];
      batchesByMed[b.medicine].push(b);
    });

    const enrichedMedicines = medicines.map((med) => {
      const medBatches = batchesByMed[med._id] || [];
      const primaryBatch = medBatches[0] || null;
      return {
        ...med.toObject(),
        batchesCount: medBatches.length,
        primaryBatch,
        batches: medBatches,
      };
    });

    res.json({
      success: true,
      data: enrichedMedicines,
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

// @desc    Get single medicine details with all its batches
// @route   GET /api/medicines/:id
exports.getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate('category', 'name code');
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const batches = await MedicineBatch.find({ medicine: medicine._id })
      .populate('supplier', 'companyName name')
      .sort({ expiryDate: 1 });

    res.json({
      success: true,
      data: {
        ...medicine.toObject(),
        batches,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new medicine
// @route   POST /api/medicines
exports.createMedicine = async (req, res, next) => {
  try {
    const {
      name,
      genericName,
      categoryId,
      manufacturer,
      dosageForm,
      strength,
      schedule,
      prescriptionRequired,
      barcode,
      hsnCode,
      gstRate,
      reorderLevel,
      rackLocation,
      initialBatch,
    } = req.body;

    let category = null;
    if (categoryId) {
      category = await Category.findById(categoryId);
    }
    if (!category) {
      // Find default category or create General
      category = await Category.findOne({ name: 'General' });
      if (!category) {
        category = await Category.create({ name: 'General', code: 'GEN' });
      }
    }

    const medicine = await Medicine.create({
      name,
      genericName,
      category: category._id,
      manufacturer,
      dosageForm: dosageForm || 'Tablet',
      strength: strength || '',
      schedule: schedule || 'OTC',
      prescriptionRequired: prescriptionRequired || schedule?.includes('Schedule H'),
      barcode: barcode || undefined,
      hsnCode: hsnCode || '300490',
      gstRate: gstRate || 12,
      reorderLevel: reorderLevel || 20,
      rackLocation: rackLocation || 'General Rack',
      totalStock: initialBatch?.quantity || 0,
    });

    let batch = null;
    if (initialBatch && initialBatch.batchNumber && initialBatch.quantity > 0) {
      batch = await MedicineBatch.create({
        medicine: medicine._id,
        batchNumber: initialBatch.batchNumber,
        manufacturingDate: initialBatch.manufacturingDate || new Date(),
        expiryDate: initialBatch.expiryDate,
        purchasePrice: initialBatch.purchasePrice || 0,
        mrp: initialBatch.mrp || initialBatch.sellingPrice || 0,
        sellingPrice: initialBatch.sellingPrice || initialBatch.mrp || 0,
        initialQuantity: initialBatch.quantity,
        quantity: initialBatch.quantity,
        rackLocation: rackLocation || 'General Rack',
        status: 'ACTIVE',
      });
    }

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'CREATE_MEDICINE',
      entityType: 'Medicine',
      entityId: medicine._id.toString(),
      details: { name: medicine.name, initialBatch: batch?.batchNumber },
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      data: medicine,
      batch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
exports.updateMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'UPDATE_MEDICINE',
      entityType: 'Medicine',
      entityId: medicine._id.toString(),
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or deactivate medicine
// @route   DELETE /api/medicines/:id
exports.deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Soft delete: set isActive to false
    medicine.isActive = false;
    await medicine.save();

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'DEACTIVATE_MEDICINE',
      entityType: 'Medicine',
      entityId: medicine._id.toString(),
      details: { name: medicine.name },
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: 'Medicine deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get categories list
// @route   GET /api/medicines/categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};
