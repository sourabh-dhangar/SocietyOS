const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    // Multi-tenant isolation
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      required: [true, 'Bill ID is required'],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    amountPaid: {
      type: Number,
      required: [true, 'Amount paid is required'],
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ['upi', 'cheque', 'bank_transfer', 'cash'],
      required: [true, 'Payment method is required'],
    },

    // UTR number, Cheque number, or any reference
    transactionRef: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ['success', 'pending_clearance', 'failed'],
      default: 'success',
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for fast queries
transactionSchema.index({ societyId: 1, userId: 1 });
transactionSchema.index({ societyId: 1, billId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
