const VisitorLog = require('../models/visitorLogModel');
const StaffLog = require('../models/staffLogModel');

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

module.exports = { createVisitorEntry, updateVisitorStatus, getActiveVisitors, recordStaffMovement };
