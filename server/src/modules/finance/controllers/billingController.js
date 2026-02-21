const mongoose = require('mongoose');
const Bill = require('../models/billModel');
const Transaction = require('../models/transactionModel');
const BillingConfig = require('../models/billingConfigModel');
const Flat = require('../../core/models/flatModel');
const { paginate, paginatedResponse } = require('../../../utils/paginate');

// ═══════════════════════════════════════════════════════════════
//  BILLING CONFIG (Charge Heads & Rules)
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Get or create billing config for the society
 * @route   GET /api/finance/config
 * @access  Private — finance.view
 */
const getBillingConfig = async (req, res) => {
  try {
    let config = await BillingConfig.findOne({ societyId: req.user.societyId });

    // Auto-create default config if none exists
    if (!config) {
      config = await BillingConfig.create({
        societyId: req.user.societyId,
        chargeHeads: [
          { name: 'Maintenance', type: 'per_sqft', rate: 5, isNonOccupancy: false, isSinkingFund: false },
          { name: 'Sinking Fund', type: 'per_sqft', rate: 1, isNonOccupancy: false, isSinkingFund: true },
          { name: 'Water Charges', type: 'fixed', rate: 300, isNonOccupancy: false, isSinkingFund: false },
          { name: 'Parking', type: 'fixed', rate: 500, isNonOccupancy: false, isSinkingFund: false },
          { name: 'Non-Occupancy Charge', type: 'fixed', rate: 1000, isNonOccupancy: true, isSinkingFund: false },
        ],
        defaultDueDay: 10,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Billing config fetched',
      data: config,
    });
  } catch (error) {
    console.error('GetBillingConfig Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Update billing config (charge heads, due date, late fee)
 * @route   PUT /api/finance/config
 * @access  Private — finance.edit
 */
const updateBillingConfig = async (req, res) => {
  try {
    const { chargeHeads, defaultDueDay, lateFee } = req.body;

    let config = await BillingConfig.findOne({ societyId: req.user.societyId });

    if (!config) {
      config = new BillingConfig({ societyId: req.user.societyId });
    }

    if (chargeHeads) config.chargeHeads = chargeHeads;
    if (defaultDueDay) config.defaultDueDay = defaultDueDay;
    if (lateFee) config.lateFee = { ...config.lateFee?.toObject?.() || {}, ...lateFee };

    await config.save();

    return res.status(200).json({
      success: true,
      message: 'Billing config updated',
      data: config,
    });
  } catch (error) {
    console.error('UpdateBillingConfig Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// ═══════════════════════════════════════════════════════════════
//  BILL GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate bill breakdown for a single flat based on charge heads
 */
const calculateBreakdown = (flat, chargeHeads) => {
  const breakdown = [];
  let total = 0;
  const namedTotals = {};

  // First pass — calculate non-percentage charges
  for (const head of chargeHeads) {
    if (!head.isActive) continue;
    if (head.type === 'percentage') continue; // process in second pass

    // Non-occupancy charges only apply to rented/vacant flats
    if (head.isNonOccupancy && flat.status === 'owner_occupied') continue;

    let amount = 0;
    if (head.type === 'per_sqft') {
      amount = Math.round(head.rate * (flat.sizeSqFt || 0));
    } else if (head.type === 'fixed') {
      amount = head.rate;
    }

    breakdown.push({ chargeName: head.name, amount });
    namedTotals[head.name] = amount;
    total += amount;
  }

  // Second pass — percentage charges (e.g., sinking fund = 10% of maintenance)
  for (const head of chargeHeads) {
    if (!head.isActive) continue;
    if (head.type !== 'percentage') continue;

    const baseAmount = namedTotals[head.percentageOf] || total;
    const amount = Math.round((head.rate / 100) * baseAmount);

    breakdown.push({ chargeName: head.name, amount });
    total += amount;
  }

  return { breakdown, total };
};

/**
 * @desc    Generate a bill for a specific flat (Admin only)
 * @route   POST /api/finance/bills
 * @access  Private — finance.edit
 */
const generateBill = async (req, res) => {
  try {
    const { flatId, userId, billMonth, dueDate, amount, breakdown } = req.body;

    if (!flatId || !billMonth || !dueDate || !amount) {
      return res.status(400).json({ success: false, message: 'flatId, billMonth, dueDate, and amount are required', data: null });
    }

    // Prevent duplicate bills
    const exists = await Bill.findOne({
      societyId: req.user.societyId,
      flatId,
      billMonth,
    });

    if (exists) {
      return res.status(409).json({ success: false, message: `Bill for this flat already exists for ${billMonth}`, data: null });
    }

    const bill = await Bill.create({
      societyId: req.user.societyId,
      flatId,
      userId,
      billMonth,
      dueDate,
      amount,
      breakdown: breakdown || [],
    });

    return res.status(201).json({
      success: true,
      message: 'Bill generated successfully',
      data: bill,
    });
  } catch (error) {
    console.error('GenerateBill Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Bulk generate bills for ALL flats in the society using billing config
 * @route   POST /api/finance/bills/bulk
 * @access  Private — finance.edit
 */
const generateBulkBills = async (req, res) => {
  try {
    const { billMonth, dueDate } = req.body;

    if (!billMonth || !dueDate) {
      return res.status(400).json({ success: false, message: 'billMonth and dueDate are required', data: null });
    }

    // Get billing config
    const config = await BillingConfig.findOne({ societyId: req.user.societyId });
    if (!config || !config.chargeHeads || config.chargeHeads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No billing config found. Please set up charge heads first in Billing Settings.',
        data: null,
      });
    }

    // Get all active flats
    const flats = await Flat.find({ societyId: req.user.societyId, isActive: true });

    if (flats.length === 0) {
      return res.status(400).json({ success: false, message: 'No active flats found in the society', data: null });
    }

    // Check for existing bills this month
    const existingBills = await Bill.find({
      societyId: req.user.societyId,
      billMonth,
    }).select('flatId').lean();

    const existingFlatIds = new Set(existingBills.map((b) => b.flatId.toString()));

    // Generate bills for flats that don't have one yet
    const billsToCreate = [];
    let skipped = 0;

    for (const flat of flats) {
      if (existingFlatIds.has(flat._id.toString())) {
        skipped++;
        continue;
      }

      const { breakdown, total } = calculateBreakdown(flat, config.chargeHeads);

      billsToCreate.push({
        societyId: req.user.societyId,
        flatId: flat._id,
        userId: flat.ownerId || flat.tenantId || null,
        billMonth,
        dueDate: new Date(dueDate),
        amount: total,
        breakdown,
        status: 'pending',
      });
    }

    let created = 0;
    if (billsToCreate.length > 0) {
      const result = await Bill.insertMany(billsToCreate);
      created = result.length;
    }

    return res.status(201).json({
      success: true,
      message: `Bulk billing complete: ${created} bills generated, ${skipped} skipped (already existed)`,
      data: {
        generated: created,
        skipped,
        totalFlats: flats.length,
      },
    });
  } catch (error) {
    console.error('GenerateBulkBills Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// ═══════════════════════════════════════════════════════════════
//  BILL QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Get all bills for the society (Admin) with pagination + filters
 * @route   GET /api/finance/bills?status=pending&month=February 2026&page=1&limit=20
 * @access  Private — finance.view
 */
const getSocietyBills = async (req, res) => {
  try {
    const { status, month } = req.query;
    const { page, limit, skip } = paginate(req.query);

    const filter = { societyId: req.user.societyId };
    if (status) filter.status = status;
    if (month) filter.billMonth = month;

    const [bills, total] = await Promise.all([
      Bill.find(filter)
        .populate('flatId', 'wing flatNumber floor sizeSqFt')
        .populate('userId', 'firstName lastName phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Bill.countDocuments(filter),
    ]);

    return res.status(200).json(paginatedResponse(bills, total, page, limit, 'Bills fetched successfully'));
  } catch (error) {
    console.error('GetSocietyBills Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get bills for the logged-in resident
 * @route   GET /api/finance/my-bills
 * @access  Private (Resident viewing own bills)
 */
const getMyBills = async (req, res) => {
  try {
    const bills = await Bill.find({
      societyId: req.user.societyId,
      userId: req.user.userId,
    })
      .populate('flatId', 'wing flatNumber')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Your bills fetched successfully',
      data: bills,
    });
  } catch (error) {
    console.error('GetMyBills Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PAYMENTS
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Record a payment against a bill (uses Mongoose transaction)
 * @route   POST /api/finance/pay
 * @access  Private (Admin or Resident)
 */
const recordPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { billId, amountPaid, paymentMethod, transactionRef } = req.body;

    if (!billId || !amountPaid || !paymentMethod) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'billId, amountPaid, and paymentMethod are required', data: null });
    }

    const bill = await Bill.findOne({
      _id: billId,
      societyId: req.user.societyId,
    }).session(session);

    if (!bill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Bill not found in your society', data: null });
    }

    if (bill.status === 'paid') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'This bill is already paid', data: null });
    }

    const txnStatus = paymentMethod === 'cheque' ? 'pending_clearance' : 'success';

    const transaction = await Transaction.create(
      [{
        societyId: req.user.societyId,
        billId: bill._id,
        userId: req.user.userId,
        amountPaid,
        paymentMethod,
        transactionRef: transactionRef || null,
        status: txnStatus,
      }],
      { session }
    );

    bill.status = txnStatus === 'success' ? 'paid' : 'pending';
    await bill.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: txnStatus === 'success' ? 'Payment recorded successfully' : 'Payment recorded. Cheque pending clearance.',
      data: {
        transaction: transaction[0],
        billStatus: bill.status,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('RecordPayment Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// ═══════════════════════════════════════════════════════════════
//  FINANCIAL STATS / DASHBOARD
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Get financial summary for the society dashboard
 * @route   GET /api/finance/stats
 * @access  Private — finance.view
 */
const getFinancialStats = async (req, res) => {
  try {
    const societyId = req.user.societyId;

    const [
      totalBills,
      paidBills,
      pendingBills,
      totalCollected,
      totalPending,
      sinkingFundCollected,
      monthlyTrend,
      chargeBreakdown,
      monthlyBillTrend,
    ] = await Promise.all([
      // Total bills count
      Bill.countDocuments({ societyId }),
      // Paid bills count
      Bill.countDocuments({ societyId, status: 'paid' }),
      // Pending bills count
      Bill.countDocuments({ societyId, status: 'pending' }),
      // Total amount collected
      Transaction.aggregate([
        { $match: { societyId: new mongoose.Types.ObjectId(societyId), status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      // Total pending amount
      Bill.aggregate([
        { $match: { societyId: new mongoose.Types.ObjectId(societyId), status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Sinking fund collected (from breakdown items marked as sinking fund)
      Bill.aggregate([
        { $match: { societyId: new mongoose.Types.ObjectId(societyId), status: 'paid' } },
        { $unwind: '$breakdown' },
        { $match: { 'breakdown.chargeName': 'Sinking Fund' } },
        { $group: { _id: null, total: { $sum: '$breakdown.amount' } } },
      ]),
      // Monthly collection trend (last 6 months)
      Transaction.aggregate([
        { $match: { societyId: new mongoose.Types.ObjectId(societyId), status: 'success' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } },
            amount: { $sum: '$amountPaid' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 6 },
      ]),
      // Charge Head Breakdown (Pie Chart)
      Bill.aggregate([
        { $match: { societyId: new mongoose.Types.ObjectId(societyId) } },
        { $unwind: '$breakdown' },
        {
          $group: {
            _id: '$breakdown.chargeName',
            totalAmount: { $sum: '$breakdown.amount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),
      // Monthly Bill Generation vs Collected Trend (Bar Chart)
      Bill.aggregate([
        { $match: { societyId: new mongoose.Types.ObjectId(societyId) } },
        {
          $group: {
            _id: '$billMonth',
            totalBilled: { $sum: '$amount' },
            totalCollected: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
            },
            totalPending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
            }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 6 }
      ])
    ]);

    return res.status(200).json({
      success: true,
      message: 'Financial stats fetched',
      data: {
        totalBills,
        paidBills,
        pendingBills,
        collectionRate: totalBills > 0 ? Math.round((paidBills / totalBills) * 100) : 0,
        totalCollected: totalCollected[0]?.total || 0,
        totalPending: totalPending[0]?.total || 0,
        sinkingFundCollected: sinkingFundCollected[0]?.total || 0,
        monthlyTrend: monthlyTrend.reverse(),
        chargeBreakdown: chargeBreakdown || [],
        monthlyBillTrend: monthlyBillTrend.reverse() || [],
      },
    });
  } catch (error) {
    console.error('GetFinancialStats Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = {
  getBillingConfig,
  updateBillingConfig,
  generateBill,
  generateBulkBills,
  getSocietyBills,
  getMyBills,
  recordPayment,
  getFinancialStats,
};
