const mongoose = require('mongoose');

const visitorLogSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },

    visitorPhone: {
      type: String,
      trim: true,
      default: null,
    },

    purpose: {
      type: String,
      trim: true,
      default: 'Guest',
    },

    vehicleNumber: {
      type: String,
      trim: true,
      default: null,
    },

    // Which flat is the visitor going to
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: [true, 'Flat ID is required'],
    },

    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'rejected', 'checked_in', 'checked_out'],
      default: 'pending_approval',
    },

    entryTime: {
      type: Date,
      default: null,
    },

    exitTime: {
      type: Date,
      default: null,
    },

    // The guard who created this entry
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Logged by user is required'],
    },
  },
  { timestamps: true }
);

// Fast lookups for active visitors and daily logs
visitorLogSchema.index({ societyId: 1, status: 1 });
visitorLogSchema.index({ societyId: 1, createdAt: -1 });

module.exports = mongoose.model('VisitorLog', visitorLogSchema);
