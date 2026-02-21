const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Amenity name is required (e.g. Clubhouse, Tennis Court)'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    rules: {
      type: String,
      trim: true,
      default: '',
    },
    openTime: {
      type: String, // e.g. "06:00"
      default: '06:00',
    },
    closeTime: {
      type: String, // e.g. "22:00"
      default: '22:00',
    },
    maxCapacity: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    isChargeable: {
      type: Boolean,
      default: false,
    },
    ratePerHour: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Amenity', amenitySchema);
