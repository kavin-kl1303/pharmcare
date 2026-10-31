const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Payment = require('../models/Payment');
const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');
const Customer = require('../models/Customer');
const Prescription = require('../models/Prescription');
const InventoryMovement = require('../models/InventoryMovement');
const AuditLog = require('../models/AuditLog');
const { runInTransaction } = require('../config/db');

// @desc    Process a new POS sale
// @route   POST /api/sales
exports.createSale = async (req, res, next) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      doctorName,
      doctorMciNumber,
      prescriptionId,
      items,
      discountAmount = 0,
      paymentMethod = 'CASH',
      transactionReference = '',
      notes = '',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale cart cannot be empty' });
    }

    const now = new Date();

    // Revalidate each item, batch existence, expiry, and stock
    const validatedItems = [];
    let subtotal = 0;
    let totalCost = 0;
    let totalTax = 0;

    for (const item of items) {
      const { medicineId, batchId, quantity } = item;
      const requestedQty = parseInt(quantity, 10);

      if (!requestedQty || requestedQty <= 0) {
        return res.status(400).json({ success: false, message: 'Item quantity must be greater than zero' });
      }

      const medicine = await Medicine.findById(medicineId);
      if (!medicine || !medicine.isActive) {
        return res.status(400).json({ success: false, message: `Medicine not found or inactive: ${item.medicineName || medicineId}` });
      }

      // Check prescription requirement
      if (medicine.prescriptionRequired && !doctorName && !prescriptionId) {
        return res.status(400).json({
          success: false,
          message: `${medicine.name} is a Schedule ${medicine.schedule} drug and requires a prescribing doctor name / MCI registration.`,
        });
      }

      // Find batch: if specific batchId provided use it; otherwise use oldest active non-expired batch (FIFO)
      let batch;
      if (batchId) {
        batch = await MedicineBatch.findById(batchId);
      } else {
        batch = await MedicineBatch.findOne({
          medicine: medicine._id,
          expiryDate: { $gt: now },
          quantity: { $gte: requestedQty },
        }).sort({ expiryDate: 1 });
      }

      if (!batch) {
        return res.status(400).json({
          success: false,
          message: `No suitable batch available in stock for ${medicine.name}.`,
        });
      }

      // Block expired batch
      if (new Date(batch.expiryDate) <= now) {
        return res.status(400).json({
          success: false,
          message: `Batch ${batch.batchNumber} of ${medicine.name} expired on ${new Date(batch.expiryDate).toLocaleDateString()}. Cannot sell expired medicines.`,
        });
      }

      // Check stock
      if (batch.quantity < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock in batch ${batch.batchNumber} for ${medicine.name}. Requested: ${requestedQty}, Available: ${batch.quantity}.`,
        });
      }

      const unitPrice = batch.sellingPrice;
      const itemSubtotal = unitPrice * requestedQty;
      const taxRate = medicine.gstRate || 12;
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;
      const itemCost = batch.purchasePrice * requestedQty;
      const itemProfit = itemTotal - itemCost;

      subtotal += itemSubtotal;
      totalTax += itemTax;
      totalCost += itemCost;

      validatedItems.push({
        medicine,
        batch,
        quantity: requestedQty,
        unitPrice,
        purchasePrice: batch.purchasePrice,
        mrp: batch.mrp,
        taxRate,
        taxAmount: itemTax,
        total: itemTotal,
        itemProfit,
      });
    }

    const finalSubtotal = parseFloat(subtotal.toFixed(2));
    const finalTax = parseFloat(totalTax.toFixed(2));
    const finalDiscount = parseFloat(Number(discountAmount || 0).toFixed(2));
    const finalTotal = parseFloat(Math.max(0, finalSubtotal + finalTax - finalDiscount).toFixed(2));
    const finalProfit = parseFloat((finalTotal - totalCost).toFixed(2));

    // Generate unique invoice number
    const count = await Sale.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Execute within transaction (where supported)
    const result = await runInTransaction(async (session) => {
      // 1. Create Sale
      const sale = new Sale({
        invoiceNumber,
        customer: customerId || undefined,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        doctorName: doctorName || '',
        doctorMciNumber: doctorMciNumber || '',
        prescription: prescriptionId || undefined,
        subtotal: finalSubtotal,
        discountAmount: finalDiscount,
        taxAmount: finalTax,
        totalAmount: finalTotal,
        costAmount: totalCost,
        profitAmount: finalProfit,
        paymentStatus: 'PAID',
        dispensedBy: req.user._id,
        terminalId: req.body.terminalId || 'POS-01',
        notes,
      });

      if (session) await sale.save({ session });
      else await sale.save();

      // 2. Create SaleItems & update inventory batches
      const createdSaleItems = [];
      for (const vItem of validatedItems) {
        const saleItem = new SaleItem({
          sale: sale._id,
          medicine: vItem.medicine._id,
          medicineBatch: vItem.batch._id,
          medicineName: vItem.medicine.name,
          batchNumber: vItem.batch.batchNumber,
          quantity: vItem.quantity,
          unitPrice: vItem.unitPrice,
          purchasePrice: vItem.purchasePrice,
          mrp: vItem.mrp,
          discount: 0,
          taxRate: vItem.taxRate,
          taxAmount: vItem.taxAmount,
          total: vItem.total,
          itemProfit: vItem.itemProfit,
        });

        if (session) await saleItem.save({ session });
        else await saleItem.save();
        createdSaleItems.push(saleItem);

        // Deduct batch quantity
        const prevQty = vItem.batch.quantity;
        const newQty = prevQty - vItem.quantity;
        vItem.batch.quantity = newQty;
        vItem.batch.updateStatusBasedOnDate();

        if (session) await vItem.batch.save({ session });
        else await vItem.batch.save();

        // Record inventory movement
        const movement = new InventoryMovement({
          medicine: vItem.medicine._id,
          batch: vItem.batch._id,
          type: 'SALE_DISPENSE',
          quantity: -vItem.quantity,
          previousStock: prevQty,
          newStock: newQty,
          referenceId: invoiceNumber,
          reason: `Dispensed in sale invoice ${invoiceNumber}`,
          performedBy: req.user._id,
        });

        if (session) await movement.save({ session });
        else await movement.save();

        // Sync medicine total stock
        const totalStock = await MedicineBatch.find({
          medicine: vItem.medicine._id,
          quantity: { $gt: 0 },
        }).then((batches) => batches.reduce((s, b) => s + b.quantity, 0));

        await Medicine.findByIdAndUpdate(vItem.medicine._id, { totalStock });
      }

      // 3. Create Payment record
      const payment = new Payment({
        sale: sale._id,
        amount: finalTotal,
        paymentMethod: paymentMethod.toUpperCase(),
        transactionReference: transactionReference || '',
        status: 'COMPLETED',
        processedBy: req.user._id,
        notes: `Tender recorded via ${paymentMethod}`,
      });

      if (session) await payment.save({ session });
      else await payment.save();

      // 4. Update Customer statistics if linked
      if (customerId) {
        await Customer.findByIdAndUpdate(customerId, {
          $inc: { totalVisits: 1, totalSpent: finalTotal },
        });
      }

      // 5. Update Prescription status if linked
      if (prescriptionId) {
        await Prescription.findByIdAndUpdate(prescriptionId, {
          status: 'DISPENSED',
        });
      }

      return { sale, items: createdSaleItems, payment };
    });

    // Record audit log
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'DISPENSE_SALE',
      entityType: 'Sale',
      entityId: result.sale._id.toString(),
      details: { invoiceNumber, totalAmount: finalTotal, itemsCount: validatedItems.length },
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      data: {
        ...result.sale.toObject(),
        items: result.items,
        payment: result.payment,
        dispensedBy: {
          name: req.user.name,
          licenseNumber: req.user.licenseNumber,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales history with filters & pagination
// @route   GET /api/sales
exports.getSales = async (req, res, next) => {
  try {
    const { search, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ invoiceNumber: searchRegex }, { customerName: searchRegex }, { customerPhone: searchRegex }];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query)
      .populate('dispensedBy', 'name licenseNumber roleCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: sales,
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

// @desc    Get single sale / invoice details for printing
// @route   GET /api/sales/:id
exports.getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('dispensedBy', 'name licenseNumber email')
      .populate('customer');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    const items = await SaleItem.find({ sale: sale._id }).populate('medicine', 'name genericName hsnCode');
    const payment = await Payment.findOne({ sale: sale._id });

    res.json({
      success: true,
      data: {
        ...sale.toObject(),
        items,
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};
