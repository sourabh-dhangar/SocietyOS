const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { generateOtp, sendOtp } = require('../../../utils/otpUtil');

/**
 * Generate JWT with full user context for multi-tenant RBAC
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      societyId: user.societyId,
      userType: user.userType,
      permissions: user.permissions,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * @desc    Admin Login — Email + Password
 * @route   POST /api/auth/admin-login
 * @access  Public
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required', data: null });
    }

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password', data: null });
    }

    // Only admins can use this endpoint
    if (!['super_admin', 'society_admin'].includes(user.userType)) {
      return res.status(403).json({ success: false, message: 'This login is for admins only. Please use OTP login.', data: null });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.', data: null });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password', data: null });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        societyId: user.societyId,
        permissions: user.permissions,
      },
      token,
    });
  } catch (error) {
    console.error('AdminLogin Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Send OTP to mobile number (Resident/Staff/Guard)
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required', data: null });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this phone number', data: null });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact your society admin.', data: null });
    }

    // Generate random OTP and set 5-minute expiry
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save({ validateModifiedOnly: true });

    // Send OTP (currently logs to backend console, replace with SMS API later)
    const sent = await sendOtp(phone, otp);
    if (!sent) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.', data: null });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: null,
    });
  } catch (error) {
    console.error('SendOtp Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Verify OTP and login (Resident/Staff/Guard)
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required', data: null });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this phone number', data: null });
    }

    // Validate OTP
    if (user.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP', data: null });
    }

    // Check OTP expiry
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.', data: null });
    }

    // Clear OTP fields after successful verification
    user.otp = null;
    user.otpExpiry = null;
    await user.save({ validateModifiedOnly: true });

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'OTP verified. Login successful',
      data: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        userType: user.userType,
        societyId: user.societyId,
        permissions: user.permissions,
      },
      token,
    });
  } catch (error) {
    console.error('VerifyOtp Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { adminLogin, sendOtp, verifyOtp };
