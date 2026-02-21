const AuditLog = require('../modules/core/models/auditLogModel');

/**
 * Utility to log user actions across the platform
 * @param {Object} req - The Express request object containing req.user and req.ip
 * @param {String} moduleName - Core, Finance, Security, Operations, Facilities
 * @param {String} action - CREATE, UPDATE, DELETE, LOGIN, OTHER
 * @param {String} description - Human-readable description of the action
 * @param {Object} metadata - Optional JSON data (e.g. { visitorId: 123, status: 'approved' })
 */
const logAudit = async (req, moduleName, action, description, metadata = {}) => {
  try {
    if (!req.user || !req.user.societyId) {
      return; // Can't log if not authenticated via proper middleware
    }

    await AuditLog.create({
      societyId: req.user.societyId,
      userId: req.user.userId || req.user._id,
      module: moduleName,
      action: action,
      description: description,
      endpoint: req.originalUrl,
      ipAddress: req.ip,
      metadata: metadata,
    });
  } catch (error) {
    // We swallow errors here so that a failed audit log doesn't break the main transaction
    console.error('AuditLog Error:', error.message);
  }
};

module.exports = { logAudit };
