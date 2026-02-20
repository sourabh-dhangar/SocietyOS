const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    wing: {
      type: String,
      required: [true, 'Wing is required'],
      trim: true,
    },

    flatNumber: {
      type: String,
      required: [true, 'Flat number is required'],
      trim: true,
    },

    floor: {
      type: Number,
      default: 0,
    },

    // Used to calculate dynamic maintenance dues (per sq.ft billing)
    sizeSqFt: {
      type: Number,
      required: [true, 'Flat size in sq.ft is required'],
    },

    status: {
      type: String,
      enum: ['vacant', 'owner_occupied', 'rented'],
      default: 'vacant',
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Only applicable when status is 'rented'
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    intercomNumber: {
      type: String,
      trim: true,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for fast multi-tenant lookups
flatSchema.index({ societyId: 1, wing: 1, flatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Flat', flatSchema);
