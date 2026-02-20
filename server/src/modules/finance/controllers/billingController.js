const mongoose = require('mongoose');
const Bill = require('../models/billModel');
const Transaction = require('../models/transactionModel');

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

    // Prevent duplicate bills for the same flat+month within the society
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
 * @desc    Get all bills for the society (Admin) with optional filters
 * @route   GET /api/finance/bills?status=pending&month=February 2026
 * @access  Private — finance.view
 */
const getSocietyBills = async (req, res) => {
  try {
    const { status, month } = req.query;

    const filter = { societyId: req.user.societyId };
    if (status) filter.status = status;
    if (month) filter.billMonth = month;

    const bills = await Bill.find(filter)
      .populate('flatId', 'wing flatNumber floor')
      .populate('userId', 'firstName lastName phone email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Bills fetched successfully',
      data: bills,
    });
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

/**
 * @desc    Record a payment against a bill (uses Mongoose transaction for data integrity)
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

    // Find the bill — strict societyId check
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

    // Determine transaction status based on payment method
    const txnStatus = paymentMethod === 'cheque' ? 'pending_clearance' : 'success';

    // Create transaction record
    const transaction = await Transaction.create(
      [
        {
          societyId: req.user.societyId,
          billId: bill._id,
          userId: req.user.userId,
          amountPaid,
          paymentMethod,
          transactionRef: transactionRef || null,
          status: txnStatus,
        },
      ],
      { session }
    );

    // Update bill status
    bill.status = txnStatus === 'success' ? 'paid' : 'pending_clearance';
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

module.exports = { generateBill, getSocietyBills, getMyBills, recordPayment };
