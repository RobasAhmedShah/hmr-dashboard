# 🚨 CORS Issue - Backend Fix Required

## **Error:**
```
Access to XMLHttpRequest at 'https://hmr-backend.vercel.app/kyc/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
Method PATCH is not allowed by Access-Control-Allow-Methods in preflight response.
```

## **Problem:**
The backend's CORS configuration doesn't allow **PUT** or **PATCH** methods from the frontend.

---

## **🔧 Backend Fix Required (on Vercel Backend)**

The backend needs to update CORS settings to allow these methods.

### **Solution 1: Enable PUT/PATCH in CORS (Recommended)**

In your backend code (likely in `main.ts` or `app.module.ts`):

```typescript
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Update CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'https://your-frontend-domain.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // ✅ Add PUT and PATCH
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

### **Solution 2: Use POST for Updates (Workaround)**

If you can't change CORS immediately, change the backend endpoint to accept **POST** instead of **PATCH**:

```typescript
// Backend: Change from PATCH to POST
@Post('kyc/:id/status')  // Instead of @Patch('kyc/:id')
async updateKYCStatus(
  @Param('id') id: string,
  @Body() updateDto: UpdateKYCDto
) {
  return this.kycService.updateStatus(id, updateDto);
}
```

Then update frontend:
```javascript
// frontend/src/services/api.js
updateKYCStatus: (kycId, data) => api.post(`/kyc/${kycId}/status`, data),
```

---

## **📋 Current Status**

### **Frontend Changes Made:**
✅ Changed from `api.patch()` to `api.put()` to try alternative method  
✅ Added detailed error logging  
✅ Added user-friendly CORS error messages  

### **What We're Waiting For:**
❌ Backend CORS configuration update  
❌ OR Backend to accept POST instead of PATCH  

---

## **🧪 Testing After Backend Fix**

Once backend is updated, test by:

1. **Open browser console** (F12)
2. **Click any KYC badge** in Users Management
3. **Click "Approve KYC"** button
4. **Check console** - should see:
   ```
   ✅ KYC status updated to "verified" successfully!
   ```

If still getting CORS error, check:
- Backend is deployed with new CORS settings
- Cache is cleared (hard refresh: Ctrl+Shift+R)
- Using correct backend URL in `.env`

---

## **🔗 Backend API Endpoints Affected**

| Endpoint | Method | Frontend Usage | Status |
|----------|--------|---------------|--------|
| `/kyc/:id` | **PATCH** | Update KYC status | ❌ CORS blocked |
| `/kyc/:id` | **PUT** | Update KYC status (alternative) | ❌ CORS blocked |
| `/kyc` | GET | List all KYC | ✅ Working |
| `/kyc/user/:userId` | GET | Get user KYC | ✅ Working |

---

## **⚡ Quick Fix Command (for Backend Team)**

If using NestJS:
```bash
npm install @nestjs/platform-express
```

Update `main.ts`:
```typescript
app.enableCors({
  origin: true, // Allow all origins (dev only)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
});
```

For production, specify exact origins:
```typescript
app.enableCors({
  origin: [
    'https://hmr-dashboard.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});
```

---

## **📞 Contact**

**Backend Team:** Please enable CORS for PUT/PATCH methods on:
- `https://hmr-backend.vercel.app`

**Frontend Team:** Once backend is updated, test KYC approval feature.

---

**Last Updated:** {{ current_date }}  
**Priority:** 🔴 **HIGH** - Blocks KYC approval feature




