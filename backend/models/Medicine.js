const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine brand name is required'],
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      required: [true, 'Generic composition is required'],
      trim: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },
    dosageForm: {
      type: String,
      enum: ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Inhaler', 'Drops', 'Ointment', 'Gel', 'Powder', 'Other'],
      default: 'Tablet',
    },
    strength: {
      type: String,
      default: '',
      trim: true,
    },
    schedule: {
      type: String,
      enum: ['OTC', 'Schedule H', 'Schedule H1', 'Schedule X', 'Schedule G'],
      default: 'OTC',
    },
    prescriptionRequired: {
      type: Boolean,
      default: false,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    hsnCode: {
      type: String,
      default: '300490',
      trim: true,
    },
    gstRate: {
      type: Number,
      default: 12,
      min: 0,
      max: 28,
    },
    reorderLevel: {
      type: Number,
      default: 20,
      min: 0,
    },
    rackLocation: {
      type: String,
      default: 'General Rack',
      trim: true,
    },
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound text index for robust searching
medicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text', barcode: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
