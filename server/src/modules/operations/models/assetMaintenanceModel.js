const mongoose = require('mongoose');

const assetMaintenanceSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    assetName: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },

    taskType: {
      type: String,
      enum: ['cleaning', 'servicing', 'inspection', 'repair'],
      required: [true, 'Task type is required'],
    },

    lastCompletedDate: {
      type: Date,
      default: null,
    },

    nextDueDate: {
      type: Date,
      default: null,
    },

    costIncurred: {
      type: Number,
      default: 0,
      min: 0,
    },

    vendorName: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

assetMaintenanceSchema.index({ societyId: 1, nextDueDate: 1 });

module.exports = mongoose.model('AssetMaintenance', assetMaintenanceSchema);
