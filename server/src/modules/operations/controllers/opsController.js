const Notice = require('../models/noticeModel');
const Complaint = require('../models/complaintModel');
const AssetMaintenance = require('../models/assetMaintenanceModel');
const StpLog = require('../models/stpLogModel');
const WaterTankerLog = require('../models/waterTankerModel');
const User = require('../../core/models/userModel');
const { sendEmail } = require('../../../utils/notificationUtil');
const { logAudit } = require('../../../utils/auditLogger');

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

    await logAudit(req, 'Operations', 'CREATE', `Published notice: ${title}`);

    // Send email blast to residents
    try {
      const residents = await User.find({ 
        societyId: req.user.societyId, 
        userType: 'resident', 
        isActive: true, 
        email: { $ne: null } 
      }).select('email');
      
      const emails = residents.map(r => r.email);
      
      if (emails.length > 0) {
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #6C63FF; margin-top: 0;">New Society Notice</h2>
            <h3>${title}</h3>
            <p style="color: #374151; white-space: pre-wrap;">${content}</p>
            <br/>
            <hr style="border: none; border-top: 1px solid #e5e7eb;" />
            <small style="color: #6B7280;">This is an automated message from your Nakshatra Society Management portal. Please do not reply.</small>
          </div>
        `;
        // Nodemailer supports comma-separated emails
        await sendEmail(emails.join(','), `Notice: ${title}`, html);
      }
    } catch (err) {
      console.error('Failed to blast notice emails:', err.message);
    }

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
 * @desc    Get all complaints for the society
 * @route   GET /api/ops/complaints
 * @access  Private (Auth — society members)
 */
const getComplaints = async (req, res) => {
  try {
    const filter = { societyId: req.user.societyId };

    // Residents only see their own complaints
    if (req.user.userType === 'resident') {
      filter.raisedBy = req.user.userId;
    }

    const complaints = await Complaint.find(filter)
      .populate('flatId', 'wing flatNumber')
      .populate('raisedBy', 'firstName lastName phone')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Complaints fetched successfully',
      data: complaints,
    });
  } catch (error) {
    console.error('GetComplaints Error:', error.message);
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

/**
 * @desc    Get asset maintenance logs
 * @route   GET /api/ops/assets/maintenance
 * @access  Private — operations.view
 */
const getAssetMaintenanceLogs = async (req, res) => {
  try {
    const logs = await AssetMaintenance.find({ societyId: req.user.societyId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Asset maintenance logs fetched successfully',
      data: logs,
    });
  } catch (error) {
    console.error('GetAssetMaintenanceLogs Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// ═══════════════════════════════════════════════════════════════
//  STP & WATER TANKERS
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Log STP Readings
 * @route   POST /api/ops/stp
 * @access  Private — operations.edit
 */
const addStpLog = async (req, res) => {
  try {
    const { logDate, operatorName, phLevel, tssLevel, codLevel, bodLevel, motorStatus, remarks } = req.body;

    if (!operatorName || phLevel === undefined || tssLevel === undefined) {
      return res.status(400).json({ success: false, message: 'operatorName, phLevel, and tssLevel are required', data: null });
    }

    const log = await StpLog.create({
      societyId: req.user.societyId,
      logDate: logDate || new Date(),
      operatorName,
      phLevel,
      tssLevel,
      codLevel: codLevel || null,
      bodLevel: bodLevel || null,
      motorStatus: motorStatus || 'running',
      remarks: remarks || '',
      loggedBy: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: 'STP log recorded successfully',
      data: log,
    });
  } catch (error) {
    console.error('AddStpLog Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get STP Logs
 * @route   GET /api/ops/stp
 * @access  Private — operations.view
 */
const getStpLogs = async (req, res) => {
  try {
    const logs = await StpLog.find({ societyId: req.user.societyId })
      .populate('loggedBy', 'firstName lastName')
      .sort({ logDate: -1 });

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('GetStpLogs Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Log Water Tanker Delivery
 * @route   POST /api/ops/water-tankers
 * @access  Private — operations.edit
 */
const addWaterTankerLog = async (req, res) => {
  try {
    const { deliveryDate, vendorName, capacityLiters, cost, isPaid, receivedBy, operatorNotes } = req.body;

    if (!vendorName || !capacityLiters || cost === undefined) {
      return res.status(400).json({ success: false, message: 'vendorName, capacityLiters, and cost are required', data: null });
    }

    const log = await WaterTankerLog.create({
      societyId: req.user.societyId,
      deliveryDate: deliveryDate || new Date(),
      vendorName,
      capacityLiters,
      cost,
      isPaid: isPaid || false,
      receivedBy: receivedBy || '',
      operatorNotes: operatorNotes || '',
      loggedBy: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Water tanker delivery logged successfully',
      data: log,
    });
  } catch (error) {
    console.error('AddWaterTankerLog Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get Water Tanker Logs
 * @route   GET /api/ops/water-tankers
 * @access  Private — operations.view
 */
const getWaterTankerLogs = async (req, res) => {
  try {
    const logs = await WaterTankerLog.find({ societyId: req.user.societyId })
      .populate('loggedBy', 'firstName lastName')
      .sort({ deliveryDate: -1 });

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('GetWaterTankerLogs Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { 
  createNotice, 
  getNotices, 
  raiseComplaint, 
  getComplaints, 
  updateComplaintStatus, 
  logAssetMaintenance,
  getAssetMaintenanceLogs,
  addStpLog,
  getStpLogs,
  addWaterTankerLog,
  getWaterTankerLogs
};
