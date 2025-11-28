import { useState, useEffect, useCallback } from 'react';
import { initializeWebPush, requestNotificationPermission } from '../services/webPush';
import { usersAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';

/**
 * Hook to manage web push notifications
 * Provides functions to enable/disable notifications and check status
 */
export function useWebPush() {
  const { currentUser } = useUser();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check browser support
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check subscription status
  useEffect(() => {
    if (isSupported && currentUser?.id) {
      checkSubscriptionStatus();
    }
  }, [isSupported, currentUser?.id]);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsSubscribed(false);
    }
  };

  const enableNotifications = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Browser does not support notifications');
    }

    setIsLoading(true);
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      setPermission(Notification.permission);

      const subscriptionData = await initializeWebPush(async (subData) => {
        // Pass userId to register web push (no JWT needed)
        await usersAPI.registerWebPush(subData, currentUser?.id);
      });

      if (subscriptionData) {
        setIsSubscribed(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, currentUser?.id]);

  const disableNotifications = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        console.log('Notifications disabled');
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      throw error;
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    enableNotifications,
    disableNotifications,
    checkSubscriptionStatus,
  };
}

