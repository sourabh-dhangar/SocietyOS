const express = require('express');
const router = express.Router();

// Middleware
const { authenticate } = require('../../../middlewares/authMiddleware');
const { checkPermission } = require('../../../middlewares/rbacMiddleware');

// Controllers
const { generateBill, getSocietyBills, getMyBills, recordPayment } = require('../controllers/billingController');

// ─── Admin Bill Routes (RBAC Protected) ─────────────────────────
router.post('/bills', authenticate, checkPermission('finance', 'edit'), generateBill);
router.get('/bills', authenticate, checkPermission('finance', 'view'), getSocietyBills);

// ─── Resident Routes (Auth only, no RBAC) ───────────────────────
router.get('/my-bills', authenticate, getMyBills);
router.post('/pay', authenticate, recordPayment);

module.exports = router;
