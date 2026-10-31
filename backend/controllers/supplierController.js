const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ name: searchRegex }, { companyName: searchRegex }, { gstin: searchRegex }, { city: searchRegex }];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .sort({ companyName: 1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: suppliers,
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

// @desc    Create supplier
// @route   POST /api/suppliers
exports.createSupplier = async (req, res, next) => {
  try {
    const { name, companyName, email, phone, gstin, drugLicenseNumber, address, city } = req.body;
    const supplier = await Supplier.create({
      name,
      companyName,
      email: email || '',
      phone,
      gstin: gstin || '',
      drugLicenseNumber: drugLicenseNumber || '',
      address: address || '',
      city: city || '',
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};
