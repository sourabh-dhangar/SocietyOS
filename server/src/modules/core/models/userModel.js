const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Exclude from queries by default
    },

    // Multi-tenant link — required for everyone except super_admin
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      default: null,
    },

    flatNumber: {
      type: String,
      trim: true,
      default: null,
    },

    userType: {
      type: String,
      enum: ['super_admin', 'society_admin', 'resident', 'staff', 'security_guard'],
      default: 'resident',
    },

    // Dynamic RBAC — checkbox-style permissions per module
    permissions: {
      finance: {
        view: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
      },
      security: {
        view: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
      },
      notices: {
        view: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
      },
      operations: {
        view: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
      },
      governance: {
        view: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
      },
      staffManagement: {
        view: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
      },
      admin_assets: {
        view: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // OTP fields for mobile-based login
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast multi-tenant queries
userSchema.index({ societyId: 1, email: 1 });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
