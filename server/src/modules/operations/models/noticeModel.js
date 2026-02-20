const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },

    content: {
      type: String,
      required: [true, 'Notice content is required'],
    },

    type: {
      type: String,
      enum: ['general', 'alert', 'meeting', 'event'],
      default: 'general',
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
  },
  { timestamps: true }
);

noticeSchema.index({ societyId: 1, createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
