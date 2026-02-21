const ParkingSlot = require('../models/parkingModel');

/**
 * @desc    Create/Add a new parking slot
 * @route   POST /api/security/parking
 * @access  Private (Society Admin)
 */
const addParkingSlot = async (req, res) => {
  try {
    const { slotNumber, category, status, allocatedToFlat, vehicleNumber, notes } = req.body;

    if (!slotNumber) {
      return res.status(400).json({ success: false, message: 'Slot number is required.', data: null });
    }

    const exists = await ParkingSlot.findOne({
      societyId: req.user.societyId,
      slotNumber,
    });

    if (exists) {
      return res.status(409).json({ success: false, message: `Slot ${slotNumber} already exists.`, data: null });
    }

    const slot = await ParkingSlot.create({
      societyId: req.user.societyId,
      slotNumber,
      category,
      status: status || 'Available',
      allocatedToFlat: allocatedToFlat || null,
      vehicleNumber: vehicleNumber || null,
      notes,
    });

    return res.status(201).json({ success: true, message: 'Parking slot added successfully.', data: slot });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate slot number.', data: null });
    }
    console.error('Add Parking Slot Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get all parking slots for society
 * @route   GET /api/security/parking
 * @access  Private (All Roles)
 */
const getParkingSlots = async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ societyId: req.user.societyId })
      .populate('allocatedToFlat', 'wing flatNumber')
      .sort({ slotNumber: 1 });
      
    return res.status(200).json({ success: true, message: 'Parking slots fetched.', data: slots });
  } catch (error) {
    console.error('Get Parking Slots Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Update a parking slot (e.g. allocating it to a flat)
 * @route   PUT /api/security/parking/:id
 * @access  Private (Society Admin)
 */
const updateParkingSlot = async (req, res) => {
  try {
    const { status, allocatedToFlat, vehicleNumber, notes } = req.body;

    const slot = await ParkingSlot.findOne({
      _id: req.params.id,
      societyId: req.user.societyId,
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found.', data: null });
    }

    if (status) slot.status = status;
    if (allocatedToFlat !== undefined) slot.allocatedToFlat = allocatedToFlat === '' ? null : allocatedToFlat;
    if (vehicleNumber !== undefined) slot.vehicleNumber = vehicleNumber;
    if (notes !== undefined) slot.notes = notes;

    await slot.save();

    return res.status(200).json({ success: true, message: 'Parking slot updated successfully.', data: slot });
  } catch (error) {
    console.error('Update Parking Slot Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Delete a parking slot
 * @route   DELETE /api/security/parking/:id
 * @access  Private (Society Admin)
 */
const deleteParkingSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findOneAndDelete({
      _id: req.params.id,
      societyId: req.user.societyId,
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found.', data: null });
    }

    return res.status(200).json({ success: true, message: 'Parking slot deleted.', data: null });
  } catch (error) {
    console.error('Delete Parking Slot Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};


module.exports = { addParkingSlot, getParkingSlots, updateParkingSlot, deleteParkingSlot };
