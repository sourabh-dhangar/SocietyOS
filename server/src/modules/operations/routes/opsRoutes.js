const express = require('express');
const router = express.Router();

// Middleware
const { authenticate } = require('../../../middlewares/authMiddleware');
const { checkPermission } = require('../../../middlewares/rbacMiddleware');

// Controllers
const { createNotice, getNotices, raiseComplaint, updateComplaintStatus, logAssetMaintenance } = require('../controllers/opsController');

// ─── Notice Routes ──────────────────────────────────────────────
router.post('/notices', authenticate, checkPermission('operations', 'edit'), createNotice);
router.get('/notices', authenticate, getNotices);

// ─── Complaint / Helpdesk Routes ────────────────────────────────
router.post('/complaints', authenticate, raiseComplaint);
router.put('/complaints/:id', authenticate, checkPermission('operations', 'edit'), updateComplaintStatus);

// ─── Asset Maintenance Routes ───────────────────────────────────
router.post('/assets/maintenance', authenticate, checkPermission('operations', 'edit'), logAssetMaintenance);

module.exports = router;
