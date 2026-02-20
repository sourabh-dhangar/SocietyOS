const mongoose = require('mongoose');

const societySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Society name is required'],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Feature flags — dynamically enable/disable modules per society
    features: {
      hasFinance: { type: Boolean, default: true },
      hasSecurity: { type: Boolean, default: true },
      hasOperations: { type: Boolean, default: true },
      hasGovernance: { type: Boolean, default: true },
      hasWaterLogs: { type: Boolean, default: true },
      hasStpLogs: { type: Boolean, default: true },
      hasStaffManagement: { type: Boolean, default: true },
      hasAmenityBooking: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Society', societySchema);
