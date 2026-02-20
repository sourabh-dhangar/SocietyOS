const express = require('express');
const router = express.Router();

// Middleware
const { authenticate } = require('../../../middlewares/authMiddleware');
const { checkPermission } = require('../../../middlewares/rbacMiddleware');

// Controllers
const { createVisitorEntry, updateVisitorStatus, getActiveVisitors, recordStaffMovement } = require('../controllers/gateController');

// ─── Visitor Routes ─────────────────────────────────────────────
router.post('/visitors', authenticate, checkPermission('security', 'edit'), createVisitorEntry);
router.get('/visitors/active', authenticate, checkPermission('security', 'view'), getActiveVisitors);
router.put('/visitors/:id', authenticate, updateVisitorStatus);

// ─── Staff Movement Routes ─────────────────────────────────────
router.post('/staff/movement', authenticate, checkPermission('security', 'edit'), recordStaffMovement);

module.exports = router;
