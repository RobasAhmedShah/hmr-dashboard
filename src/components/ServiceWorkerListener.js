import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component to listen for service worker messages (like navigation requests)
 * This should be placed inside the Router
 */
export function ServiceWorkerListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Listen for messages from service worker
    const handleMessage = (event) => {
      console.log('Service worker message received:', event.data);
      if (event.data && event.data.type === 'NAVIGATE') {
        const url = event.data.url;
        if (url) {
          console.log('Navigating to:', url);
          navigate(url);
        }
      }
    };

    // Get service worker registration
    navigator.serviceWorker.ready.then((registration) => {
      // Listen for messages
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }).catch((error) => {
      console.error('Service worker not ready:', error);
    });

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [navigate]);

  return null;
}

