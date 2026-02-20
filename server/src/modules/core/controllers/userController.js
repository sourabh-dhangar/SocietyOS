const User = require('../models/userModel');

/**
 * Default permissions based on userType
 */
const getDefaultPermissions = (userType) => {
  switch (userType) {
    case 'society_admin':
      return {
        finance: { view: true, edit: true },
        security: { view: true, edit: true },
        notices: { view: true, edit: true },
        operations: { view: true, edit: true },
        governance: { view: true, edit: true },
        staffManagement: { view: true, edit: true },
        admin_assets: { view: true, edit: true },
      };
    case 'resident':
      return {
        finance: { view: true, edit: false },
        security: { view: true, edit: false },
        notices: { view: true, edit: false },
        operations: { view: false, edit: false },
        governance: { view: true, edit: false },
        staffManagement: { view: false, edit: false },
        admin_assets: { view: false, edit: false },
      };
    case 'staff':
      return {
        finance: { view: false, edit: false },
        security: { view: true, edit: false },
        notices: { view: true, edit: false },
        operations: { view: true, edit: false },
        governance: { view: false, edit: false },
        staffManagement: { view: false, edit: false },
        admin_assets: { view: false, edit: false },
      };
    case 'security_guard':
      return {
        finance: { view: false, edit: false },
        security: { view: true, edit: true },
        notices: { view: true, edit: false },
        operations: { view: false, edit: false },
        governance: { view: false, edit: false },
        staffManagement: { view: false, edit: false },
        admin_assets: { view: false, edit: false },
      };
    default:
      return {
        finance: { view: false, edit: false },
        security: { view: false, edit: false },
        notices: { view: false, edit: false },
        operations: { view: false, edit: false },
        governance: { view: false, edit: false },
        staffManagement: { view: false, edit: false },
        admin_assets: { view: false, edit: false },
      };
  }
};

/**
 * @desc    Add a new user (resident/staff/guard) to the society
 * @route   POST /api/core/users
 * @access  Private (society_admin)
 */
const addUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, userType, flatNumber, permissions } = req.body;

    // Check for duplicate email
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists', data: null });
    }

    // Assign default permissions based on userType, or use custom if provided
    const assignedPermissions = permissions || getDefaultPermissions(userType || 'resident');

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      societyId: req.user.societyId,
      userType: userType || 'resident',
      flatNumber: flatNumber || null,
      permissions: assignedPermissions,
    });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'User added successfully',
      data: userResponse,
    });
  } catch (error) {
    console.error('AddUser Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get all users for the logged-in user's society
 * @route   GET /api/core/users
 * @access  Private
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ societyId: req.user.societyId })
      .select('-password -otp -otpExpiry')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error) {
    console.error('GetUsers Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { addUser, getUsers };
