const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseOrderItem = require('../models/PurchaseOrderItem');
const StockReceipt = require('../models/StockReceipt');
const StockReceiptItem = require('../models/StockReceiptItem');
const MedicineBatch = require('../models/MedicineBatch');
const Medicine = require('../models/Medicine');
const InventoryMovement = require('../models/InventoryMovement');
const AuditLog = require('../models/AuditLog');
const { runInTransaction } = require('../config/db');

// @desc    Get purchase orders with pagination & filters
// @route   GET /api/purchases
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.orderNumber = searchRegex;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await PurchaseOrder.countDocuments(query);
    const orders = await PurchaseOrder.find(query)
      .populate('supplier', 'companyName name phone email')
      .populate('createdByUser', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Attach items
    const orderIds = orders.map((o) => o._id);
    const items = await PurchaseOrderItem.find({ purchaseOrder: { $in: orderIds } }).populate(
      'medicine',
      'name genericName dosageForm'
    );

    const itemsByOrder = {};
    items.forEach((item) => {
      if (!itemsByOrder[item.purchaseOrder]) itemsByOrder[item.purchaseOrder] = [];
      itemsByOrder[item.purchaseOrder].push(item);
    });

    const enriched = orders.map((o) => ({
      ...o.toObject(),
      items: itemsByOrder[o._id] || [],
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

// @desc    Get single purchase order with items and receipts
// @route   GET /api/purchases/:id
exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('createdByUser', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }

    const items = await PurchaseOrderItem.find({ purchaseOrder: order._id }).populate('medicine');
    const receipts = await StockReceipt.find({ purchaseOrder: order._id })
      .populate('receivedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...order.toObject(),
        items,
        receipts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create purchase order
// @route   POST /api/purchases
exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, expectedDeliveryDate, items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Purchase order items cannot be empty' });
    }

    const count = await PurchaseOrder.countDocuments();
    const orderNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    let totalAmount = 0;
    const itemsData = [];

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(400).json({ success: false, message: `Medicine not found: ${item.medicineId}` });
      }
      const qty = parseInt(item.orderedQuantity, 10);
      const cost = parseFloat(item.unitCost);
      const totalCost = qty * cost;
      totalAmount += totalCost;

      itemsData.push({
        medicine: medicine._id,
        orderedQuantity: qty,
        unitCost: cost,
        totalCost,
      });
    }

    const purchaseOrder = await PurchaseOrder.create({
      orderNumber,
      supplier: supplierId,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'PENDING',
      createdByUser: req.user._id,
      notes: notes || '',
    });

    const createdItems = [];
    for (const item of itemsData) {
      const pItem = await PurchaseOrderItem.create({
        purchaseOrder: purchaseOrder._id,
        medicine: item.medicine,
        orderedQuantity: item.orderedQuantity,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
      });
      createdItems.push(pItem);
    }

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: {
        ...purchaseOrder.toObject(),
        items: createdItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Receive stock for a purchase order (create/update batch, movements, receipt record)
// @route   POST /api/purchases/:id/receipts
exports.receiveStock = async (req, res, next) => {
  try {
    const { supplierInvoiceNumber, items, notes } = req.body;
    const purchaseOrder = await PurchaseOrder.findById(req.params.id).populate('supplier');

    if (!purchaseOrder) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }

    if (purchaseOrder.status === 'RECEIVED') {
      return res.status(400).json({ success: false, message: 'This purchase order has already been completely received' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Stock receipt items cannot be empty' });
    }

    const count = await StockReceipt.countDocuments();
    const receiptNumber = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const result = await runInTransaction(async (session) => {
      // 1. Create Stock Receipt
      const receipt = new StockReceipt({
        receiptNumber,
        purchaseOrder: purchaseOrder._id,
        supplier: purchaseOrder.supplier._id,
        supplierInvoiceNumber: supplierInvoiceNumber || '',
        receivedDate: new Date(),
        receivedBy: req.user._id,
        notes: notes || '',
      });

      if (session) await receipt.save({ session });
      else await receipt.save();

      const createdReceiptItems = [];

      for (const item of items) {
        const {
          purchaseOrderItemId,
          medicineId,
          batchNumber,
          manufacturingDate,
          expiryDate,
          quantityReceived,
          purchasePrice,
          mrp,
          sellingPrice,
        } = item;

        const qty = parseInt(quantityReceived, 10);
        if (!qty || qty <= 0) continue;

        const poItem = await PurchaseOrderItem.findById(purchaseOrderItemId);
        if (!poItem) {
          throw new Error(`PO item not found for ID: ${purchaseOrderItemId}`);
        }

        // Prevent duplicate over-receipt
        const remainingToReceive = poItem.orderedQuantity - poItem.receivedQuantity;
        if (qty > remainingToReceive) {
          throw new Error(
            `Cannot receive ${qty} units for ${item.medicineName || 'medicine'}. Remaining on order: ${remainingToReceive}`
          );
        }

        // 2. Find or create MedicineBatch
        let batch = await MedicineBatch.findOne({ medicine: medicineId, batchNumber });
        let prevQty = 0;

        if (batch) {
          prevQty = batch.quantity;
          batch.quantity += qty;
          batch.purchasePrice = purchasePrice || batch.purchasePrice;
          batch.mrp = mrp || batch.mrp;
          batch.sellingPrice = sellingPrice || batch.sellingPrice;
          batch.updateStatusBasedOnDate();
          if (session) await batch.save({ session });
          else await batch.save();
        } else {
          batch = new MedicineBatch({
            medicine: medicineId,
            batchNumber,
            manufacturingDate: manufacturingDate || new Date(),
            expiryDate,
            purchasePrice: purchasePrice || poItem.unitCost,
            mrp: mrp || purchasePrice * 1.3 || 100,
            sellingPrice: sellingPrice || mrp || purchasePrice * 1.2 || 90,
            initialQuantity: qty,
            quantity: qty,
            supplier: purchaseOrder.supplier._id,
          });
          batch.updateStatusBasedOnDate();
          if (session) await batch.save({ session });
          else await batch.save();
        }

        // 3. Create StockReceiptItem
        const receiptItem = new StockReceiptItem({
          stockReceipt: receipt._id,
          purchaseOrderItem: poItem._id,
          medicine: medicineId,
          batchNumber,
          manufacturingDate: batch.manufacturingDate,
          expiryDate: batch.expiryDate,
          quantityReceived: qty,
          purchasePrice: batch.purchasePrice,
          mrp: batch.mrp,
          sellingPrice: batch.sellingPrice,
          batchCreated: batch._id,
        });

        if (session) await receiptItem.save({ session });
        else await receiptItem.save();
        createdReceiptItems.push(receiptItem);

        // 4. Update PO Item received count
        poItem.receivedQuantity += qty;
        if (session) await poItem.save({ session });
        else await poItem.save();

        // 5. Record Inventory Movement
        const movement = new InventoryMovement({
          medicine: medicineId,
          batch: batch._id,
          type: 'PURCHASE_RECEIPT',
          quantity: qty,
          previousStock: prevQty,
          newStock: prevQty + qty,
          referenceId: receiptNumber,
          reason: `Goods receipt against PO ${purchaseOrder.orderNumber}`,
          performedBy: req.user._id,
        });

        if (session) await movement.save({ session });
        else await movement.save();

        // 6. Sync medicine totalStock
        const totalStock = await MedicineBatch.find({
          medicine: medicineId,
          quantity: { $gt: 0 },
        }).then((batches) => batches.reduce((s, b) => s + b.quantity, 0));

        await Medicine.findByIdAndUpdate(medicineId, { totalStock });
      }

      // Check overall PO status
      const allPOItems = await PurchaseOrderItem.find({ purchaseOrder: purchaseOrder._id });
      const allReceived = allPOItems.every((i) => i.receivedQuantity >= i.orderedQuantity);
      const someReceived = allPOItems.some((i) => i.receivedQuantity > 0);

      purchaseOrder.status = allReceived ? 'RECEIVED' : someReceived ? 'PARTIALLY_RECEIVED' : 'PENDING';
      if (session) await purchaseOrder.save({ session });
      else await purchaseOrder.save();

      return { receipt, items: createdReceiptItems, status: purchaseOrder.status };
    });

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'RECEIVE_STOCK',
      entityType: 'StockReceipt',
      entityId: result.receipt._id.toString(),
      details: { receiptNumber, orderNumber: purchaseOrder.orderNumber },
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: 'Stock received and inventory batches updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
