const mongoose = require('mongoose');

const staffLogSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    staffName: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true,
    },

    staffType: {
      type: String,
      trim: true,
      default: 'Society_Staff',
    },

    // Staff can serve multiple flats (e.g., a maid working in 3 flats)
    linkedFlats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flat',
      },
    ],

    status: {
      type: String,
      enum: ['inside', 'outside'],
      default: 'outside',
    },

    lastEntry: {
      type: Date,
      default: null,
    },

    lastExit: {
      type: Date,
      default: null,
    },

    // The guard who logged the movement
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Fast lookups
staffLogSchema.index({ societyId: 1, status: 1 });
staffLogSchema.index({ societyId: 1, staffType: 1 });

module.exports = mongoose.model('StaffLog', staffLogSchema);
