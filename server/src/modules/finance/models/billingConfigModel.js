const mongoose = require('mongoose');

/**
 * Billing Config — Society-level billing rules
 * 
 * Each society can have its own charge heads and rates.
 * Charge heads can be: per_sqft (e.g., maintenance ₹5/sqft),
 * fixed (e.g., parking ₹500 flat), or percentage (e.g., sinking fund 10% of maintenance).
 * 
 * isNonOccupancy: charges that only apply to rented/vacant flats
 */
const chargeHeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Charge head name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['per_sqft', 'fixed', 'percentage'],
    required: true,
  },
  rate: {
    type: Number,
    required: [true, 'Rate is required'],
    min: 0,
  },
  // For 'percentage' type — which charge head this percentage applies to
  percentageOf: {
    type: String,
    default: null,
    trim: true,
  },
  // Non-occupancy charge — applies to rented flats only
  isNonOccupancy: {
    type: Boolean,
    default: false,
  },
  // Sinking fund category — tracked separately in ledger
  isSinkingFund: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { _id: true });

const billingConfigSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      unique: true,
      index: true,
    },
    chargeHeads: [chargeHeadSchema],
    // Default due date: day of the month (e.g., 10 = 10th of every month)
    defaultDueDay: {
      type: Number,
      default: 10,
      min: 1,
      max: 28,
    },
    // Late fee config
    lateFee: {
      enabled: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
      graceDays: { type: Number, default: 15 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BillingConfig', billingConfigSchema);
