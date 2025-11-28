import React, { createContext, useContext, useState, useEffect } from 'react';
import { organizationsAPI, orgAdminAPI, authAPI } from '../../services/api';
import { initializeWebPush } from '../../services/webPush';

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

      // Try the org-specific endpoint first, fallback to regular auth
      let authResponse;
      let loginData;
      
      try {
        // First, try the organization-specific login endpoint
        authResponse = await orgAdminAPI.orgAdminLogin({ email, password });
        loginData = authResponse.data || authResponse;
        console.log('✅ Org admin login API response:', loginData);
      } catch (orgError) {
        // If org endpoint doesn't exist (404), try regular auth endpoint
        if (orgError.response?.status === 404) {
          console.log('⚠️ Org login endpoint not found, trying regular auth endpoint...');
          authResponse = await authAPI.login({ email, password });
          loginData = authResponse.data || authResponse;
          console.log('✅ Regular auth login response:', loginData);
        } else {
          throw orgError;
        }
      }

      // Extract user/admin data from response
      const user = loginData.user || loginData.admin || loginData;
      const organizationId = loginData.organizationId || user?.organizationId || user?.organization_id;
      
      // Fetch organization details
      let orgDetails = loginData.organization;
      if (!orgDetails && organizationId) {
        try {
          console.log('🔄 Fetching organization details for:', organizationId);
          const orgResponse = await organizationsAPI.getById(organizationId);
          orgDetails = orgResponse.data?.organization || orgResponse.data || orgResponse;
          console.log('✅ Fetched organization details:', orgDetails);
        } catch (err) {
          console.warn('⚠️ Could not fetch organization details:', err);
          // Try to find organization by searching all orgs
          try {
            const allOrgsResponse = await organizationsAPI.getAll();
            const allOrgs = allOrgsResponse.data?.organizations || allOrgsResponse.data || [];
            orgDetails = allOrgs.find(org => 
              org.id === organizationId || 
              org._id === organizationId ||
              org.displayCode === organizationId ||
              org.display_code === organizationId
            );
            if (orgDetails) {
              console.log('✅ Found organization in list:', orgDetails);
            }
          } catch (searchErr) {
            console.warn('⚠️ Could not search organizations:', searchErr);
          }
        }
      }

      // If still no org details, try to find by email domain or use quick login mapping
      if (!orgDetails) {
        const quickLoginEntry = Object.values(ORGANIZATION_CREDENTIALS).find(
          cred => cred.email === email
        );
        if (quickLoginEntry) {
          // Try to find organization by name
          try {
            const allOrgsResponse = await organizationsAPI.getAll();
            const allOrgs = allOrgsResponse.data?.organizations || allOrgsResponse.data || [];
            orgDetails = allOrgs.find(org => 
              org.name?.toLowerCase().includes('hmr') || 
              org.name?.toLowerCase().includes('saima')
            );
          } catch (err) {
            console.warn('⚠️ Could not search for organization by name:', err);
          }
        }
      }

      // Check for quick login display name override
      const quickLoginEntry = Object.values(ORGANIZATION_CREDENTIALS).find(
        cred => cred.email === email
      );
      const displayName = quickLoginEntry?.displayName || orgDetails?.name || user?.organizationName || 'Organization';

      // Determine organization ID from various sources
      const finalOrgId = organizationId || 
                        orgDetails?.id || 
                        orgDetails?._id || 
                        orgDetails?.displayCode ||
                        orgDetails?.display_code ||
                        (quickLoginEntry && email.includes('hmr') ? '85a17682-5df8-4dd9-98fe-9a64fce0d115' : null);

      // Store auth data
      const userData = {
        email: user?.email || email,
        organizationName: displayName,
        backendOrganizationName: orgDetails?.name,
        organizationId: finalOrgId,
        displayCode: orgDetails?.displayCode || orgDetails?.display_code,
        organizationSlug: orgDetails?.slug,
        adminId: user?.id || user?._id || user?.adminId,
        adminFullName: user?.fullName || user?.full_name || user?.name,
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

      // Initialize web push notifications for organization admin
      try {
        if (userData?.adminId) {
          console.log('OrganizationAuth: Registering web push for org admin:', userData.adminId);
          await initializeWebPush(async (subscriptionData) => {
            // Register web push for organization admin
            await orgAdminAPI.registerWebPush(userData.adminId, subscriptionData);
          });
        }
      } catch (error) {
        console.error('OrganizationAuth: Failed to register web push for org admin:', error);
        // Don't block login if web push registration fails
      }

      return userData;
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      
      // Provide more detailed error message
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 403) {
          errorMessage = data?.message || 'Invalid email or password. Please check your credentials.';
        } else if (status === 404) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (data?.message) {
          errorMessage = data.message;
        } else {
          errorMessage = `Login failed (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      }
      
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

