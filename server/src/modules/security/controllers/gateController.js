const VisitorLog = require('../models/visitorLogModel');
const StaffLog = require('../models/staffLogModel');
const { sendSms } = require('../../../utils/notificationUtil');
const { logAudit } = require('../../../utils/auditLogger');

/**
 * @desc    Create a new visitor entry (Guard logs it at the gate)
 * @route   POST /api/security/visitors
 * @access  Private — security.edit
 */
const createVisitorEntry = async (req, res) => {
  try {
    const { visitorName, visitorPhone, purpose, vehicleNumber, flatId } = req.body;

    if (!visitorName || !flatId) {
      return res.status(400).json({ success: false, message: 'visitorName and flatId are required', data: null });
    }

    const visitor = await VisitorLog.create({
      societyId: req.user.societyId,
      visitorName,
      visitorPhone: visitorPhone || null,
      purpose: purpose || 'Guest',
      vehicleNumber: vehicleNumber || null,
      flatId,
      status: 'pending_approval',
      loggedBy: req.user.userId,
    });

    await logAudit(req, 'Security', 'CREATE', `New visitor: ${visitorName}`);

    return res.status(201).json({
      success: true,
      message: 'Visitor entry created. Pending resident approval.',
      data: visitor,
    });
  } catch (error) {
    console.error('CreateVisitorEntry Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Update visitor status (Resident approves/rejects, Guard checks in/out)
 * @route   PUT /api/security/visitors/:id
 * @access  Private (Auth only — resident or guard)
 */
const updateVisitorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['approved', 'rejected', 'checked_in', 'checked_out'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}`, data: null });
    }

    // Strict societyId check
    const visitor = await VisitorLog.findOne({
      _id: id,
      societyId: req.user.societyId,
    });

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor log not found in your society', data: null });
    }

    // Update status and set entry/exit times accordingly
    visitor.status = status;

    if (status === 'checked_in') {
      visitor.entryTime = new Date();
    }

    if (status === 'checked_out') {
      visitor.exitTime = new Date();
    }

    await visitor.save();

    return res.status(200).json({
      success: true,
      message: `Visitor status updated to '${status}'`,
      data: visitor,
    });
  } catch (error) {
    console.error('UpdateVisitorStatus Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get active visitors (checked_in or pending_approval) for the society
 * @route   GET /api/security/visitors/active
 * @access  Private — security.view
 */
const getActiveVisitors = async (req, res) => {
  try {
    const visitors = await VisitorLog.find({
      societyId: req.user.societyId,
      status: { $in: ['pending_approval', 'approved', 'checked_in'] },
    })
      .populate('flatId', 'wing flatNumber')
      .populate('loggedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Active visitors fetched successfully',
      data: visitors,
    });
  } catch (error) {
    console.error('GetActiveVisitors Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Record staff movement — toggles between inside/outside
 * @route   POST /api/security/staff/movement
 * @access  Private — security.edit
 */
const recordStaffMovement = async (req, res) => {
  try {
    const { staffId, staffName, staffType, linkedFlats } = req.body;

    // If staffId is provided, toggle existing staff record
    if (staffId) {
      const staff = await StaffLog.findOne({
        _id: staffId,
        societyId: req.user.societyId,
      });

      if (!staff) {
        return res.status(404).json({ success: false, message: 'Staff record not found in your society', data: null });
      }

      // Toggle status
      if (staff.status === 'outside') {
        staff.status = 'inside';
        staff.lastEntry = new Date();
      } else {
        staff.status = 'outside';
        staff.lastExit = new Date();
      }

      staff.loggedBy = req.user.userId;
      await staff.save();

      const action = staff.status === 'inside' ? 'Entry' : 'Exit';

      return res.status(200).json({
        success: true,
        message: `Staff ${action} recorded for ${staff.staffName}`,
        data: staff,
      });
    }

    // If no staffId, create a new staff record (first-time entry)
    if (!staffName) {
      return res.status(400).json({ success: false, message: 'staffName is required for new staff entry', data: null });
    }

    const newStaff = await StaffLog.create({
      societyId: req.user.societyId,
      staffName,
      staffType: staffType || 'Society_Staff',
      linkedFlats: linkedFlats || [],
      status: 'inside',
      lastEntry: new Date(),
      loggedBy: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: `Staff entry recorded for ${staffName}`,
      data: newStaff,
    });
  } catch (error) {
    console.error('RecordStaffMovement Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get all staff (maids, drivers, plumbers) registered in the society
 * @route   GET /api/security/staff
 * @access  Private — Guard or Admin
 */
const getAllStaff = async (req, res) => {
  try {
    const staff = await StaffLog.find({ societyId: req.user.societyId })
      .populate('linkedFlats', 'wing flatNumber')
      .populate('loggedBy', 'firstName lastName')
      .sort({ staffName: 1 });

    return res.status(200).json({
      success: true,
      message: 'Staff list fetched successfully',
      data: staff,
    });
  } catch (error) {
    console.error('GetAllStaff Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Resident pre-approves a visitor (Generates OTP)
 * @route   POST /api/security/visitors/pre-approve
 * @access  Private — Resident
 */
const preApproveVisitor = async (req, res) => {
  try {
    const { visitorName, visitorPhone, purpose, vehicleNumber, expectedEntryDate, flatId } = req.body;

    if (!visitorName || !expectedEntryDate) {
      return res.status(400).json({ success: false, message: 'Visitor name and expected date are required', data: null });
    }

    // Generate a 6-digit OTP
    const passCode = Math.floor(100000 + Math.random() * 900000).toString();

    const visitor = await VisitorLog.create({
      societyId: req.user.societyId,
      visitorName,
      visitorPhone: visitorPhone || null,
      purpose: purpose || 'Guest',
      vehicleNumber: vehicleNumber || null,
      flatId: flatId,
      isPreApproved: true,
      passCode,
      expectedEntryDate,
      status: 'approved', // Pre-approved implies already approved
      loggedBy: req.user.userId,
    });

    await logAudit(req, 'Security', 'CREATE', `Pre-approved visitor: ${visitorName}`);
    
    // Simulate sending SMS to visitor with PassCode
    if (visitorPhone) {
      await sendSms(visitorPhone, `Hi ${visitorName}, you are invited! Your 6-digit Gate PassCode is ${passCode}. Show this at the gate for fast check-in.`);
    }

    return res.status(201).json({
      success: true,
      message: 'Visitor pre-approved. Share the 6-digit PassCode with them.',
      data: {
        ...visitor.toObject(),
        passCode,
      }
    });
  } catch (error) {
    console.error('PreApproveVisitor Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Guard verifies Visitor PassCode
 * @route   POST /api/security/visitors/verify-passcode
 * @access  Private — Guard
 */
const verifyPasscode = async (req, res) => {
  try {
    const { passCode } = req.body;

    if (!passCode) {
      return res.status(400).json({ success: false, message: 'PassCode is required', data: null });
    }

    const visitor = await VisitorLog.findOne({
      societyId: req.user.societyId,
      passCode,
      status: 'approved',
      isPreApproved: true
    }).populate('flatId', 'wing flatNumber');

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Invalid or expired PassCode.', data: null });
    }

    // Auto-check them in since code is valid
    visitor.status = 'checked_in';
    visitor.entryTime = new Date();
    // Nullify passcode so it can't be used twice
    visitor.passCode = null; 
    
    await visitor.save();

    return res.status(200).json({
      success: true,
      message: `PassCode verified! Visitor ${visitor.visitorName} checked in.`,
      data: visitor,
    });
  } catch (error) {
    console.error('VerifyPasscode Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { 
  createVisitorEntry, 
  updateVisitorStatus, 
  getActiveVisitors, 
  recordStaffMovement,
  getAllStaff,
  preApproveVisitor,
  verifyPasscode
};
