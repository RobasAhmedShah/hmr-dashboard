import React, { createContext, useContext, useState, useEffect } from 'react';
import { organizationsAPI } from '../../services/api';

const OrganizationAuthContext = createContext(null);

// Organization credentials (will fetch actual IDs from backend)
const ORGANIZATION_CREDENTIALS = {
  'hmr': {
    email: 'admin@hmr.com',
    password: 'hmr123',
    organizationName: 'HMR Company', // Display name override
    organizationSlug: 'hmr',
    displayNameOverride: true, // Use this name instead of backend name
    backendOrgId: 'ORG-000001', // Explicit ID from backend
    backendOrgName: 'HMR Builders', // Expected backend name
  },
  'saima': {
    email: 'admin@saima.com',
    password: 'saima123',
    organizationName: 'Saima Company', // Display name override
    organizationSlug: 'saima',
    displayNameOverride: true, // Use this name instead of backend name
    backendOrgId: 'ORG-000008', // Explicit ID from backend (Saima)
    backendOrgName: 'Saima', // Expected backend name
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
    // Find matching organization credentials
    const orgEntry = Object.entries(ORGANIZATION_CREDENTIALS).find(
      ([key, org]) => org.email === email && org.password === password
    );

    if (!orgEntry) {
      throw new Error('Invalid credentials');
    }

    const [orgKey, orgData] = orgEntry;

    try {
      // Fetch all organizations from backend
      const response = await organizationsAPI.getAll();
      const organizations = response.data?.data?.organizations || response.data?.organizations || response.data || [];
      
      console.log('📋 Fetched organizations from backend:', organizations);
      console.log('🔍 Looking for organization:', {
        displayName: orgData.organizationName,
        backendOrgId: orgData.backendOrgId,
        backendOrgName: orgData.backendOrgName
      });

      // PRIORITY MATCHING: Try explicit ID first, then name matching
      let matchedOrg = null;
      
      // STEP 1: Try exact ID match first (MOST RELIABLE) ⭐
      if (orgData.backendOrgId) {
        matchedOrg = organizations.find(org => {
          const orgId = (org.id || org._id || org.organizationId || org.displayCode || '').toUpperCase().trim();
          const targetId = orgData.backendOrgId.toUpperCase().trim();
          console.log('🔍 ID Check:', { orgId, targetId, matches: orgId === targetId });
          return orgId === targetId;
        });
        
        if (matchedOrg) {
          console.log('✅ MATCHED by EXPLICIT ID:', orgData.backendOrgId, matchedOrg);
        }
      }
      
      // STEP 2: Fallback to name matching (if no explicit ID or ID not found)
      if (!matchedOrg) {
        console.log('⚠️ No ID match, trying name matching...');
        matchedOrg = organizations.find(org => {
          const orgName = (org.name || '').toLowerCase().trim();
          const orgSlug = (org.slug || '').toLowerCase().trim();
          const searchName = (orgData.backendOrgName || orgData.organizationName).toLowerCase().trim();
          const searchSlug = orgData.organizationSlug.toLowerCase().trim();
          
          console.log('🔍 Name Check:', {
            backendOrg: { name: orgName, slug: orgSlug },
            searching: { name: searchName, slug: searchSlug }
          });
          
          // Match by exact name or slug first
          if (orgName === searchName || orgSlug === searchSlug) {
            return true;
          }
          
          // Fallback to contains matching
          return orgName.includes(searchName) || searchName.includes(orgName);
        });
        
        if (matchedOrg) {
          console.log('✅ MATCHED by NAME:', matchedOrg);
        }
      }

      if (!matchedOrg) {
        console.warn('⚠️ Organization not found in backend!');
        console.warn('Available organizations:', organizations.map(o => ({ 
          name: o.name, 
          slug: o.slug, 
          id: o.id || o._id 
        })));
      }

      // Use the actual ID from backend (like ORG-000014, ORG-000001)
      const organizationId = matchedOrg?.id || matchedOrg?._id || matchedOrg?.organizationId || `${orgData.organizationSlug}-company`;

      // Use display name override if specified, otherwise use backend name
      const displayName = orgData.displayNameOverride 
        ? orgData.organizationName 
        : (matchedOrg?.name || orgData.organizationName);

      const userData = {
        email: orgData.email,
        organizationName: displayName, // Use display name (overridden or from backend)
        backendOrganizationName: matchedOrg?.name, // Store backend name separately
        organizationId: organizationId, // This will be ORG-000014 or ORG-000001
        organizationSlug: matchedOrg?.slug || orgData.organizationSlug,
        role: 'organization_admin',
        loginTime: new Date().toISOString(),
        organizationData: matchedOrg // Store full org data
      };

      console.log('✅ Organization login successful!');
      console.log('📌 Organization ID:', organizationId);
      console.log('📌 Display Name:', displayName);
      console.log('📌 Backend Name:', matchedOrg?.name);
      console.log('📌 Full user data:', userData);

      setOrganizationUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('orgSession', 'true');
      localStorage.setItem('orgUser', JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error('❌ Failed to fetch organizations:', error);
      
      // Fallback: use default IDs if backend fails
      const fallbackOrgId = `${orgData.organizationSlug}-company`;
      const userData = {
        email: orgData.email,
        organizationName: orgData.organizationName,
        organizationId: fallbackOrgId,
        organizationSlug: orgData.organizationSlug,
        role: 'organization_admin',
        loginTime: new Date().toISOString()
      };

      console.warn('⚠️ Using fallback organization ID:', fallbackOrgId);

      setOrganizationUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('orgSession', 'true');
      localStorage.setItem('orgUser', JSON.stringify(userData));

      return userData;
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
        logout 
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

