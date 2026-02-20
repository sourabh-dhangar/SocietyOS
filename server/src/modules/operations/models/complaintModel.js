const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: [true, 'Flat ID is required'],
    },

    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Raised by user is required'],
    },

    category: {
      type: String,
      enum: ['plumbing', 'electrical', 'cleaning', 'security', 'other'],
      default: 'other',
    },

    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
    },

    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

complaintSchema.index({ societyId: 1, status: 1 });
complaintSchema.index({ societyId: 1, raisedBy: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
