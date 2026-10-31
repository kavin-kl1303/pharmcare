const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema(
  {
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: [true, 'Prescription reference is required'],
      index: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: [true, 'Medicine reference is required'],
    },
    dosage: {
      type: String,
      default: '1-0-1',
      trim: true,
    },
    duration: {
      type: String,
      default: '5 Days',
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    dispensedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDispensed: {
      type: Boolean,
      default: false,
    },
    instructions: {
      type: String,
      default: 'After Food',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PrescriptionItem', prescriptionItemSchema);
