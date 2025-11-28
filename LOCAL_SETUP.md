# Local Development Setup

## Backend URL Configuration

The dashboard is now configured to use `http://localhost:3000` as the default backend URL for local development.

## Environment Variables

### For Local Development

You can optionally create a `.env` file in `hmr-dashboard` with:

```env
REACT_APP_API_URL=http://localhost:3000
```

**Note:** If you don't set this, it will default to `http://localhost:3000` automatically.

### For Production Deployment

When deploying, set:

```env
REACT_APP_API_URL=https://your-backend-url.vercel.app
```

## VAPID Key Sync

The VAPID public key is **automatically fetched from the backend** to keep it in sync. You don't need to set it in the frontend `.env` file.

The frontend will:
1. Try to fetch VAPID key from backend API: `GET /api/notifications/vapid-public-key`
2. Use it for push notification subscriptions
3. Cache it for the session

**Important:** Make sure your backend has VAPID keys configured in its `.env`:
```env
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_EMAIL=mailto:your-email@example.com
```

## Running Locally

1. **Start Backend:**
   ```bash
   cd Blocks-Backend
   npm run start:dev
   # Backend runs on http://localhost:3000
   ```

2. **Start Frontend:**
   ```bash
   cd hmr-dashboard
   npm start
   # Frontend runs on http://localhost:3001 (or next available port)
   ```

3. **Test Web Push:**
   - Open browser console
   - Look for "Service Worker registered successfully"
   - Look for "VAPID key fetched from backend"
   - Look for "Push subscription created"
   - Check backend logs for "Web push subscription registered successfully"

## Testing

1. Login to the dashboard
2. Check browser console for push notification setup messages
3. Check backend logs to confirm subscription registration
4. Trigger a notification from backend to test

## Troubleshooting

**Backend not reachable:**
- Make sure backend is running on `http://localhost:3000`
- Check CORS settings in backend
- Check network tab in browser DevTools

**VAPID key not found:**
- Check backend `.env` has `VAPID_PUBLIC_KEY` set
- Check backend logs for VAPID configuration
- Try accessing `http://localhost:3000/api/notifications/vapid-public-key` directly

**Service Worker not registering:**
- Make sure you're using HTTPS or localhost (not IP address)
- Check browser console for errors
- Check `public/sw.js` file exists


