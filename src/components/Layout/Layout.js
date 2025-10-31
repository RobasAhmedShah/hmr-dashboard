import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import Header from './Header';

const Layout = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#02080f' : '#ffffff',
            color: theme === 'dark' ? '#e9eff5' : '#0f172a',
            border: theme === 'dark' ? '1px solid #0e171f' : '1px solid #e2e8f0',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: theme === 'dark' ? '#e9eff5' : '#0f172a',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: theme === 'dark' ? '#e9eff5' : '#0f172a',
            },
          },
        }}
      />
    </div>
  );
};

export default Layout;
