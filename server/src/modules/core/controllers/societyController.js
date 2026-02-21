const Society = require('../models/societyModel');
const User = require('../models/userModel');
const getDefaultPermissions = require('../../../utils/permissionDefaults');

/**
 * @desc    Create a new society + society_admin user (Super Admin only)
 * @route   POST /api/core/society
 * @access  Private (super_admin)
 */
const createSociety = async (req, res) => {
  try {
    // Only super_admin can create societies
    if (req.user.userType !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can create societies', data: null });
    }

    const {
      name, registrationNumber, address, contactEmail, contactPhone,
      subscriptionPlan, features,
      // Admin credentials — assigned at society creation time
      adminFirstName, adminLastName, adminEmail, adminPassword, adminPhone,
    } = req.body;

    // Validate required admin fields
    if (!adminFirstName || !adminLastName || !adminEmail || !adminPassword || !adminPhone) {
      return res.status(400).json({
        success: false,
        message: 'Society Admin details are required (adminFirstName, adminLastName, adminEmail, adminPassword, adminPhone)',
        data: null,
      });
    }

    // Check for duplicate registration number
    const societyExists = await Society.findOne({ registrationNumber });
    if (societyExists) {
      return res.status(409).json({ success: false, message: 'Society with this registration number already exists', data: null });
    }

    // Check for duplicate admin email
    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      return res.status(409).json({ success: false, message: 'A user with this admin email already exists', data: null });
    }

    // 1️⃣ Create the Society
    const society = await Society.create({
      name,
      registrationNumber,
      address,
      contactEmail,
      contactPhone,
      subscriptionPlan: subscriptionPlan || 'basic',
      features: features || {},
    });

    // 2️⃣ Create the Society Admin user linked to this society
    const adminUser = await User.create({
      firstName: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      password: adminPassword,
      phone: adminPhone,
      societyId: society._id,
      userType: 'society_admin',
      permissions: getDefaultPermissions('society_admin'),
      isActive: true,
    });

    // Remove password from response
    const adminResponse = adminUser.toObject();
    delete adminResponse.password;

    return res.status(201).json({
      success: true,
      message: 'Society and Society Admin created successfully',
      data: {
        society,
        admin: adminResponse,
      },
    });
  } catch (error) {
    console.error('CreateSociety Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get details of the logged-in user's society
 * @route   GET /api/core/society
 * @access  Private
 */
const getSocietyDetails = async (req, res) => {
  try {
    const society = await Society.findById(req.user.societyId);

    if (!society) {
      return res.status(404).json({ success: false, message: 'Society not found', data: null });
    }

    return res.status(200).json({
      success: true,
      message: 'Society details fetched',
      data: society,
    });
  } catch (error) {
    console.error('GetSocietyDetails Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get ALL societies (Super Admin only — platform-wide view)
 * @route   GET /api/core/societies
 * @access  Private (super_admin)
 */
const getAllSocieties = async (req, res) => {
  try {
    if (req.user.userType !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can view all societies', data: null });
    }

    const societies = await Society.find().sort({ createdAt: -1 }).lean();

    // Attach admin email for each society
    const societyIds = societies.map((s) => s._id);
    const admins = await User.find({
      societyId: { $in: societyIds },
      userType: 'society_admin',
    }).select('societyId email firstName lastName').lean();

    // Map society ID to admin info
    const adminMap = {};
    admins.forEach((a) => {
      adminMap[a.societyId.toString()] = {
        adminEmail: a.email,
        adminName: `${a.firstName} ${a.lastName}`,
      };
    });

    const enriched = societies.map((s) => ({
      ...s,
      ...(adminMap[s._id.toString()] || { adminEmail: '—', adminName: '—' }),
    }));

    return res.status(200).json({
      success: true,
      message: 'All societies fetched',
      data: enriched,
    });
  } catch (error) {
    console.error('GetAllSocieties Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Update society details (Super Admin only)
 * @route   PUT /api/core/society/:id
 * @access  Private (super_admin)
 */
const updateSociety = async (req, res) => {
  try {
    if (req.user.userType !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can update societies', data: null });
    }

    const society = await Society.findById(req.params.id);
    if (!society) {
      return res.status(404).json({ success: false, message: 'Society not found', data: null });
    }

    const { name, registrationNumber, address, contactEmail, contactPhone, subscriptionPlan, features } = req.body;

    // Check if registration number is being changed and if it conflicts
    if (registrationNumber && registrationNumber !== society.registrationNumber) {
      const exists = await Society.findOne({ registrationNumber });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Another society with this registration number already exists', data: null });
      }
    }

    // Update fields
    if (name) society.name = name;
    if (registrationNumber) society.registrationNumber = registrationNumber;
    if (address) society.address = { ...society.address?.toObject?.() || {}, ...address };
    if (contactEmail) society.contactEmail = contactEmail;
    if (contactPhone) society.contactPhone = contactPhone;
    if (subscriptionPlan) society.subscriptionPlan = subscriptionPlan;
    if (features) society.features = { ...society.features?.toObject?.() || {}, ...features };

    await society.save();

    return res.status(200).json({
      success: true,
      message: 'Society updated successfully',
      data: society,
    });
  } catch (error) {
    console.error('UpdateSociety Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Toggle society active/inactive status (Super Admin only)
 * @route   PATCH /api/core/society/:id/toggle-status
 * @access  Private (super_admin)
 */
const toggleSocietyStatus = async (req, res) => {
  try {
    if (req.user.userType !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can change society status', data: null });
    }

    const society = await Society.findById(req.params.id);
    if (!society) {
      return res.status(404).json({ success: false, message: 'Society not found', data: null });
    }

    society.isActive = !society.isActive;
    await society.save();

    return res.status(200).json({
      success: true,
      message: `Society ${society.isActive ? 'activated' : 'deactivated'} successfully`,
      data: society,
    });
  } catch (error) {
    console.error('ToggleSocietyStatus Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { createSociety, getSocietyDetails, getAllSocieties, updateSociety, toggleSocietyStatus };
