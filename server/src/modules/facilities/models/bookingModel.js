const mongoose = require('mongoose');

const amenityBookingSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    amenityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Amenity',
      required: true,
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // e.g., "10:00"
      required: true,
    },
    endTime: {
      type: String, // e.g., "12:00"
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AmenityBooking', amenityBookingSchema);
