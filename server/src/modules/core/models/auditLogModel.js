const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    module: {
      type: String,
      enum: ['Finance', 'Security', 'Operations', 'Facilities', 'Core'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'OTHER'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Storing JSON object of changes or references
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
