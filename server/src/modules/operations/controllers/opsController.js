const Notice = require('../models/noticeModel');
const Complaint = require('../models/complaintModel');
const AssetMaintenance = require('../models/assetMaintenanceModel');

// ═══════════════════════════════════════════════════════════════
//  NOTICES
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Create a new notice (Admin only)
 * @route   POST /api/ops/notices
 * @access  Private — operations.edit
 */
const createNotice = async (req, res) => {
  try {
    const { title, content, type, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'title and content are required', data: null });
    }

    const notice = await Notice.create({
      societyId: req.user.societyId,
      title,
      content,
      type: type || 'general',
      isPinned: isPinned || false,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Notice published successfully',
      data: notice,
    });
  } catch (error) {
    console.error('CreateNotice Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get all notices for the society (pinned first, then newest)
 * @route   GET /api/ops/notices
 * @access  Private (All authenticated users)
 */
const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ societyId: req.user.societyId })
      .populate('createdBy', 'firstName lastName')
      .sort({ isPinned: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Notices fetched successfully',
      data: notices,
    });
  } catch (error) {
    console.error('GetNotices Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// ═══════════════════════════════════════════════════════════════
//  COMPLAINTS / HELPDESK
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Raise a new complaint (Resident)
 * @route   POST /api/ops/complaints
 * @access  Private (Authenticated resident)
 */
const raiseComplaint = async (req, res) => {
  try {
    const { flatId, category, description } = req.body;

    if (!flatId || !description) {
      return res.status(400).json({ success: false, message: 'flatId and description are required', data: null });
    }

    const complaint = await Complaint.create({
      societyId: req.user.societyId,
      flatId,
      raisedBy: req.user.userId,
      category: category || 'other',
      description,
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint raised successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('RaiseComplaint Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Update complaint status and assign staff (Admin)
 * @route   PUT /api/ops/complaints/:id
 * @access  Private — operations.edit
 */
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}`, data: null });
    }

    // Strict societyId check
    const complaint = await Complaint.findOne({
      _id: id,
      societyId: req.user.societyId,
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found in your society', data: null });
    }

    if (status) complaint.status = status;
    if (assignedTo) complaint.assignedTo = assignedTo;

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: `Complaint updated to '${complaint.status}'`,
      data: complaint,
    });
  } catch (error) {
    console.error('UpdateComplaintStatus Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// ═══════════════════════════════════════════════════════════════
//  ASSET MAINTENANCE (Lift, STP, Tanks, Fire Equipment)
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Log maintenance record for a society asset (Admin)
 * @route   POST /api/ops/assets/maintenance
 * @access  Private — operations.edit
 */
const logAssetMaintenance = async (req, res) => {
  try {
    const { assetName, taskType, lastCompletedDate, nextDueDate, costIncurred, vendorName } = req.body;

    if (!assetName || !taskType) {
      return res.status(400).json({ success: false, message: 'assetName and taskType are required', data: null });
    }

    const record = await AssetMaintenance.create({
      societyId: req.user.societyId,
      assetName,
      taskType,
      lastCompletedDate: lastCompletedDate || new Date(),
      nextDueDate: nextDueDate || null,
      costIncurred: costIncurred || 0,
      vendorName: vendorName || null,
    });

    return res.status(201).json({
      success: true,
      message: `Maintenance logged for ${assetName}`,
      data: record,
    });
  } catch (error) {
    console.error('LogAssetMaintenance Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { createNotice, getNotices, raiseComplaint, updateComplaintStatus, logAssetMaintenance };
