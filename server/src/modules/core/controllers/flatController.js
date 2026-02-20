const Flat = require('../models/flatModel');

/**
 * @desc    Add a new flat/unit to the society
 * @route   POST /api/core/flats
 * @access  Private (society_admin)
 */
const addFlat = async (req, res) => {
  try {
    const { wing, flatNumber, floor, sizeSqFt, status, intercomNumber } = req.body;

    // Check for duplicate flat within the same society
    const exists = await Flat.findOne({
      societyId: req.user.societyId,
      wing,
      flatNumber,
    });

    if (exists) {
      return res.status(409).json({ success: false, message: `Flat ${wing}-${flatNumber} already exists in this society`, data: null });
    }

    const flat = await Flat.create({
      societyId: req.user.societyId,
      wing,
      flatNumber,
      floor: floor || 0,
      sizeSqFt,
      status: status || 'vacant',
      intercomNumber: intercomNumber || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Flat added successfully',
      data: flat,
    });
  } catch (error) {
    console.error('AddFlat Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get all flats for the logged-in user's society
 * @route   GET /api/core/flats
 * @access  Private
 */
const getFlats = async (req, res) => {
  try {
    const flats = await Flat.find({ societyId: req.user.societyId })
      .populate('ownerId', 'firstName lastName phone email')
      .populate('tenantId', 'firstName lastName phone email')
      .sort({ wing: 1, flatNumber: 1 });

    return res.status(200).json({
      success: true,
      message: 'Flats fetched successfully',
      data: flats,
    });
  } catch (error) {
    console.error('GetFlats Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { addFlat, getFlats };
