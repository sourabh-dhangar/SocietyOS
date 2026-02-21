const express = require('express');
const router = express.Router();

// Middleware
const { authenticate } = require('../../../middlewares/authMiddleware');
const { checkPermission } = require('../../../middlewares/rbacMiddleware');
const { enforceSociety } = require('../../../middlewares/societyMiddleware');
const { checkSocietyFeature } = require('../../../middlewares/featureToggle');

// Controllers
const { 
  createVisitorEntry, 
  updateVisitorStatus, 
  getActiveVisitors, 
  recordStaffMovement,
  getAllStaff,
  preApproveVisitor,
  verifyPasscode
} = require('../controllers/gateController');
const { addEmergencyContact, getEmergencyContacts, deleteEmergencyContact } = require('../controllers/emergencyController');
const { addParkingSlot, getParkingSlots, updateParkingSlot, deleteParkingSlot } = require('../controllers/parkingController');

// ─── Visitor Routes ─────────────────────────────────────────────
router.post('/visitors/pre-approve', authenticate, enforceSociety, checkSocietyFeature('security'), preApproveVisitor);
router.post('/visitors/verify-passcode', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'edit'), verifyPasscode);
router.post('/visitors', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'edit'), createVisitorEntry);
router.get('/visitors/active', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'view'), getActiveVisitors);
router.put('/visitors/:id', authenticate, enforceSociety, checkSocietyFeature('security'), updateVisitorStatus);

// ─── Staff Movement Routes ─────────────────────────────────────
router.get('/staff', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'view'), getAllStaff);
router.post('/staff/movement', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'edit'), recordStaffMovement);

// ─── Emergency Contacts Routes ─────────────────────────────────
router.post('/emergency-contacts', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'edit'), addEmergencyContact);
router.get('/emergency-contacts', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'view'), getEmergencyContacts);
router.delete('/emergency-contacts/:id', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'edit'), deleteEmergencyContact);

// ─── Parking Routes ───────────────────────────────────────────
router.post('/parking', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'edit'), addParkingSlot);
router.get('/parking', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'view'), getParkingSlots);
router.put('/parking/:id', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'edit'), updateParkingSlot);
router.delete('/parking/:id', authenticate, enforceSociety, checkSocietyFeature('security'), checkPermission('security', 'edit'), deleteParkingSlot);

module.exports = router;
