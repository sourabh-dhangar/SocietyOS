const mongoose = require('mongoose');

const secondarySaleSchema = new mongoose.Schema(
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

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },

    requestType: {
      type: String,
      enum: ['renting', 'selling'],
      required: [true, 'Request type is required'],
    },

    buyerOrTenantName: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ['pending_noc', 'noc_issued', 'rejected'],
      default: 'pending_noc',
    },

    requestDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

secondarySaleSchema.index({ societyId: 1, status: 1 });

module.exports = mongoose.model('SecondarySale', secondarySaleSchema);
