const Inventory = require('../models/inventoryModel');
const Document = require('../models/documentModel');
const SecondarySale = require('../models/secondarySaleModel');
const Amenity = require('../models/amenityModel');
const AmenityBooking = require('../models/bookingModel');

// ═══════════════════════════════════════════════════════════════
//  INVENTORY MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Add or update inventory stock for an item (Admin)
 * @route   PUT /api/facilities/inventory
 * @access  Private — admin_assets.edit
 */
const updateInventory = async (req, res) => {
  try {
    const { itemName, category, quantity, unit, minThreshold } = req.body;

    if (!itemName || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'itemName and quantity are required', data: null });
    }

    // Upsert — create if not exists, update if exists
    const item = await Inventory.findOneAndUpdate(
      { societyId: req.user.societyId, itemName },
      {
        societyId: req.user.societyId,
        itemName,
        category: category || 'General',
        quantity,
        unit: unit || 'Pieces',
        minThreshold: minThreshold !== undefined ? minThreshold : 5,
        lastRestocked: new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: `Inventory updated for ${itemName}`,
      data: item,
    });
  } catch (error) {
    console.error('UpdateInventory Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get low-stock items (quantity <= minThreshold) for the society
 * @route   GET /api/facilities/inventory/low-stock
 * @access  Private — admin_assets.view
 */
const getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.find({
      societyId: req.user.societyId,
      $expr: { $lte: ['$quantity', '$minThreshold'] },
    }).sort({ quantity: 1 });

    return res.status(200).json({
      success: true,
      message: 'Low stock items fetched',
      data: items,
    });
  } catch (error) {
    console.error('GetLowStockItems Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// ═══════════════════════════════════════════════════════════════
//  DOCUMENTS & GALLERY
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Upload a document/certificate/gallery image record (Admin)
 * @route   POST /api/facilities/documents
 * @access  Private — admin_assets.edit
 */
const uploadDocument = async (req, res) => {
  try {
    const { title, fileUrl, docType, isPublic } = req.body;

    if (!title || !fileUrl || !docType) {
      return res.status(400).json({ success: false, message: 'title, fileUrl, and docType are required', data: null });
    }

    const doc = await Document.create({
      societyId: req.user.societyId,
      title,
      fileUrl,
      docType,
      uploadedBy: req.user.userId,
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: doc,
    });
  } catch (error) {
    console.error('UploadDocument Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get public documents for residents
 * @route   GET /api/facilities/documents
 * @access  Private (Authenticated — all society members)
 */
const getPublicDocuments = async (req, res) => {
  try {
    const { docType } = req.query;

    const filter = { societyId: req.user.societyId, isPublic: true };
    if (docType) filter.docType = docType;

    const docs = await Document.find(filter)
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Documents fetched successfully',
      data: docs,
    });
  } catch (error) {
    console.error('GetPublicDocuments Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// ═══════════════════════════════════════════════════════════════
//  SECONDARY SALE / RENT — NOC WORKFLOW
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Get all NOC requests for the society
 * @route   GET /api/facilities/noc
 * @access  Private (Auth — society members)
 */
const getNocRequests = async (req, res) => {
  try {
    const filter = { societyId: req.user.societyId };

    // Residents only see their own requests
    if (req.user.userType === 'resident') {
      filter.ownerId = req.user.userId;
    }

    const nocs = await SecondarySale.find(filter)
      .populate('flatId', 'wing flatNumber')
      .populate('ownerId', 'firstName lastName phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'NOC requests fetched successfully',
      data: nocs,
    });
  } catch (error) {
    console.error('GetNocRequests Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Submit an NOC request for secondary sale/rent (Resident/Owner)
 * @route   POST /api/facilities/noc
 * @access  Private (Authenticated)
 */
const requestNoc = async (req, res) => {
  try {
    const { flatId, requestType, buyerOrTenantName } = req.body;

    if (!flatId || !requestType) {
      return res.status(400).json({ success: false, message: 'flatId and requestType are required', data: null });
    }

    // Prevent duplicate pending requests for same flat
    const existing = await SecondarySale.findOne({
      societyId: req.user.societyId,
      flatId,
      status: 'pending_noc',
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'An NOC request for this flat is already pending', data: null });
    }

    const noc = await SecondarySale.create({
      societyId: req.user.societyId,
      flatId,
      ownerId: req.user.userId,
      requestType,
      buyerOrTenantName: buyerOrTenantName || null,
    });

    return res.status(201).json({
      success: true,
      message: 'NOC request submitted successfully',
      data: noc,
    });
  } catch (error) {
    console.error('RequestNoc Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Approve or reject an NOC request (Admin)
 * @route   PUT /api/facilities/noc/:id
 * @access  Private — admin_assets.edit
 */
const updateNocStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['noc_issued', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}`, data: null });
    }

    const noc = await SecondarySale.findOne({
      _id: id,
      societyId: req.user.societyId,
    });

    if (!noc) {
      return res.status(404).json({ success: false, message: 'NOC request not found in your society', data: null });
    }

    if (noc.status !== 'pending_noc') {
      return res.status(400).json({ success: false, message: `This NOC is already ${noc.status}. Cannot update.`, data: null });
    }

    noc.status = status;
    await noc.save();

    return res.status(200).json({
      success: true,
      message: `NOC ${status === 'noc_issued' ? 'approved' : 'rejected'} successfully`,
      data: noc,
    });
  } catch (error) {
    console.error('UpdateNocStatus Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// ═══════════════════════════════════════════════════════════════
//  AMENITIES & BOOKINGS (Clubhouse, Tennis Court, etc.)
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Add or Update an Amenity (Admin)
 * @route   POST /api/facilities/amenities
 * @access  Private — admin_assets.edit
 */
const saveAmenity = async (req, res) => {
  try {
    const { id, name, description, rules, openTime, closeTime, maxCapacity, isChargeable, ratePerHour, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required', data: null });
    }

    let amenity;
    if (id) {
      amenity = await Amenity.findOneAndUpdate(
        { _id: id, societyId: req.user.societyId },
        { name, description, rules, openTime, closeTime, maxCapacity, isChargeable, ratePerHour, isActive },
        { new: true }
      );
      if (!amenity) return res.status(404).json({ success: false, message: 'Amenity not found', data: null });
    } else {
      amenity = await Amenity.create({
        societyId: req.user.societyId,
        name, description, rules, openTime, closeTime, maxCapacity, isChargeable, ratePerHour, isActive
      });
    }

    return res.status(id ? 200 : 201).json({
      success: true,
      message: `Amenity ${id ? 'updated' : 'created'} successfully`,
      data: amenity,
    });
  } catch (error) {
    console.error('SaveAmenity Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get all amenities for the society
 * @route   GET /api/facilities/amenities
 * @access  Private (All authenticated members)
 */
const getAmenities = async (req, res) => {
  try {
    const amenities = await Amenity.find({ societyId: req.user.societyId }).sort({ name: 1 });
    return res.status(200).json({ success: true, data: amenities });
  } catch (error) {
    console.error('GetAmenities Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Book an amenity (Resident)
 * @route   POST /api/facilities/bookings
 * @access  Private (Resident)
 */
const bookAmenity = async (req, res) => {
  try {
    const { amenityId, bookingDate, startTime, endTime } = req.body;

    if (!amenityId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'All booking fields are required', data: null });
    }

    const amenity = await Amenity.findOne({ _id: amenityId, societyId: req.user.societyId });
    if (!amenity) {
      return res.status(404).json({ success: false, message: 'Amenity not found', data: null });
    }

    if (!amenity.isActive) {
      return res.status(400).json({ success: false, message: 'This amenity is currently inactive', data: null });
    }

    // Checking for slot overlap (simple logic)
    const existingBooking = await AmenityBooking.findOne({
      amenityId,
      bookingDate: new Date(bookingDate),
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
      ]
    });

    // If maxCapacity > 0, we could count overlapping bookings, but for simplicity, if it's booked, we reject.
    if (existingBooking && amenity.maxCapacity <= 1) {
       return res.status(409).json({ success: false, message: 'This time slot is already booked', data: null });
    }

    // Calculate hours to calculate totalCost (simplified)
    const formatTime = (t) => { const [h, m] = t.split(':'); return parseInt(h) + (parseInt(m)/60); };
    let hours = formatTime(endTime) - formatTime(startTime);
    if(hours < 0) hours = 0; // Invalid time range mitigation

    const totalCost = amenity.isChargeable ? hours * amenity.ratePerHour : 0;

    const booking = await AmenityBooking.create({
      societyId: req.user.societyId,
      amenityId,
      residentId: req.user.userId,
      flatId: req.user.flatId,
      bookingDate: new Date(bookingDate),
      startTime,
      endTime,
      totalCost,
      status: 'pending', // Admins must approve
    });

    return res.status(201).json({
      success: true,
      message: 'Booking request submitted. Awaiting admin approval.',
      data: booking,
    });
  } catch (error) {
    console.error('BookAmenity Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get amenity bookings (Admin sees all, Resident sees their own)
 * @route   GET /api/facilities/bookings
 * @access  Private
 */
const getBookings = async (req, res) => {
  try {
    const filter = { societyId: req.user.societyId };
    
    // If resident, enforce only their own bookings
    if (req.user.userType === 'resident') {
      filter.residentId = req.user.userId;
    }

    const bookings = await AmenityBooking.find(filter)
      .populate('amenityId', 'name')
      .populate('flatId', 'wing flatNumber')
      .populate('residentId', 'firstName lastName')
      .sort({ bookingDate: -1, startTime: -1 });

    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error('GetBookings Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Approve/Reject a booking (Admin)
 * @route   PUT /api/facilities/bookings/:id
 * @access  Private — admin_assets.edit
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, adminNotes } = req.body;

    const booking = await AmenityBooking.findOne({ _id: id, societyId: req.user.societyId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found', data: null });
    }

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (adminNotes !== undefined) booking.adminNotes = adminNotes;

    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Booking ${status || 'updated'} successfully`,
      data: booking,
    });
  } catch (error) {
    console.error('UpdateBookingStatus Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = { 
  updateInventory, 
  getLowStockItems, 
  uploadDocument, 
  getPublicDocuments, 
  getNocRequests, 
  requestNoc, 
  updateNocStatus,
  saveAmenity,
  getAmenities,
  bookAmenity,
  getBookings,
  updateBookingStatus
};
