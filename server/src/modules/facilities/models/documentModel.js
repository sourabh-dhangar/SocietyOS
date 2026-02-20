const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },

    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },

    docType: {
      type: String,
      enum: ['certificate', 'general_document', 'gallery_image'],
      required: [true, 'Document type is required'],
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploaded by user is required'],
    },

    // If true, residents can view; if false, admin-only
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

documentSchema.index({ societyId: 1, docType: 1 });

module.exports = mongoose.model('Document', documentSchema);
