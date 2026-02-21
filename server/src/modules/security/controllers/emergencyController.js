const EmergencyContact = require('../models/emergencyContactModel');

/**
 * @desc    Add a new emergency contact
 * @route   POST /api/security/emergency-contacts
 * @access  Private (Society Admin)
 */
const addEmergencyContact = async (req, res) => {
  try {
    const { category, name, phone, address, description } = req.body;

    if (!category || !name || !phone) {
      return res.status(400).json({ success: false, message: 'Category, name, and phone are required.', data: null });
    }

    const exists = await EmergencyContact.findOne({
      societyId: req.user.societyId,
      category,
      name,
    });

    if (exists) {
      return res.status(409).json({ success: false, message: 'This contact already exists in this category.', data: null });
    }

    const contact = await EmergencyContact.create({
      societyId: req.user.societyId,
      category,
      name,
      phone,
      address,
      description,
      createdBy: req.user.userId,
    });

    return res.status(201).json({ success: true, message: 'Emergency contact added successfully.', data: contact });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate contact entry.', data: null });
    }
    console.error('Add Emergency Contact Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get all emergency contacts for society
 * @route   GET /api/security/emergency-contacts
 * @access  Private (All Roles - Resident, Admin, Guard)
 */
const getEmergencyContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ societyId: req.user.societyId }).sort({ category: 1, name: 1 });
    return res.status(200).json({ success: true, message: 'Emergency contacts fetched.', data: contacts });
  } catch (error) {
    console.error('Get Emergency Contacts Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Delete an emergency contact
 * @route   DELETE /api/security/emergency-contacts/:id
 * @access  Private (Society Admin)
 */
const deleteEmergencyContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findOneAndDelete({
      _id: req.params.id,
      societyId: req.user.societyId,
    });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.', data: null });
    }

    return res.status(200).json({ success: true, message: 'Contact deleted successfully.', data: null });
  } catch (error) {
    console.error('Delete Emergency Contact Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { addEmergencyContact, getEmergencyContacts, deleteEmergencyContact };
