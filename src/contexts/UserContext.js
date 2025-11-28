import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { usersAPI } from '../services/api';
import { initializeWebPush } from '../services/webPush';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  // Fetch users from database
  const { isLoading: usersLoading, error: usersError } = useQuery(
    'users',
    () => usersAPI.getAll(),
    {
      onSuccess: (response) => {
        console.log('Users API response:', response);
        
        // Handle different response structures
        let fetchedUsers = [];
        
        if (response?.data) {
          // Try different possible response structures
          fetchedUsers = response.data.data?.users || 
                        response.data.data || 
                        response.data.users || 
                        (Array.isArray(response.data) ? response.data : []);
        }
        
        // Map user data to ensure consistent format
        const formattedUsers = fetchedUsers.map(user => ({
          id: user.id || user.userId,
          name: user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          firstName: user.firstName || user.name?.split(' ')[0] || '',
          lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email,
          phone: user.phone || user.phoneNumber || '',
          kycStatus: user.kycStatus || user.kyc?.status || 'pending'
        }));
        
        console.log('Formatted users:', formattedUsers);
        setUsers(formattedUsers);
        
        // Set first user as default if no current user
        if (!currentUser && formattedUsers.length > 0) {
          console.log('Setting default user:', formattedUsers[0]);
          setCurrentUser(formattedUsers[0]);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch users:', error);
        console.error('Error details:', error.response?.data || error.message);
        // Fallback to hardcoded users if API fails
        const fallbackUsers = [
          {
            id: 'a6702919-c381-4ebe-881a-4c3045d5f551',
            name: 'Afraz Alam',
            firstName: 'Afraz',
            lastName: 'Alam',
            email: 'afrazalam@example.com',
            phone: '+92-300-1234567',
            kycStatus: 'verified'
          }
        ];
        setUsers(fallbackUsers);
        if (!currentUser) {
          setCurrentUser(fallbackUsers[0]);
        }
      },
      retry: 1,
      retryDelay: 1000
    }
  );

  // Initialize web push notifications when user is set
  useEffect(() => {
    if (currentUser?.id) {
      // Small delay to ensure service worker is ready
      const timer = setTimeout(() => {
        initializeWebPush(async (subscriptionData) => {
          try {
            // Pass userId to register web push (no JWT needed)
            const response = await usersAPI.registerWebPush(subscriptionData, currentUser.id);
            console.log('✅ Web push subscription registered with backend:', response);
          } catch (error) {
            console.error('❌ Failed to register web push subscription:', error);
            if (error.response) {
              console.error('Response status:', error.response.status);
              console.error('Response data:', error.response.data);
            }
          }
        }).catch((error) => {
          console.warn('⚠️ Web push initialization failed:', error);
        });
      }, 1000); // Wait 1 second for service worker to be ready

      return () => clearTimeout(timer);
    }
  }, [currentUser?.id]);

  const switchUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      console.log('Switching to user:', user);
      setCurrentUser(user);
    }
  };

  const refreshUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      console.log('Refresh users response:', response);
      
      // Handle different response structures
      let fetchedUsers = [];
      
      if (response?.data) {
        fetchedUsers = response.data.data?.users || 
                      response.data.data || 
                      response.data.users || 
                      (Array.isArray(response.data) ? response.data : []);
      }
      
      // Map user data to ensure consistent format
      const formattedUsers = fetchedUsers.map(user => ({
        id: user.id || user.userId,
        name: user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phone: user.phone || user.phoneNumber || '',
        kycStatus: user.kycStatus || user.kyc?.status || 'pending'
      }));
      
      setUsers(formattedUsers);
      return true;
    } catch (error) {
      console.error('Error refreshing users:', error);
      return false;
    }
  };

  const value = {
    currentUser,
    switchUser,
    users,
    usersLoading,
    usersError,
    refreshUsers
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
