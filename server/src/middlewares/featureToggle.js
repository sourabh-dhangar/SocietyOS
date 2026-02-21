const Society = require('../modules/core/models/societyModel');

/**
 * Middleware to check if a specific module is enabled for the society
 * @param {string} moduleName - Core module name (e.g., 'finance', 'security', 'operations', 'facilities')
 */
const checkSocietyFeature = (moduleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.societyId) {
        return res.status(401).json({ success: false, message: 'Unauthorized access', data: null });
      }

      // Bypass for super_admin who manages everything
      if (req.user.userType === 'super_admin') {
        return next();
      }

      const society = await Society.findById(req.user.societyId);
      
      if (!society) {
        return res.status(404).json({ success: false, message: 'Society not found', data: null });
      }

      // Default features to true if they are explicitly undefined (backward compatibility)
      // We must check if features exists directly or via get() since it's a Mongoose doc
      const feats = society.features || {};
      const isFeatureEnabled = feats[moduleName] !== false;

      if (!isFeatureEnabled) {
        return res.status(403).json({
          success: false,
          message: "Your society's subscription does not include this feature.",
          data: null
        });
      }

      next();
    } catch (error) {
      console.error('FeatureToggle Middleware Error:', error.message);
      return res.status(500).json({ success: false, message: 'Server error in feature check', data: null });
    }
  };
};

module.exports = { checkSocietyFeature };
