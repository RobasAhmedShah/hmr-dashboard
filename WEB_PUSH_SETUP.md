# Web Push Notifications Setup Guide

## Overview
Web push notifications are now integrated into the HMR Dashboard. This guide will help you set them up.

## Prerequisites
1. Backend must have VAPID keys configured
2. Backend must be running and accessible
3. HTTPS is required for production (localhost works for development)

## Setup Steps

### 1. Get VAPID Public Key from Backend

The VAPID public key should be available from your backend. You can:

**Option A: Get from Backend Environment**
- Check your backend `.env` file for `VAPID_PUBLIC_KEY`
- Copy the value

**Option B: Add API Endpoint (Recommended)**
Add this endpoint to your backend to expose the public key:

```typescript
// In Blocks-Backend/src/notifications/notifications.controller.ts
@Get('vapid-public-key')
@Public()
async getVapidPublicKey() {
  const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
  if (!publicKey) {
    throw new NotFoundException('VAPID public key not configured');
  }
  return { publicKey };
}
```

### 2. Configure Frontend Environment

Add the VAPID public key to your `.env` file in `hmr-dashboard`:

```env
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

**Important:** The VAPID public key should be in base64url format (the format that web-push uses).

### 3. How It Works

1. **Service Worker Registration**: Automatically registers when the app loads
2. **Permission Request**: User is prompted to allow notifications when they log in
3. **Subscription**: Creates a push subscription and sends it to the backend
4. **Backend Storage**: Backend stores the subscription in the user's `webPushSubscription` field
5. **Notifications**: When backend sends a notification, it uses web-push to send to the subscription

### 4. Testing

1. **Check Browser Console**: Look for these messages:
   - "Service Worker registered successfully"
   - "Push subscription created"
   - "✅ Web push subscription registered with backend"

2. **Check Backend Logs**: Should see:
   - "Web push subscription registered successfully"

3. **Test Notification**: 
   - Trigger a notification from backend (e.g., distribute ROI)
   - You should receive a browser notification
   - Clicking it should navigate to the notifications page

### 5. Troubleshooting

**Problem: "VAPID_PUBLIC_KEY is not configured"**
- Solution: Add `REACT_APP_VAPID_PUBLIC_KEY` to your `.env` file

**Problem: "Notification permission denied"**
- Solution: User needs to enable notifications in browser settings
- Chrome: Settings > Privacy and Security > Site Settings > Notifications

**Problem: "Service Worker registration failed"**
- Solution: Make sure you're using HTTPS (or localhost for development)
- Check browser console for specific errors

**Problem: "Failed to register web push subscription"**
- Solution: Check backend logs for errors
- Verify backend has VAPID keys configured
- Check network tab for API call errors

**Problem: Notifications not appearing**
- Solution: 
  1. Check if subscription is registered: Look in browser console
  2. Check backend logs when sending notification
  3. Verify VAPID keys match between frontend and backend
  4. Check browser notification settings

### 6. Manual Testing

You can manually test by:
1. Opening browser DevTools > Application > Service Workers
2. Check if service worker is registered
3. Go to Application > Storage > IndexedDB to see push subscriptions
4. Use browser console to check: `navigator.serviceWorker.ready`

### 7. Production Considerations

- **HTTPS Required**: Web push only works over HTTPS (or localhost)
- **VAPID Keys**: Must be the same across all instances
- **Service Worker**: Must be accessible at `/sw.js`
- **CORS**: Backend must allow requests from your frontend domain

## Current Status

✅ Service Worker created and registered
✅ Push subscription creation
✅ Backend registration endpoint
✅ Notification display
✅ Click handling
✅ Navigation from notifications

⚠️ **Action Required**: Add `REACT_APP_VAPID_PUBLIC_KEY` to your `.env` file

