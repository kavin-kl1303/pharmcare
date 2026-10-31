const mongoose = require('mongoose');

const medicineBatchSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: [true, 'Medicine reference is required'],
      index: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      index: true,
    },
    manufacturingDate: {
      type: Date,
      required: [true, 'Manufacturing date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: [0, 'MRP cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    initialQuantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    rackLocation: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'NEAR_EXPIRY', 'EXPIRED', 'DEPLETED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate batch numbers for the same medicine
medicineBatchSchema.index({ medicine: 1, batchNumber: 1 }, { unique: true });

// Check expiry status dynamically
medicineBatchSchema.methods.updateStatusBasedOnDate = function () {
  const now = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(now.getDate() + 90);

  if (this.quantity <= 0) {
    this.status = 'DEPLETED';
  } else if (new Date(this.expiryDate) <= now) {
    this.status = 'EXPIRED';
  } else if (new Date(this.expiryDate) <= ninetyDaysFromNow) {
    this.status = 'NEAR_EXPIRY';
  } else {
    this.status = 'ACTIVE';
  }
};

module.exports = mongoose.model('MedicineBatch', medicineBatchSchema);
