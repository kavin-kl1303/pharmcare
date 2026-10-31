const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Supplier / Agency company name is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    gstin: {
      type: String,
      default: '',
      trim: true,
    },
    drugLicenseNumber: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
