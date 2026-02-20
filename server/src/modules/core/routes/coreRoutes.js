const express = require('express');
const router = express.Router();

// Middleware
const { authenticate } = require('../../../middlewares/authMiddleware');

// Controllers
const { createSociety, getSocietyDetails, getAllSocieties } = require('../controllers/societyController');
const { addFlat, getFlats } = require('../controllers/flatController');
const { addUser, getUsers } = require('../controllers/userController');

// ─── Society Routes ─────────────────────────────────────────────
router.post('/society', authenticate, createSociety);
router.get('/society', authenticate, getSocietyDetails);
router.get('/societies', authenticate, getAllSocieties);

// ─── Flat/Unit Routes ───────────────────────────────────────────
router.post('/flats', authenticate, addFlat);
router.get('/flats', authenticate, getFlats);

// ─── User Management Routes ────────────────────────────────────
router.post('/users', authenticate, addUser);
router.get('/users', authenticate, getUsers);

module.exports = router;
