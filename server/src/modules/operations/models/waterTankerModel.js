const mongoose = require('mongoose');

const waterTankerSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },
    deliveryDate: {
      type: Date,
      required: [true, 'Delivery date is required'],
      default: Date.now,
    },
    vendorName: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
    },
    capacityLiters: {
      type: Number,
      required: [true, 'Capacity in liters is required'],
      min: 1,
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    receivedBy: {
      type: String, // Which guard/admin signed for it
      trim: true,
    },
    operatorNotes: {
      type: String,
      trim: true,
      default: '',
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WaterTankerLog', waterTankerSchema);
