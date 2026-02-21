const Gallery = require('../models/galleryModel');
const { logAudit } = require('../../../utils/auditLogger');

/**
 * @desc    Create a new photo album
 * @route   POST /api/facilities/gallery
 * @access  Private — facilities.edit
 */
const createAlbum = async (req, res) => {
  try {
    const { albumName, description, eventDate, isPublic } = req.body;

    if (!albumName) {
      return res.status(400).json({ success: false, message: 'Album name is required', data: null });
    }

    const album = await Gallery.create({
      societyId: req.user.societyId,
      albumName,
      description: description || '',
      eventDate: eventDate || new Date(),
      isPublic: isPublic !== undefined ? isPublic : true,
      createdBy: req.user.userId,
    });

    await logAudit(req, 'Facilities', 'CREATE', `Created gallery album: ${albumName}`);

    return res.status(201).json({
      success: true,
      message: 'Album created successfully',
      data: album,
    });
  } catch (error) {
    console.error('CreateAlbum Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Get all society albums (Residents see public only, Admins see all)
 * @route   GET /api/facilities/gallery
 * @access  Private — Auth
 */
const getAlbums = async (req, res) => {
  try {
    const filter = { societyId: req.user.societyId };
    
    // Residents only see public albums
    if (req.user.userType === 'resident') {
      filter.isPublic = true;
    }

    const albums = await Gallery.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('photos.uploadedBy', 'firstName lastName')
      .sort({ eventDate: -1 });

    return res.status(200).json({
      success: true,
      message: 'Albums fetched successfully',
      data: albums,
    });
  } catch (error) {
    console.error('GetAlbums Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Add photos to an album
 * @route   PUT /api/facilities/gallery/:id/photos
 * @access  Private — facilities.edit
 */
const addPhotosToAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body; // Array of { url, caption }

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ success: false, message: 'Photos array is required', data: null });
    }

    const album = await Gallery.findOne({ _id: id, societyId: req.user.societyId });

    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found', data: null });
    }

    // Append new photos
    const newPhotos = photos.map(p => ({
      url: p.url,
      caption: p.caption || '',
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
    }));

    album.photos.push(...newPhotos);
    await album.save();

    await logAudit(req, 'Facilities', 'UPDATE', `Added ${newPhotos.length} photos to album: ${album.albumName}`);

    return res.status(200).json({
      success: true,
      message: `${newPhotos.length} photos added successfully`,
      data: album,
    });
  } catch (error) {
    console.error('AddPhotosToAlbum Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

/**
 * @desc    Delete an album
 * @route   DELETE /api/facilities/gallery/:id
 * @access  Private — facilities.delete
 */
const deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    
    const album = await Gallery.findOneAndDelete({ _id: id, societyId: req.user.societyId });

    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found', data: null });
    }

    await logAudit(req, 'Facilities', 'DELETE', `Deleted gallery album: ${album.albumName}`);

    return res.status(200).json({
      success: true,
      message: 'Album deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('DeleteAlbum Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

module.exports = {
  createAlbum,
  getAlbums,
  addPhotosToAlbum,
  deleteAlbum,
};
