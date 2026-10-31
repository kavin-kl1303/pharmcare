const Prescription = require('../models/Prescription');
const PrescriptionItem = require('../models/PrescriptionItem');
const Medicine = require('../models/Medicine');
const AuditLog = require('../models/AuditLog');

// @desc    Get prescriptions with filter & pagination
// @route   GET /api/prescriptions
exports.getPrescriptions = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { prescriptionNumber: searchRegex },
        { patientName: searchRegex },
        { doctorName: searchRegex },
        { doctorMciNumber: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Prescription.countDocuments(query);
    const prescriptions = await Prescription.find(query)
      .populate('customer', 'name phone email')
      .populate('verifiedBy', 'name email roleCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Populate items for each prescription
    const prescriptionIds = prescriptions.map((p) => p._id);
    const items = await PrescriptionItem.find({ prescription: { $in: prescriptionIds } }).populate(
      'medicine',
      'name genericName schedule strength totalStock'
    );

    const itemsByPrescription = {};
    items.forEach((item) => {
      if (!itemsByPrescription[item.prescription]) itemsByPrescription[item.prescription] = [];
      itemsByPrescription[item.prescription].push(item);
    });

    const enriched = prescriptions.map((p) => ({
      ...p.toObject(),
      items: itemsByPrescription[p._id] || [],
    }));

    res.json({
      success: true,
      data: enriched,
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

// @desc    Get single prescription by ID
// @route   GET /api/prescriptions/:id
exports.getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('customer', 'name phone email age gender address')
      .populate('verifiedBy', 'name email licenseNumber');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const items = await PrescriptionItem.find({ prescription: prescription._id }).populate(
      'medicine',
      'name genericName schedule strength totalStock dosageForm'
    );

    res.json({
      success: true,
      data: {
        ...prescription.toObject(),
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new prescription
// @route   POST /api/prescriptions
exports.createPrescription = async (req, res, next) => {
  try {
    const {
      customerId,
      patientName,
      patientAge,
      patientGender,
      doctorName,
      doctorMciNumber,
      hospitalOrClinic,
      diagnosis,
      safetyNotes,
      items,
    } = req.body;

    const count = await Prescription.countDocuments();
    const prescriptionNumber = `RX-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const prescription = await Prescription.create({
      prescriptionNumber,
      customer: customerId || undefined,
      patientName,
      patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
      patientGender: patientGender || 'Male',
      doctorName,
      doctorMciNumber,
      hospitalOrClinic: hospitalOrClinic || '',
      diagnosis: diagnosis || '',
      safetyNotes: safetyNotes || '',
      status: 'PENDING',
    });

    const createdItems = [];
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const pItem = await PrescriptionItem.create({
          prescription: prescription._id,
          medicine: item.medicineId,
          dosage: item.dosage || '1-0-1',
          duration: item.duration || '5 Days',
          quantity: item.quantity || 1,
          instructions: item.instructions || 'After Food',
        });
        createdItems.push(pItem);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Prescription uploaded/created successfully',
      data: {
        ...prescription.toObject(),
        items: createdItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify prescription
// @route   PUT /api/prescriptions/:id/verify
exports.verifyPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    prescription.status = 'VERIFIED';
    prescription.verifiedBy = req.user._id;
    prescription.verifiedAt = new Date();
    await prescription.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'VERIFY_PRESCRIPTION',
      entityType: 'Prescription',
      entityId: prescription._id.toString(),
      details: { prescriptionNumber: prescription.prescriptionNumber },
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: 'Prescription verified successfully',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};
