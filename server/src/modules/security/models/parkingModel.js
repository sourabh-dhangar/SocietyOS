const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
  },
  slotNumber: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Two-Wheeler', 'Four-Wheeler', 'Visitor', 'Handicap'],
    default: 'Four-Wheeler',
  },
  status: {
    type: String,
    enum: ['Available', 'Allocated'],
    default: 'Available',
  },
  allocatedToFlat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    default: null,
  },
  vehicleNumber: {
    type: String,
    default: null,
  },
  notes: {
    type: String,
    default: null,
  },
}, { timestamps: true });

// Prevent duplicate slot numbers per society
parkingSlotSchema.index({ societyId: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
