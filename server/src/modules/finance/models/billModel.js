const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
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

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Optional: Vacant flats might not have an assigned resident yet,
      // but might still accrue maintenance bills directly to the owner/builder
    },

    billMonth: {
      type: String,
      required: [true, 'Bill month is required'],
      trim: true,
    },

    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },

    amount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },

    // Itemized charge breakdown (India-specific heads)
    breakdown: [
      {
        chargeName: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'pending_clearance'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Compound indexes for fast bill lookups
billSchema.index({ societyId: 1, billMonth: 1 });
billSchema.index({ societyId: 1, userId: 1 });
billSchema.index({ societyId: 1, status: 1 });

module.exports = mongoose.model('Bill', billSchema);
