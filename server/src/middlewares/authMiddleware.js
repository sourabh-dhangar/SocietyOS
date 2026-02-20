const jwt = require('jsonwebtoken');
const User = require('../modules/core/models/userModel');

/**
 * Authenticate Middleware
 * Verifies JWT from Authorization header, extracts user data,
 * and attaches userId, societyId, userType, permissions to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data (ensures permissions are always up-to-date)
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    // Attach user info to request
    req.user = {
      userId: user._id,
      societyId: user.societyId,
      userType: user.userType,
      permissions: user.permissions,
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

module.exports = { authenticate };
