/**
 * RBAC Middleware — Dynamic Permission Checker
 *
 * Factory function: checkPermission(moduleName, action)
 * Usage: router.get('/finance', authenticate, checkPermission('finance', 'view'), controller)
 *
 * - Super Admins & Society Admins bypass all permission checks.
 * - For all other users, checks req.user.permissions[moduleName][action].
 */
const checkPermission = (moduleName, action) => {
  return (req, res, next) => {
    const { userType, permissions } = req.user;

    // Super Admin and Society Admin have full access — bypass permission check
    if (userType === 'super_admin' || userType === 'society_admin') {
      return next();
    }

    // Check if the module exists in user permissions
    if (!permissions || !permissions[moduleName]) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You do not have access to the '${moduleName}' module.`,
      });
    }

    // Check the specific action (view/edit)
    if (!permissions[moduleName][action]) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You do not have '${action}' permission for '${moduleName}'.`,
      });
    }

    next();
  };
};

module.exports = { checkPermission };
