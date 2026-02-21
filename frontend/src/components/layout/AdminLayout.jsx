import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar, Dropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        {/* Top Navbar */}
        <Navbar className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between flex-shrink-0">
          <div>
            <Navbar.Brand className="fw-bold text-dark mb-0" style={{ fontSize: '16px' }}>
              🏠 {user?.userType === 'super_admin' ? 'Platform Admin' : 'Society Panel'}
            </Navbar.Brand>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Badge bg="success" className="px-2 py-1">🟢 Online</Badge>
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                size="sm"
                className="border-0 d-flex align-items-center gap-2"
              >
                {user?.firstName || 'User'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item disabled>
                  <small className="text-muted">{user?.email}</small>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  🚪 Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Navbar>

        {/* Page Content */}
        <div className="p-4 flex-grow-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
