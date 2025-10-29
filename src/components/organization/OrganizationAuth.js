import React, { createContext, useContext, useState, useEffect } from 'react';
import { organizationsAPI, orgAdminAPI } from '../../services/api';

const OrganizationAuthContext = createContext(null);

// Quick login credentials (for convenience - actual auth goes through backend)
const ORGANIZATION_CREDENTIALS = {
  'hmr': {
    email: 'admin@hmr.com',
    password: 'hmr123',
    displayName: 'HMR Company',
  },
  'saima': {
    email: 'admin@saima.com',
    password: 'saima123',
    displayName: 'Saima Company',
  }
};

export const OrganizationAuthProvider = ({ children }) => {
  const [organizationUser, setOrganizationUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const orgSession = localStorage.getItem('orgSession');
    const orgUserData = localStorage.getItem('orgUser');
    
    if (orgSession === 'true' && orgUserData) {
      try {
        const userData = JSON.parse(orgUserData);
        setOrganizationUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing organization user data:', error);
        localStorage.removeItem('orgSession');
        localStorage.removeItem('orgUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Organization Admin Login:', { email });

      // Use new org admin login API
      const response = await orgAdminAPI.orgAdminLogin({ email, password });
      
      console.log('✅ Login API response:', response);

      const loginData = response.data || response;
      const { organizationId, admin, organization } = loginData;

      // If organization details not included in login response, fetch them
      let orgDetails = organization;
      if (!orgDetails && organizationId) {
        try {
          const orgResponse = await organizationsAPI.getById(organizationId);
          orgDetails = orgResponse.data?.organization || orgResponse.data;
          console.log('✅ Fetched organization details:', orgDetails);
        } catch (err) {
          console.warn('⚠️ Could not fetch organization details:', err);
        }
      }

      // Check for quick login display name override
      const quickLoginEntry = Object.values(ORGANIZATION_CREDENTIALS).find(
        cred => cred.email === email
      );
      const displayName = quickLoginEntry?.displayName || orgDetails?.name || admin?.organizationName || 'Organization';

      // Store auth data
      const userData = {
        email: admin?.email || email,
        organizationName: displayName,
        backendOrganizationName: orgDetails?.name,
        organizationId: orgDetails?.id || orgDetails?._id || organizationId,
        displayCode: orgDetails?.displayCode || orgDetails?.display_code,
        organizationSlug: orgDetails?.slug,
        adminId: admin?.id || admin?._id,
        adminFullName: admin?.fullName || admin?.full_name,
        role: 'organization_admin',
        loginTime: new Date().toISOString(),
        organizationData: orgDetails
      };

      console.log('✅ Organization login successful!');
      console.log('📌 Organization ID:', userData.organizationId);
      console.log('📌 Display Name:', userData.organizationName);
      console.log('📌 Backend Name:', userData.backendOrganizationName);
      console.log('📌 Admin ID:', userData.adminId);
      console.log('📌 Full user data:', userData);

      setOrganizationUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('orgSession', 'true');
      localStorage.setItem('orgUser', JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setOrganizationUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('orgSession');
    localStorage.removeItem('orgUser');
  };

  return (
    <OrganizationAuthContext.Provider 
      value={{ 
        organizationUser, 
        isAuthenticated, 
        loading, 
        login, 
        logout,
        // Convenience accessors
        organizationId: organizationUser?.organizationId,
        organizationName: organizationUser?.organizationName,
        displayCode: organizationUser?.displayCode,
        adminId: organizationUser?.adminId,
        adminEmail: organizationUser?.email,
        adminFullName: organizationUser?.adminFullName
      }}
    >
      {children}
    </OrganizationAuthContext.Provider>
  );
};

export const useOrganizationAuth = () => {
  const context = useContext(OrganizationAuthContext);
  if (!context) {
    throw new Error('useOrganizationAuth must be used within OrganizationAuthProvider');
  }
  return context;
};

