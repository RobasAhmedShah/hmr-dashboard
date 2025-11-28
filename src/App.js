import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ServiceWorkerListener } from './components/ServiceWorkerListener';

// Pages
import Home from './pages/user/Home';
import Properties from './pages/user/Properties';
import Login from './pages/user/Login';
import Register from './pages/user/Register';
import Portfolio from './pages/user/Portfolio';
import Profile from './pages/user/Profile';
import Wallet from './pages/user/Wallet';
import Notifications from './pages/user/Notifications';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminPropertyDetail from './pages/admin/PropertyDetail';
import PropertyDetail from './pages/PropertyDetail';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DeleteAccount from './pages/DeleteAccount';
import { AdminAuthProvider } from './components/admin/AdminAuth';

// Organization Pages
import OrgDashboard from './pages/organization/OrgDashboard';
import OrgLogin from './pages/organization/OrgLogin';
import OrgPropertyDetail from './pages/organization/OrgPropertyDetail';
import { OrganizationAuthProvider } from './components/organization/OrganizationAuth';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <Router>
            <ServiceWorkerListener />
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/properties/:id" element={<PropertyDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/delete-account" element={<DeleteAccount />} />
                
                {/* Admin Routes */}
                <Route path="/admin/login" element={
                  <AdminAuthProvider>
                    <AdminLogin />
                  </AdminAuthProvider>
                } />
                <Route path="/admin" element={
                  <AdminAuthProvider>
                    <AdminDashboard />
                  </AdminAuthProvider>
                } />
                <Route path="/admin/property/:propertyId" element={
                  <AdminAuthProvider>
                    <AdminPropertyDetail />
                  </AdminAuthProvider>
                } />
                
                {/* Organization Routes */}
                <Route path="/org/login" element={
                  <OrganizationAuthProvider>
                    <OrgLogin />
                  </OrganizationAuthProvider>
                } />
                <Route path="/orgdashboard" element={
                  <OrganizationAuthProvider>
                    <OrgDashboard />
                  </OrganizationAuthProvider>
                } />
                <Route path="/orgdashboard/property/:propertyId" element={
                  <OrganizationAuthProvider>
                    <OrgPropertyDetail />
                  </OrganizationAuthProvider>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
