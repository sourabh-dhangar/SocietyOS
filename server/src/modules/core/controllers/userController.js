const User = require('../models/userModel');
const getDefaultPermissions = require('../../../utils/permissionDefaults');
const { logAudit } = require('../../../utils/auditLogger');

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

    await logAudit(req, 'Core', 'CREATE', `Added new ${userType} (${email || phone})`);

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
 * @desc    Add multiple users (residents) in bulk (e.g. from CSV)
 * @route   POST /api/core/users/bulk
 * @access  Private (society_admin)
 */
const addBulkUsers = async (req, res) => {
  try {
    const { users } = req.body;
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected an array of users.', data: null });
    }

    const societyId = req.user.societyId;
    const defaultPermissions = getDefaultPermissions('resident');
    
    // Get existing users (by email or phone)
    const existingEmails = new Set((await User.find().select('email').lean()).map(u => u.email));
    const existingPhones = new Set((await User.find().select('phone').lean()).map(u => String(u.phone)));

    const newUsers = [];
    let skipped = 0;

    for (const userData of users) {
      const { firstName, lastName, email, phone, userType, flatNumber } = userData;
      
      if (!firstName || !phone) {
        skipped++;
        continue;
      }

      if ((email && existingEmails.has(email)) || existingPhones.has(String(phone))) {
        skipped++;
        continue; // Avoid duplicates
      }

      newUsers.push({
        firstName,
        lastName: lastName || '',
        email: email || null,
        phone: String(phone),
        password: String(phone), // Default password is phone number
        societyId,
        userType: userType || 'resident',
        flatNumber: flatNumber || null,
        permissions: defaultPermissions,
      });

      if (email) existingEmails.add(email);
      existingPhones.add(String(phone));
    }

    let inserted = 0;
    if (newUsers.length > 0) {
      const result = await User.insertMany(newUsers);
      inserted = result.length;
    }

    await logAudit(req, 'Core', 'CREATE', `Bulk imported ${inserted} residents`);

    return res.status(201).json({
      success: true,
      message: `Bulk users imported successfully. Added: ${inserted}, Skipped/Duplicates: ${skipped}`,
      data: { inserted, skipped }
    });
  } catch (error) {
    console.error('AddBulkUsers Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during bulk import', data: null });
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

module.exports = { addUser, addBulkUsers, getUsers };
