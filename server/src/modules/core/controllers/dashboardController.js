const Flat = require('../models/flatModel');
const User = require('../models/userModel');
const Bill = require('../../finance/models/billModel');
const VisitorLog = require('../../security/models/visitorLogModel');

/**
 * @desc    Get dashboard stats for a specific society
 * @route   GET /api/dashboard/society-stats
 * @access  Private (Authenticated users with a societyId)
 */
const getSocietyStats = async (req, res) => {
  try {
    const { societyId } = req.user;

    if (!societyId) {
      return res.status(400).json({ success: false, message: 'No society linked to this user', data: null });
    }

    // Run all queries in parallel for performance
    const [totalFlats, totalResidents, pendingDuesResult, activeVisitors] = await Promise.all([
      Flat.countDocuments({ societyId }),
      User.countDocuments({ societyId, userType: 'resident' }),
      Bill.aggregate([
        { $match: { societyId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      VisitorLog.countDocuments({ societyId, status: 'checked_in' }),
    ]);

    const totalPendingDues = pendingDuesResult.length > 0 ? pendingDuesResult[0].total : 0;

    return res.status(200).json({
      success: true,
      message: 'Society stats fetched',
      data: {
        totalFlats,
        totalResidents,
        totalPendingDues,
        activeVisitors,
      },
    });
  } catch (error) {
    console.error('GetSocietyStats Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { getSocietyStats };
