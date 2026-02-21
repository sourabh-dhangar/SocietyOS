/**
 * Default permissions based on userType.
 * Shared across seedAdmin, societyController, and userController.
 */
const getDefaultPermissions = (userType) => {
  switch (userType) {
    case 'super_admin':
    case 'society_admin':
      return {
        finance: { view: true, edit: true },
        security: { view: true, edit: true },
        notices: { view: true, edit: true },
        operations: { view: true, edit: true },
        governance: { view: true, edit: true },
        staffManagement: { view: true, edit: true },
        admin_assets: { view: true, edit: true },
      };
    case 'resident':
      return {
        finance: { view: true, edit: false },
        security: { view: true, edit: false },
        notices: { view: true, edit: false },
        operations: { view: false, edit: false },
        governance: { view: true, edit: false },
        staffManagement: { view: false, edit: false },
        admin_assets: { view: false, edit: false },
      };
    case 'staff':
      return {
        finance: { view: false, edit: false },
        security: { view: true, edit: false },
        notices: { view: true, edit: false },
        operations: { view: true, edit: false },
        governance: { view: false, edit: false },
        staffManagement: { view: false, edit: false },
        admin_assets: { view: false, edit: false },
      };
    case 'security_guard':
      return {
        finance: { view: false, edit: false },
        security: { view: true, edit: true },
        notices: { view: true, edit: false },
        operations: { view: false, edit: false },
        governance: { view: false, edit: false },
        staffManagement: { view: false, edit: false },
        admin_assets: { view: false, edit: false },
      };
    default:
      return {
        finance: { view: false, edit: false },
        security: { view: false, edit: false },
        notices: { view: false, edit: false },
        operations: { view: false, edit: false },
        governance: { view: false, edit: false },
        staffManagement: { view: false, edit: false },
        admin_assets: { view: false, edit: false },
      };
  }
};

module.exports = getDefaultPermissions;
