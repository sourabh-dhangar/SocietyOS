const express = require('express');
const router = express.Router();
const { adminLogin, sendOtp, verifyOtp } = require('../controllers/authController');

// Admin Login — Email + Password
router.post('/admin-login', adminLogin);

// Resident/Staff Login — Send OTP
router.post('/send-otp', sendOtp);

// Resident/Staff Login — Verify OTP
router.post('/verify-otp', verifyOtp);

module.exports = router;
