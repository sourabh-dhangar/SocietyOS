const express = require('express');
const router = express.Router();

// Middleware
const { authenticate } = require('../../../middlewares/authMiddleware');
const { checkPermission } = require('../../../middlewares/rbacMiddleware');
const { enforceSociety } = require('../../../middlewares/societyMiddleware');
const { checkSocietyFeature } = require('../../../middlewares/featureToggle');

// Controllers
const { 
  updateInventory, 
  getLowStockItems, 
  uploadDocument, 
  getPublicDocuments, 
  getNocRequests, 
  requestNoc, 
  updateNocStatus,
  saveAmenity,
  getAmenities,
  bookAmenity,
  getBookings,
  updateBookingStatus
} = require('../controllers/facilityController');

const {
  createAlbum,
  getAlbums,
  addPhotosToAlbum,
  deleteAlbum
} = require('../controllers/galleryController');

// ─── Inventory Routes ───────────────────────────────────────────
router.put('/inventory', authenticate, enforceSociety, checkSocietyFeature('facilities'), checkPermission('admin_assets', 'edit'), updateInventory);
router.get('/inventory/low-stock', authenticate, enforceSociety, checkSocietyFeature('facilities'), checkPermission('admin_assets', 'view'), getLowStockItems);

// ─── Document / Gallery Routes ──────────────────────────────────
router.post('/documents', authenticate, enforceSociety, checkSocietyFeature('facilities'), checkPermission('admin_assets', 'edit'), uploadDocument);
router.get('/documents', authenticate, enforceSociety, checkSocietyFeature('facilities'), getPublicDocuments);

// ─── NOC (Secondary Sale/Rent) Routes ───────────────────────────
router.get('/noc', authenticate, enforceSociety, checkSocietyFeature('facilities'), getNocRequests);
router.post('/noc', authenticate, enforceSociety, checkSocietyFeature('facilities'), requestNoc);
router.put('/noc/:id', authenticate, enforceSociety, checkSocietyFeature('facilities'), checkPermission('admin_assets', 'edit'), updateNocStatus);

// ─── AMENITIES & BOOKINGS ───────────────────────────────────────
router.get('/amenities', authenticate, enforceSociety, checkSocietyFeature('facilities'), getAmenities);
router.post('/amenities', authenticate, enforceSociety, checkSocietyFeature('facilities'), checkPermission('admin_assets', 'edit'), saveAmenity);

router.get('/bookings', authenticate, enforceSociety, checkSocietyFeature('facilities'), getBookings);
router.post('/bookings', authenticate, enforceSociety, checkSocietyFeature('facilities'), bookAmenity);
router.put('/bookings/:id', authenticate, enforceSociety, checkSocietyFeature('facilities'), checkPermission('admin_assets', 'edit'), updateBookingStatus);

// ─── COMMUNITY GALLERY ──────────────────────────────────────────
router.get('/gallery', authenticate, enforceSociety, checkSocietyFeature('facilities'), getAlbums);
router.post('/gallery', authenticate, enforceSociety, checkSocietyFeature('facilities'), checkPermission('admin_assets', 'edit'), createAlbum);
router.put('/gallery/:id/photos', authenticate, enforceSociety, checkSocietyFeature('facilities'), checkPermission('admin_assets', 'edit'), addPhotosToAlbum);
router.delete('/gallery/:id', authenticate, enforceSociety, checkSocietyFeature('facilities'), checkPermission('admin_assets', 'delete'), deleteAlbum);

module.exports = router;
