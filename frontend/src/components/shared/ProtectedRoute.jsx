import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from 'react-bootstrap';

/**
 * ProtectedRoute — restricts access by userType
 * @param {string} requiredRole - e.g. 'super_admin', 'society_admin'
 * @param {ReactNode} children - wrapped page component
 */
const ProtectedRoute = ({ requiredRole, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: '#6C63FF' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.userType !== requiredRole) {
    return (
      <div className="text-center mt-5">
        <h3 className="text-danger">🚫 Access Denied</h3>
        <p className="text-muted">You don't have permission to view this page.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
