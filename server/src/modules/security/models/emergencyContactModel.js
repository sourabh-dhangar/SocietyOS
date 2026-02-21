const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
  },
  category: {
    type: String,
    enum: ['Hospital', 'Police', 'Fire', 'Plumber', 'Electrician', 'Ambulance', 'Other'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

// Prevent duplicate names in the same category per society
emergencyContactSchema.index({ societyId: 1, category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
