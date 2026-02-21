const AuditLog = require('../models/auditLogModel');
const { paginate, paginatedResponse } = require('../../../utils/paginate');

/**
 * @desc    Get paginated audit logs for the society
 * @route   GET /api/core/audit-logs
 * @access  Private (society_admin)
 */
const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { moduleName, action } = req.query; // optional filters

    let query = { societyId: req.user.societyId };
    
    // Optional filters
    if (moduleName) query.module = moduleName;
    if (action) query.action = action;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'firstName lastName userType email')
        .sort({ createdAt: -1 }) // newest first
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return res.status(200).json(paginatedResponse(logs, total, page, limit, 'Audit logs fetched successfully'));
  } catch (error) {
    console.error('getAuditLogs Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { getAuditLogs };
