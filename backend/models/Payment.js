const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CREDIT'],
      default: 'CASH',
      required: true,
    },
    transactionReference: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'],
      default: 'COMPLETED',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: 'Demo payment recorded',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
