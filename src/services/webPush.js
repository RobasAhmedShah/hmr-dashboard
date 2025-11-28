// Web Push Notification Service using VAPID
// This service handles registration and management of web push notifications
// VAPID key is always fetched from backend to keep it in sync

import { API_BASE_URL } from '../config/api';

let VAPID_PUBLIC_KEY = ''; // Will be fetched from backend

/**
 * Convert VAPID public key from base64url to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notification permission was previously denied');
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported');
  }

  try {
    // Check if service worker is already registered
    const existingRegistration = await navigator.serviceWorker.ready;
    if (existingRegistration) {
      console.log('Service Worker already registered:', existingRegistration.scope);
      return existingRegistration;
    }

    // Register new service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service Worker registered:', registration.scope);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    // Try to get existing registration
    try {
      const existing = await navigator.serviceWorker.ready;
      return existing;
    } catch (e) {
      throw error;
    }
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(registration, vapidKey = null) {
  const keyToUse = vapidKey || VAPID_PUBLIC_KEY;
  if (!keyToUse) {
    throw new Error('VAPID public key is not configured');
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyToUse),
    });

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    throw error;
  }
}

/**
 * Get existing push subscription
 */
export async function getPushSubscription(registration) {
  try {
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(registration) {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    throw error;
  }
}

/**
 * Fetch VAPID public key from backend
 */
async function fetchVapidPublicKey() {
  try {
    // Use axios directly to avoid circular dependency
    const axios = (await import('axios')).default;
    
    const response = await axios.get(`${API_BASE_URL}/api/notifications/vapid-public-key`);
    const publicKey = response?.data?.publicKey || response?.data?.data?.publicKey;
    
    if (publicKey) {
      console.log('✅ VAPID public key fetched from backend');
      return publicKey;
    }
    
    console.warn('VAPID public key not found in backend response');
    return null;
  } catch (error) {
    console.warn('Failed to fetch VAPID public key from backend:', error);
    if (error.response) {
      console.warn('Response status:', error.response.status);
      console.warn('Response data:', error.response.data);
    }
    return null;
  }
}

/**
 * Initialize web push notifications
 * This should be called when user logs in
 */
export async function initializeWebPush(onSubscription) {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Browser does not support web push notifications');
      return null;
    }

    // Always fetch VAPID key from backend to keep it in sync
    let vapidKey = VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.log('Fetching VAPID public key from backend...');
      vapidKey = await fetchVapidPublicKey();
      if (vapidKey) {
        // Store it for future use (until page refresh)
        VAPID_PUBLIC_KEY = vapidKey;
        console.log('✅ VAPID key fetched and cached from backend');
      }
    } else {
      console.log('Using cached VAPID key');
    }

    // Check if VAPID key is configured (warn but don't fail completely)
    if (!vapidKey) {
      console.warn('⚠️ VAPID_PUBLIC_KEY is not configured. Web push notifications will not work.');
      console.warn('Please add REACT_APP_VAPID_PUBLIC_KEY to your .env file or configure it in backend');
      return null;
    }

    // Wait for service worker to be ready
    let registration;
    try {
      registration = await navigator.serviceWorker.ready;
      console.log('Service Worker is ready:', registration.scope);
    } catch (error) {
      // If not ready, try to register
      registration = await registerServiceWorker();
    }

    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('Notification permission denied by user');
      return null;
    }

    // Check for existing subscription
    let subscription = await getPushSubscription(registration);
    
    // If no subscription and VAPID key is configured, create one
    if (!subscription) {
      if (!vapidKey) {
        console.warn('Cannot create push subscription: VAPID_PUBLIC_KEY not configured');
        return null;
      }
      console.log('Creating new push subscription...');
      subscription = await subscribeToPush(registration, vapidKey);
      console.log('Push subscription created:', subscription.endpoint);
    } else {
      console.log('Using existing push subscription:', subscription.endpoint);
    }

    // Convert subscription to format expected by backend
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');
    
    if (!p256dhKey || !authKey) {
      throw new Error('Subscription keys are missing');
    }

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(
          String.fromCharCode(...new Uint8Array(p256dhKey))
        ),
        auth: btoa(
          String.fromCharCode(...new Uint8Array(authKey))
        ),
      },
    };

    console.log('Subscription data prepared:', {
      endpoint: subscriptionData.endpoint,
      hasKeys: !!subscriptionData.keys.p256dh && !!subscriptionData.keys.auth
    });

    // Call callback with subscription data
    if (onSubscription) {
      try {
        await onSubscription(subscriptionData);
        console.log('Subscription registered with backend successfully');
      } catch (error) {
        console.error('Failed to register subscription with backend:', error);
        // Don't throw - subscription is still valid locally
      }
    }

    return subscriptionData;
  } catch (error) {
    console.error('Failed to initialize web push:', error);
    // Don't throw - allow app to continue without push notifications
    return null;
  }
}

