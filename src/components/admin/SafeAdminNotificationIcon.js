import React from 'react';
import AdminNotificationIcon from './AdminNotificationIcon';

// Safe wrapper to prevent crashes
const SafeAdminNotificationIcon = () => {
  try {
    return <AdminNotificationIcon />;
  } catch (error) {
    console.error('AdminNotificationIcon error:', error);
    return null;
  }
};

export default SafeAdminNotificationIcon;

