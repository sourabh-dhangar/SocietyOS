const express = require('express');
const router = express.Router();

const { authenticate } = require('../../../middlewares/authMiddleware');
const { enforceSociety } = require('../../../middlewares/societyMiddleware');
const { getSocietyStats } = require('../controllers/dashboardController');

router.get('/society-stats', authenticate, enforceSociety, getSocietyStats);

module.exports = router;
