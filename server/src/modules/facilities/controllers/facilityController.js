const Inventory = require('../models/inventoryModel');
const Document = require('../models/documentModel');
const SecondarySale = require('../models/secondarySaleModel');

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

module.exports = { updateInventory, getLowStockItems, uploadDocument, getPublicDocuments, requestNoc, updateNocStatus };
