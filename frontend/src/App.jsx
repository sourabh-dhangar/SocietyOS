import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Dashboards
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import SocietyAdminDashboard from './pages/dashboard/SocietyAdminDashboard';
import ResidentDashboard from './pages/resident/ResidentDashboard';
import GateDashboard from './pages/guard/GateDashboard';
import StaffManagement from './pages/guard/StaffManagement';

// Super Admin Pages
import ManageSocieties from './pages/super-admin/ManageSocieties';

// Society Admin Pages
import ManageFlats from './pages/society-admin/ManageFlats';
import ManageResidents from './pages/society-admin/ManageResidents';
import SocietyAdminManageBills from './pages/society-admin/ManageBills'; // Renamed to avoid conflict
import BillingSettings from './pages/society-admin/BillingSettings';
import OnboardingWizard from './pages/society-admin/OnboardingWizard';

// Resident Pages
import ResidentMyBills from './pages/resident/MyBills';
import MyVisitors from './pages/resident/MyVisitors';

// Finance Pages
import FinancialAnalytics from './pages/finance/FinancialAnalytics';

// Shared / Operations Pages
import NoticeBoard from './pages/operations/NoticeBoard';
import Helpdesk from './pages/operations/Helpdesk';
import EmergencyContacts from './pages/operations/EmergencyContacts';
import AssetLogs from './pages/operations/AssetLogs';
import AuditLogs from './pages/operations/AuditLogs';

// Facilities Pages
import Inventory from './pages/facilities/Inventory';
import DocumentCenter from './pages/facilities/DocumentCenter';
import NocRequests from './pages/facilities/NocRequests';
import ParkingManagement from './pages/facilities/ParkingManagement';
import Amenities from './pages/facilities/Amenities';
import CommunityGallery from './pages/facilities/CommunityGallery';

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
          {/* ─── Public ───────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ─── Protected — wrapped in AdminLayout ───────────── */}
          <Route element={<AdminLayout />}>

            {/* Dashboard — auto-switches by role */}
            <Route path="/dashboard" element={<DashboardSwitch />} />

            {/* ─── Super Admin Routes ────────────────────────── */}
            <Route
              path="/societies"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <ManageSocieties />
                </ProtectedRoute>
              }
            />

            {/* ─── Society Admin Routes ──────────────────────── */}
            <Route
              path="/society/flats"
              element={
                <ProtectedRoute requiredRole="society_admin">
                  <ManageFlats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/society/residents"
              element={
                <ProtectedRoute requiredRole="society_admin">
                  <ManageResidents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/society/billing-settings"
              element={
                <ProtectedRoute requiredRole="society_admin">
                  <BillingSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/society/setup"
              element={
                <ProtectedRoute requiredRole="society_admin">
                  <OnboardingWizard />
                </ProtectedRoute>
              }
            />

            {/* ─── Finance Routes ────────────────────────────── */}
            <Route
              path="/society/bills"
              element={
                <ProtectedRoute requiredRole={['society_admin']}>
                  <SocietyAdminManageBills />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resident/my-bills"
              element={
                <ProtectedRoute requiredRole={['resident']}>
                  <ResidentMyBills />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/analytics"
              element={
                <ProtectedRoute requiredRole={['super_admin', 'society_admin']}>
                  <FinancialAnalytics />
                </ProtectedRoute>
              }
            />

            {/* ─── Resident Routes ───────────────────────────── */}
            <Route
              path="/resident/dashboard"
              element={
                <ProtectedRoute requiredRole="resident">
                  <ResidentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resident/visitors"
              element={
                <ProtectedRoute requiredRole="resident">
                  <MyVisitors />
                </ProtectedRoute>
              }
            />

            {/* ─── Security Guard Routes ─────────────────────── */}
            <Route
              path="/guard/dashboard"
              element={
                <ProtectedRoute requiredRole={['security_guard', 'society_admin']}>
                  <GateDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guard/staff"
              element={
                <ProtectedRoute requiredRole={['security_guard', 'society_admin']}>
                  <StaffManagement />
                </ProtectedRoute>
              }
            />

            {/* ─── Shared / Operations Routes ────────────────── */}
            <Route
              path="/operations/notices"
              element={
                <ProtectedRoute requiredRole={['society_admin', 'resident', 'staff']}>
                  <NoticeBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations/helpdesk"
              element={
                <ProtectedRoute requiredRole={['society_admin', 'resident']}>
                  <Helpdesk />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations/emergency-contacts"
              element={
                <ProtectedRoute requiredRole={['society_admin', 'resident', 'security_guard']}>
                  <EmergencyContacts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations/asset-logs"
              element={
                <ProtectedRoute requiredRole={['society_admin']}>
                  <AssetLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations/audit-logs"
              element={
                <ProtectedRoute requiredRole={['super_admin', 'society_admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            {/* ─── Facilities Routes ─────────────────────────── */}
            <Route
              path="/facilities/inventory"
              element={
                <ProtectedRoute requiredRole="society_admin">
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facilities/documents"
              element={
                <ProtectedRoute requiredRole="society_admin">
                  <DocumentCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facilities/noc"
              element={
                <ProtectedRoute requiredRole={['society_admin', 'resident']}>
                  <NocRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facilities/parking"
              element={
                <ProtectedRoute requiredRole={['society_admin', 'resident']}>
                  <ParkingManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facilities/amenities"
              element={
                <ProtectedRoute requiredRole={['super_admin', 'society_admin', 'resident']}>
                  <Amenities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facilities/gallery"
              element={
                <ProtectedRoute requiredRole={['super_admin', 'society_admin', 'resident']}>
                  <CommunityGallery />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* ─── Catch-all ────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
