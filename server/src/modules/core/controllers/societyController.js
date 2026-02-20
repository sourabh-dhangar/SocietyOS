const Society = require('../models/societyModel');

/**
 * @desc    Create a new society (Super Admin only)
 * @route   POST /api/core/society
 * @access  Private (super_admin)
 */
const createSociety = async (req, res) => {
  try {
    // Only super_admin can create societies
    if (req.user.userType !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can create societies', data: null });
    }

    const { name, registrationNumber, address, contactEmail, contactPhone, subscriptionPlan, features } = req.body;

    // Check for duplicate registration number
    const exists = await Society.findOne({ registrationNumber });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Society with this registration number already exists', data: null });
    }

    const society = await Society.create({
      name,
      registrationNumber,
      address,
      contactEmail,
      contactPhone,
      subscriptionPlan: subscriptionPlan || 'basic',
      features: features || {},
    });

    return res.status(201).json({
      success: true,
      message: 'Society created successfully',
      data: society,
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

    const societies = await Society.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'All societies fetched',
      data: societies,
    });
  } catch (error) {
    console.error('GetAllSocieties Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { createSociety, getSocietyDetails, getAllSocieties };
