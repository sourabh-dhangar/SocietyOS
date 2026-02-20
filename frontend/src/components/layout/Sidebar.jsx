import { NavLink } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  const getLinksByRole = () => {
    switch (user?.userType) {
      case 'super_admin':
        return [
          { to: '/dashboard', label: '📊 Dashboard' },
          { to: '/societies', label: '🏢 Manage Societies' },
        ];
      case 'society_admin':
        return [
          { to: '/dashboard', label: '📊 Society Overview' },
          { to: '/society/flats', label: '🏠 Manage Flats' },
          { to: '/society/residents', label: '👥 Residents' },
          { to: '/society/bills', label: '💰 Billing' },
          { to: '/guard/dashboard', label: '🚪 Gate Logs' },
          { to: '/operations/notices', label: '📢 Notices' },
          { to: '/operations/helpdesk', label: '🔧 Helpdesk' },
          { to: '/facilities/inventory', label: '📦 Inventory' },
          { to: '/facilities/documents', label: '📄 Documents' },
        ];
      case 'resident':
        return [
          { to: '/dashboard', label: '🏠 My Home' },
          { to: '/resident/bills', label: '💳 Pay Dues' },
          { to: '/operations/notices', label: '📢 Notices' },
          { to: '/operations/helpdesk', label: '🔧 Complaints' },
        ];
      case 'security_guard':
        return [
          { to: '/dashboard', label: '📊 Dashboard' },
          { to: '/guard/dashboard', label: '🚪 Gate Logs' },
        ];
      default:
        return [
          { to: '/dashboard', label: '📊 Dashboard' },
        ];
    }
  };

  const links = getLinksByRole();

  return (
    <div
      className="d-flex flex-column flex-shrink-0"
      style={{
        width: '260px',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div className="p-3 pb-2 border-bottom border-secondary">
        <h4 className="fw-bold mb-0" style={{ color: '#A78BFA' }}>
          ✦ Nakshatra
        </h4>
        <small className="text-white-50">Society Management</small>
      </div>

      {/* Navigation Links */}
      <Nav className="flex-column gap-1 p-3 flex-grow-1">
        {links.map((link) => (
          <Nav.Item key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `d-block text-decoration-none rounded-3 px-3 py-2 ${
                  isActive ? 'text-white fw-semibold' : 'text-white-50'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                transition: 'all 0.2s ease',
              })}
            >
              {link.label}
            </NavLink>
          </Nav.Item>
        ))}
      </Nav>

      {/* User info at bottom */}
      <div className="p-3 border-top border-secondary">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white"
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: '#A78BFA',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="flex-grow-1">
            <div className="text-white" style={{ fontSize: '13px', lineHeight: '1.2' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <small className="text-white-50" style={{ fontSize: '11px' }}>
              {user?.userType?.replace(/_/g, ' ').toUpperCase()}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
