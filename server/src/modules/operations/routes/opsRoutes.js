const express = require('express');
const router = express.Router();

// Middleware
const { authenticate } = require('../../../middlewares/authMiddleware');
const { checkPermission } = require('../../../middlewares/rbacMiddleware');
const { enforceSociety } = require('../../../middlewares/societyMiddleware');
const { checkSocietyFeature } = require('../../../middlewares/featureToggle');

// Controllers
const { 
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
} = require('../controllers/opsController');

// ─── Notice Routes ──────────────────────────────────────────────
router.post('/notices', authenticate, enforceSociety, checkSocietyFeature('operations'), checkPermission('notices', 'edit'), createNotice);
router.get('/notices', authenticate, enforceSociety, checkSocietyFeature('operations'), getNotices);

// ─── Complaint / Helpdesk Routes ────────────────────────────────
router.post('/complaints', authenticate, enforceSociety, checkSocietyFeature('operations'), raiseComplaint);
router.get('/complaints', authenticate, enforceSociety, checkSocietyFeature('operations'), getComplaints);
router.put('/complaints/:id', authenticate, enforceSociety, checkSocietyFeature('operations'), checkPermission('operations', 'edit'), updateComplaintStatus);

// ─── Asset Maintenance Routes ───────────────────────────────────
router.post('/assets/maintenance', authenticate, enforceSociety, checkSocietyFeature('operations'), checkPermission('operations', 'edit'), logAssetMaintenance);
router.get('/assets/maintenance', authenticate, enforceSociety, checkSocietyFeature('operations'), checkPermission('operations', 'view'), getAssetMaintenanceLogs);

// ─── STP Logs Routes ──────────────────────────────────────────
router.post('/stp', authenticate, enforceSociety, checkSocietyFeature('operations'), checkPermission('operations', 'edit'), addStpLog);
router.get('/stp', authenticate, enforceSociety, checkSocietyFeature('operations'), checkPermission('operations', 'view'), getStpLogs);

// ─── Water Tankers Routes ─────────────────────────────────────
router.post('/water-tankers', authenticate, enforceSociety, checkSocietyFeature('operations'), checkPermission('operations', 'edit'), addWaterTankerLog);
router.get('/water-tankers', authenticate, enforceSociety, checkSocietyFeature('operations'), checkPermission('operations', 'view'), getWaterTankerLogs);

module.exports = router;
