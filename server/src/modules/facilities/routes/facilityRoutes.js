const express = require('express');
const router = express.Router();

// Middleware
const { authenticate } = require('../../../middlewares/authMiddleware');
const { checkPermission } = require('../../../middlewares/rbacMiddleware');

// Controllers
const { updateInventory, getLowStockItems, uploadDocument, getPublicDocuments, requestNoc, updateNocStatus } = require('../controllers/facilityController');

// ─── Inventory Routes ───────────────────────────────────────────
router.put('/inventory', authenticate, checkPermission('admin_assets', 'edit'), updateInventory);
router.get('/inventory/low-stock', authenticate, checkPermission('admin_assets', 'view'), getLowStockItems);

// ─── Document / Gallery Routes ──────────────────────────────────
router.post('/documents', authenticate, checkPermission('admin_assets', 'edit'), uploadDocument);
router.get('/documents', authenticate, getPublicDocuments);

// ─── NOC (Secondary Sale/Rent) Routes ───────────────────────────
router.post('/noc', authenticate, requestNoc);
router.put('/noc/:id', authenticate, checkPermission('admin_assets', 'edit'), updateNocStatus);

module.exports = router;
