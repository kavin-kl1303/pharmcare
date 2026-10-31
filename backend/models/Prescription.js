const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    patientAge: {
      type: Number,
      min: 0,
    },
    patientGender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    doctorName: {
      type: String,
      required: [true, 'Prescribing doctor name is required'],
      trim: true,
    },
    doctorMciNumber: {
      type: String,
      required: [true, 'Doctor MCI / State Medical Council Reg No is required'],
      trim: true,
    },
    hospitalOrClinic: {
      type: String,
      default: '',
      trim: true,
    },
    prescriptionDate: {
      type: Date,
      default: Date.now,
    },
    diagnosis: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'DISPENSED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    safetyNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
