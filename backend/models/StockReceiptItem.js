const mongoose = require('mongoose');

const stockReceiptItemSchema = new mongoose.Schema(
  {
    stockReceipt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockReceipt',
      required: true,
      index: true,
    },
    purchaseOrderItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrderItem',
      required: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    manufacturingDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    quantityReceived: {
      type: Number,
      required: true,
      min: 1,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    batchCreated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineBatch',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockReceiptItem', stockReceiptItemSchema);
