// Service Worker for Web Push Notifications
// This file should be in the public folder

self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Blocks',
    body: 'You have a new notification',
    icon: '/logo1.png',
    badge: '/logo1.png',
    data: {},
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {},
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false,
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
      notificationData.body = event.data.text();
    }
  }

  const promiseChain = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Get URL from notification data, with fallback
  let urlToOpen = '/notifications';
  if (event.notification.data) {
    if (typeof event.notification.data === 'object') {
      urlToOpen = event.notification.data.url || event.notification.data.data?.url || '/notifications';
    }
  }
  
  // Ensure URL is relative (starts with /)
  if (!urlToOpen.startsWith('/')) {
    urlToOpen = '/' + urlToOpen;
  }
  
  // Get the origin
  const origin = self.location.origin;
  const fullUrl = origin + urlToOpen;
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then(function(clientList) {
      // Check if there's already a window/tab open with our origin
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // Check if client URL matches our origin
        if (client.url.startsWith(origin)) {
          // Focus existing window
          if ('focus' in client) {
            client.focus();
            // Post message to navigate (React Router will handle it)
            client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
            return;
          }
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
});

