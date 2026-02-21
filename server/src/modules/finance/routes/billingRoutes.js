const express = require('express');
const router = express.Router();

const { authenticate } = require('../../../middlewares/authMiddleware');
const { checkPermission } = require('../../../middlewares/rbacMiddleware');
const { enforceSociety } = require('../../../middlewares/societyMiddleware');
const { checkSocietyFeature } = require('../../../middlewares/featureToggle');

// Controllers
const {
  getBillingConfig,
  updateBillingConfig,
  generateBill,
  generateBulkBills,
  getSocietyBills,
  getMyBills,
  recordPayment,
  getFinancialStats,
} = require('../controllers/billingController');

// ─── Billing Config Routes ──────────────────────────────────────
router.get('/config', authenticate, enforceSociety, checkPermission('finance', 'view'), getBillingConfig);
router.put('/config', authenticate, enforceSociety, checkPermission('finance', 'edit'), updateBillingConfig);

// ─── Bill Generation Routes ─────────────────────────────────────
router.post('/bills', authenticate, enforceSociety, checkPermission('finance', 'edit'), generateBill);
router.post('/bills/bulk', authenticate, enforceSociety, checkPermission('finance', 'edit'), generateBulkBills);
router.get('/bills', authenticate, enforceSociety, checkPermission('finance', 'view'), getSocietyBills);

// ─── Financial Stats ────────────────────────────────────────────
router.get('/stats', authenticate, enforceSociety, checkPermission('finance', 'view'), getFinancialStats);

// ─── Resident Routes ────────────────────────────────────────────
router.get('/my-bills', authenticate, enforceSociety, getMyBills);
router.post('/pay', authenticate, enforceSociety, recordPayment);

module.exports = router;
