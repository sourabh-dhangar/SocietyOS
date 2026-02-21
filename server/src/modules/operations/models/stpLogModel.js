const mongoose = require('mongoose');

const stpLogSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },
    logDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    operatorName: {
      type: String,
      required: [true, 'Operator name is required'],
      trim: true,
    },
    phLevel: {
      type: Number,
      required: [true, 'pH level is required'],
    },
    tssLevel: {
      type: Number, // Total Suspended Solids (mg/L)
      required: [true, 'TSS level is required'],
    },
    codLevel: {
      type: Number, // Chemical Oxygen Demand
      default: null,
    },
    bodLevel: {
      type: Number, // Biological Oxygen Demand
      default: null,
    },
    motorStatus: {
      type: String,
      enum: ['running', 'stopped', 'maintenance'],
      default: 'running',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StpLog', stpLogSchema);
