const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineBatch',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['PURCHASE_RECEIPT', 'SALE_DISPENSE', 'ADJUSTMENT_ADD', 'ADJUSTMENT_DEDUCT', 'EXPIRED_DISCARD', 'RETURN'],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
