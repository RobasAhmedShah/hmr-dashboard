import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useQuery } from 'react-query';
import { usersAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useWebPush } from '../hooks/useWebPush';

const NotificationIcon = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isSupported, isSubscribed, enableNotifications } = useWebPush();

  // Fetch notifications
  const { data: notificationsData, refetch } = useQuery(
    ['notifications', currentUser?.id],
    () => usersAPI.getNotifications(currentUser?.id),
    {
      enabled: !!currentUser?.id,
      refetchInterval: 30000, // Refetch every 30 seconds
      onSuccess: (data) => {
        const notifications = data?.data?.notifications || data?.data || data?.notifications || [];
        const unread = notifications.filter(n => !n.read || n.read === false).length;
        setUnreadCount(unread);
      },
    }
  );

  const notifications = notificationsData?.data?.notifications || 
                        notificationsData?.data || 
                        notificationsData?.notifications || 
                        [];

  const handleClick = async (e) => {
    // If notifications are not enabled and browser supports it, prompt to enable
    if (isSupported && !isSubscribed && Notification.permission === 'default') {
      e.preventDefault();
      try {
        await enableNotifications();
        // After enabling, navigate to notifications
        navigate('/notifications');
      } catch (error) {
        console.error('Failed to enable notifications:', error);
        // Still navigate even if enabling failed
        navigate('/notifications');
      }
    } else {
      navigate('/notifications');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="relative inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
        title={isSupported && !isSubscribed ? 'Click to enable notifications' : 'Notifications'}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[18px] h-[18px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {isSupported && !isSubscribed && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-2 h-2 transform translate-x-1/2 -translate-y-1/2 bg-yellow-500 rounded-full border-2 border-white"></span>
        )}
      </button>
    </div>
  );
};

export default NotificationIcon;

