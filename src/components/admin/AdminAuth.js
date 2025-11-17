import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminAuthContext = createContext();

// Session duration: 1 hour (3600000 milliseconds)
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing valid session on mount
  useEffect(() => {
    console.log('AdminAuth: Initializing...');
    
    const checkSession = () => {
      try {
        const savedSession = localStorage.getItem('adminSession');
        const savedUser = localStorage.getItem('adminUser');
        const sessionExpiry = localStorage.getItem('adminSessionExpiry');
        
        if (savedSession && savedUser && sessionExpiry) {
          const expiryTime = parseInt(sessionExpiry, 10);
          const now = Date.now();
          
          // Check if session is still valid (not expired)
          if (now < expiryTime) {
            console.log('AdminAuth: Valid session found, restoring...');
            const userData = JSON.parse(savedUser);
            setAdminUser(userData);
            console.log('AdminAuth: Session restored, expires at:', new Date(expiryTime).toLocaleString());
            return true;
          } else {
            console.log('AdminAuth: Session expired, clearing...');
            // Session expired, clear it
            localStorage.removeItem('adminSession');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminSessionExpiry');
            setAdminUser(null);
            return false;
          }
        } else {
          console.log('AdminAuth: No valid session found');
          setAdminUser(null);
          return false;
        }
      } catch (error) {
        console.error('AdminAuth: Error checking session:', error);
        // Clear corrupted session data
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminSessionExpiry');
        setAdminUser(null);
        return false;
      }
    };
    
    checkSession();
    setIsLoading(false);
    
    // Periodically check session validity (every 5 minutes)
    const sessionCheckInterval = setInterval(() => {
      if (!checkSession()) {
        // Session expired, stop checking
        clearInterval(sessionCheckInterval);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    // Cleanup interval on unmount
    return () => clearInterval(sessionCheckInterval);
  }, []);
  
  // Extend session on user activity (when adminUser is set and user is active)
  useEffect(() => {
    if (adminUser) {
      // Extend session on any activity - reset expiry to 1 hour from now
      const extendSession = () => {
        const expiryTime = Date.now() + SESSION_DURATION;
        localStorage.setItem('adminSessionExpiry', expiryTime.toString());
        console.log('AdminAuth: Session extended, new expiry:', new Date(expiryTime).toLocaleString());
      };
      
      // Extend session every 30 minutes if user is still active
      const extendInterval = setInterval(extendSession, 30 * 60 * 1000);
      
      // Also extend on user interactions (click, keypress, etc.)
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => {
        window.addEventListener(event, extendSession, { passive: true });
      });
      
      return () => {
        clearInterval(extendInterval);
        events.forEach(event => {
          window.removeEventListener(event, extendSession);
        });
      };
    }
  }, [adminUser]);

  const login = (userData) => {
    console.log('AdminAuth: login called with:', userData);
    setAdminUser(userData);
    
    // Save session to localStorage with expiration
    const expiryTime = Date.now() + SESSION_DURATION;
    localStorage.setItem('adminSession', 'true');
    localStorage.setItem('adminUser', JSON.stringify(userData));
    localStorage.setItem('adminSessionExpiry', expiryTime.toString());
    
    console.log('AdminAuth: login completed, user set to:', userData);
    console.log('AdminAuth: Session expires at:', new Date(expiryTime).toLocaleString());
  };

  const logout = () => {
    setAdminUser(null);
    // Clear all session data
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminSessionExpiry');
    navigate('/admin/login');
  };

  const value = {
    adminUser,
    isAuthenticated: !!adminUser,
    isLoading,
    login,
    logout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
