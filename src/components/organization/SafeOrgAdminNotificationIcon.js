import React from 'react';
import OrgAdminNotificationIcon from './OrgAdminNotificationIcon';

// Safe wrapper to prevent crashes
const SafeOrgAdminNotificationIcon = () => {
  try {
    return <OrgAdminNotificationIcon />;
  } catch (error) {
    console.error('OrgAdminNotificationIcon error:', error);
    return null;
  }
};

export default SafeOrgAdminNotificationIcon;

