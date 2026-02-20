import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import SocietyAdminDashboard from './pages/dashboard/SocietyAdminDashboard';
import ManageSocieties from './pages/super-admin/ManageSocieties';
import ManageFlats from './pages/society-admin/ManageFlats';
import ManageResidents from './pages/society-admin/ManageResidents';
import ManageBills from './pages/society-admin/ManageBills';
import ResidentDashboard from './pages/resident/ResidentDashboard';
import MyBills from './pages/resident/MyBills';
import GateDashboard from './pages/guard/GateDashboard';
import NoticeBoard from './pages/operations/NoticeBoard';
import Helpdesk from './pages/operations/Helpdesk';
import Inventory from './pages/facilities/Inventory';
import DocumentCenter from './pages/facilities/DocumentCenter';
import NocRequests from './pages/facilities/NocRequests';
import 'bootstrap/dist/css/bootstrap.min.css';

// Auto-switch dashboard based on userType
const DashboardSwitch = () => {
  const { user } = useAuth();
  if (user?.userType === 'super_admin') return <SuperAdminDashboard />;
  if (user?.userType === 'resident') return <ResidentDashboard />;
  if (user?.userType === 'security_guard') return <GateDashboard />;
  return <SocietyAdminDashboard />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — wrapped in AdminLayout */}
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardSwitch />} />

            {/* Super Admin */}
            <Route
              path="/societies"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <ManageSocieties />
                </ProtectedRoute>
              }
            />

            {/* Society Admin */}
            <Route path="/society/flats" element={<ManageFlats />} />
            <Route path="/society/residents" element={<ManageResidents />} />
            <Route path="/society/bills" element={<ManageBills />} />

            {/* Resident */}
            <Route path="/resident/dashboard" element={<ResidentDashboard />} />
            <Route path="/resident/bills" element={<MyBills />} />

            {/* Security Guard */}
            <Route path="/guard/dashboard" element={<GateDashboard />} />

            {/* Operations (shared) */}
            <Route path="/operations/notices" element={<NoticeBoard />} />
            <Route path="/operations/helpdesk" element={<Helpdesk />} />

            {/* Facilities */}
            <Route path="/facilities/inventory" element={<Inventory />} />
            <Route path="/facilities/documents" element={<DocumentCenter />} />
            <Route path="/facilities/noc" element={<NocRequests />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
