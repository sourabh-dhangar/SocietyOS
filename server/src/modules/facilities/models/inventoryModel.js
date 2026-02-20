const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },

    category: {
      type: String,
      trim: true,
      default: 'General',
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    unit: {
      type: String,
      trim: true,
      default: 'Pieces',
    },

    // Alert threshold — when quantity falls at or below this, flag as low stock
    minThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },

    lastRestocked: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

inventorySchema.index({ societyId: 1, itemName: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
