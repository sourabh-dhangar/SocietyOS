/**
 * Society Enforcement Middleware
 *
 * Ensures that all society-scoped requests include a valid societyId.
 * Prevents cross-society data access by blocking requests without societyId.
 *
 * Usage in routes:
 *   router.get('/bills', authenticate, enforceSociety, checkPermission('finance', 'view'), controller)
 *
 * Super Admin bypass: super_admin can access without societyId (platform-wide access).
 */
const enforceSociety = (req, res, next) => {
  try {
    const { userType, societyId } = req.user;

    // Super Admin operates at platform level — no society restriction
    if (userType === 'super_admin') {
      return next();
    }

    // All other users MUST have a societyId
    if (!societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. No society linked to your account.',
        data: null,
      });
    }

    next();
  } catch (error) {
    console.error('SocietyId Middleware Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during society validation',
      data: null,
    });
  }
};

module.exports = { enforceSociety };
