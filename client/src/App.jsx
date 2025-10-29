import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { getCurrentUser } from './store/slices/authSlice';
import socketService from './services/socket';
import { isOnSubdomain, getOrgSlugFromSubdomain } from './utils/subdomain';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Appointments from './pages/Appointments';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Services from './pages/Services';
import Users from './pages/Users';
import PhoneNumbers from './pages/PhoneNumbers';
import Settings from './pages/Settings';

// Public Pages
import PublicBooking from './pages/PublicBooking';
import LandingPage from './pages/LandingPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth);

  useEffect(() => {
    // Get current user if authenticated
    if (isAuthenticated && accessToken) {
      dispatch(getCurrentUser());
      // Connect socket
      socketService.connect(accessToken);
    }

    // Cleanup on unmount
    return () => {
      if (!isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, accessToken, dispatch]);

  // Check if we're on a subdomain (organization's public page)
  const onSubdomain = isOnSubdomain();
  const orgSlug = getOrgSlugFromSubdomain();

  // Subdomain routes (public booking pages)
  if (onSubdomain && orgSlug) {
    return (
      <Routes>
        {/* Public booking page at root of subdomain */}
        <Route path="/" element={<PublicBooking orgSlug={orgSlug} />} />

        {/* Login for organization members */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes for organization staff */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="messages" element={<Messages />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetails />} />
          <Route path="services" element={<Services />} />
          <Route path="users" element={<Users />} />
          <Route path="numbers" element={<PhoneNumbers />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 - redirect to public booking */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Main domain routes (registration, login, admin access)
  return (
    <Routes>
      {/* Public Routes on main domain */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/book/:orgSlug" element={<PublicBooking />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="messages" element={<Messages />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="services" element={<Services />} />
        <Route path="users" element={<Users />} />
        <Route path="numbers" element={<PhoneNumbers />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}

export default App;
