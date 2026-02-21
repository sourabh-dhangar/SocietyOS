const Flat = require('../models/flatModel');
const { logAudit } = require('../../../utils/auditLogger');

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

    await logAudit(req, 'Core', 'CREATE', `Added new flat (${wing}-${flatNumber})`);

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
 * @desc    Add multiple flats in bulk (e.g. from CSV)
 * @route   POST /api/core/flats/bulk
 * @access  Private (society_admin)
 */
const addBulkFlats = async (req, res) => {
  try {
    const { flats } = req.body;
    if (!flats || !Array.isArray(flats) || flats.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected an array of flats.', data: null });
    }

    const societyId = req.user.societyId;
    
    // Get existing flats for this society to prevent duplicates
    const existingFlats = await Flat.find({ societyId }).select('wing flatNumber').lean();
    const existingSet = new Set(existingFlats.map(f => `${f.wing}-${f.flatNumber}`));

    const newFlats = [];
    let skipped = 0;

    for (const flatData of flats) {
      const { wing, flatNumber, floor, sizeSqFt, status, intercomNumber } = flatData;
      
      if (!wing || !flatNumber) {
        skipped++;
        continue; // Skip invalid rows
      }

      const flatKey = `${wing}-${flatNumber}`;
      if (existingSet.has(flatKey)) {
        skipped++;
        continue; // Skip existing flats
      }

      newFlats.push({
        societyId,
        wing,
        flatNumber,
        floor: floor || 0,
        sizeSqFt: sizeSqFt || 0,
        status: status || 'vacant',
        intercomNumber: intercomNumber || null,
      });
      existingSet.add(flatKey); // Add to prevent duplicates within the same batch
    }

    let inserted = 0;
    if (newFlats.length > 0) {
      const result = await Flat.insertMany(newFlats);
      inserted = result.length;
    }

    await logAudit(req, 'Core', 'CREATE', `Bulk imported ${inserted} flats`);

    return res.status(201).json({
      success: true,
      message: `Bulk flats imported successfully. Added: ${inserted}, Skipped: ${skipped}`,
      data: { inserted, skipped }
    });
  } catch (error) {
    console.error('AddBulkFlats Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during bulk import', data: null });
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

module.exports = { addFlat, addBulkFlats, getFlats };
