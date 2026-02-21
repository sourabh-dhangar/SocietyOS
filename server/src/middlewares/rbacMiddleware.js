/**
 * RBAC Middleware — Dynamic Permission Checker
 *
 * Factory function: checkPermission(moduleName, action)
 * Usage: router.get('/bills', authenticate, checkPermission('finance', 'view'), controller)
 *
 * - Super Admins bypass all permission checks.
 * - Society Admins bypass by default (full access), but can be restricted
 *   in future by removing this bypass.
 * - For all other users, checks req.user.permissions[moduleName][action].
 * - 'edit' permission implies 'view' access.
 */
const checkPermission = (moduleName, action) => {
  return (req, res, next) => {
    const { userType, permissions } = req.user;

    // Super Admin has platform-wide access — always bypass
    if (userType === 'super_admin') {
      return next();
    }

    // Society Admin has full society access — bypass
    // (Future: remove this to enforce granular permissions for admins too)
    if (userType === 'society_admin') {
      return next();
    }

    // Check if the module exists in user permissions
    if (!permissions || !permissions[moduleName]) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You do not have access to the '${moduleName}' module.`,
        data: null,
      });
    }

    // 'edit' implies 'view' — so if action is 'view', accept either
    if (action === 'view' && (permissions[moduleName].view || permissions[moduleName].edit)) {
      return next();
    }

    // Check the specific action (edit)
    if (permissions[moduleName][action]) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied: You need '${action}' permission for '${moduleName}'.`,
      data: null,
    });
  };
};

module.exports = { checkPermission };
