const express = require('express');
const router = express.Router();

// Middleware
const { authenticate } = require('../../../middlewares/authMiddleware');
const { enforceSociety } = require('../../../middlewares/societyMiddleware');

// Controllers
const { createSociety, getSocietyDetails, getAllSocieties, updateSociety, toggleSocietyStatus } = require('../controllers/societyController');
const { addFlat, addBulkFlats, getFlats } = require('../controllers/flatController');
const { addUser, addBulkUsers, getUsers } = require('../controllers/userController');
const { getAuditLogs } = require('../controllers/auditController');

// ─── Society Routes (Super Admin) ───────────────────────────────
router.post('/society', authenticate, createSociety);           // Create new society + admin
router.get('/societies', authenticate, getAllSocieties);         // Get ALL societies (super_admin)
router.put('/society/:id', authenticate, updateSociety);        // Update society details (super_admin)
router.patch('/society/:id/toggle-status', authenticate, toggleSocietyStatus); // Toggle active/inactive

// ─── Society-scoped Routes ──────────────────────────────────────
router.get('/society', authenticate, enforceSociety, getSocietyDetails); // Get logged-in user's society

// ─── Flat/Unit Routes ───────────────────────────────────────────
router.post('/flats', authenticate, enforceSociety, addFlat);
router.post('/flats/bulk', authenticate, enforceSociety, addBulkFlats);
router.get('/flats', authenticate, enforceSociety, getFlats);

// ─── User Management Routes ────────────────────────────────────
router.post('/users', authenticate, enforceSociety, addUser);
router.post('/users/bulk', authenticate, enforceSociety, addBulkUsers);
router.get('/users', authenticate, enforceSociety, getUsers);

// ─── Audit Logs ──────────────────────────────────────────────────
router.get('/audit-logs', authenticate, enforceSociety, getAuditLogs);

module.exports = router;
