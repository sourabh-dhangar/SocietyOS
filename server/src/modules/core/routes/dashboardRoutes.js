const express = require('express');
const router = express.Router();

const { authenticate } = require('../../../middlewares/authMiddleware');
const { getSocietyStats } = require('../controllers/dashboardController');

router.get('/society-stats', authenticate, getSocietyStats);

module.exports = router;
