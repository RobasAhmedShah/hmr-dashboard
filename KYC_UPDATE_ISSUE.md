# 🔴 KYC Update Issue - 404 Error

## Current Error

When trying to update KYC status from the admin dashboard, getting a **404 Not Found** error:

```
AxiosError: Request failed with status code 404
Method: PATCH
URL: https://hmr-backend.vercel.app/kyc/{kycId}
```

---

## Root Cause Analysis

### 1. **404 Error Means:**
- ✅ CORS is working (we're getting a response, not blocked)
- ❌ The endpoint `PATCH /kyc/:id` is either:
  - Not deployed to Vercel
  - Not properly configured in backend routing
  - The KYC ID being sent is invalid

### 2. **What's Being Sent:**
```javascript
// Frontend API call
PATCH https://hmr-backend.vercel.app/kyc/{kycId}
Body: {
  "status": "verified" | "pending" | "rejected",
  "reviewer": "admin@example.com",
  "rejectionReason": null | "reason text"
}
```

### 3. **Expected Response:**
```json
{
  "id": "ebde11ec-5d5c-457d-ba87-b83f431962c1",
  "userId": "9e354ce4-c7ab-4d5b-ba6c-50783d4c01e1",
  "status": "verified",
  "reviewer": "admin@example.com",
  "reviewedAt": "2025-10-23T12:00:00.000Z",
  ...
}
```

---

## Backend Checklist

### ✅ Things to Verify:

1. **Endpoint is Implemented**
   ```typescript
   // In KYC controller
   @Patch(':id')
   async updateKycStatus(
     @Param('id') id: string,
     @Body() updateDto: UpdateKycStatusDto
   ) {
     // Implementation
   }
   ```

2. **Endpoint is Registered**
   ```typescript
   // In app.module.ts or routes
   {
     path: 'kyc',
     controller: KycController,
     // Should have PATCH /:id route
   }
   ```

3. **Deployed to Vercel**
   - Check Vercel deployment logs
   - Verify the route is included in build
   - Test with curl after deployment

4. **KYC ID Format**
   - Frontend sends: UUID string (e.g., `d8162efb-59b1-4a46-8d4e-a7297a658850`)
   - Backend expects: UUID or displayCode
   - Make sure ID validation doesn't reject valid UUIDs

---

## How to Debug

### 1. **Check Backend Logs**
```bash
# In Vercel dashboard, check function logs when PATCH request is made
# Look for:
# - "Route not found" errors
# - "Invalid ID" validation errors
# - Any 404 responses
```

### 2. **Test with Curl**
```bash
# Get a valid KYC ID first
curl https://hmr-backend.vercel.app/kyc | jq '.data[0].id'

# Then try to update it
curl -X PATCH https://hmr-backend.vercel.app/kyc/{that-id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "verified",
    "reviewer": "admin@test.com"
  }'
```

### 3. **Check All KYC Routes**
```bash
# List all KYC records
curl https://hmr-backend.vercel.app/kyc

# Get specific KYC
curl https://hmr-backend.vercel.app/kyc/{id}

# Get KYC by user
curl https://hmr-backend.vercel.app/kyc/user/{userId}
```

If these work but PATCH doesn't, the issue is definitely the PATCH endpoint.

---

## Frontend Debug Info

The frontend now logs detailed error information to the browser console:

```javascript
Error details: {
  message: "Request failed with status code 404",
  status: 404,
  endpoint: "https://hmr-backend.vercel.app/kyc/{kycId}",
  method: "PATCH",
  sentData: '{"status":"verified","reviewer":"admin@example.com"}',
  response: { ... }
}
```

**To see this:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to update KYC status
4. Look for the detailed error log

---

## Quick Fix Options

### Option 1: Use POST Instead (Temporary)
```typescript
// Backend: Add alternative route
@Post(':id/update-status')
async updateKycStatusPost(
  @Param('id') id: string,
  @Body() updateDto: UpdateKycStatusDto
) {
  return this.updateKycStatus(id, updateDto);
}
```

```javascript
// Frontend: Change to POST
updateKYCStatus: (kycId, data) => api.post(`/kyc/${kycId}/update-status`, data),
```

### Option 2: Use PUT Instead
```typescript
// Backend: Add PUT route
@Put(':id')
async updateKycStatusPut(
  @Param('id') id: string,
  @Body() updateDto: UpdateKycStatusDto
) {
  return this.updateKycStatus(id, updateDto);
}
```

```javascript
// Frontend: Change to PUT
updateKYCStatus: (kycId, data) => api.put(`/kyc/${kycId}`, data),
```

### Option 3: Fix PATCH (Recommended)
```typescript
// Backend: Ensure PATCH is properly registered
@Patch(':id')
@HttpCode(200)
async updateKycStatus(
  @Param('id') id: string,
  @Body() updateDto: UpdateKycStatusDto
) {
  // Validate ID
  const kyc = await this.kycService.findOne(id);
  if (!kyc) {
    throw new NotFoundException(`KYC record with ID ${id} not found`);
  }
  
  // Update
  return this.kycService.updateStatus(id, updateDto);
}
```

---

## CORS Configuration (For When 404 is Fixed)

If you get CORS errors after fixing the 404, add this to `main.ts`:

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-frontend-domain.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});
```

---

## Expected Backend API (According to Docs)

### Endpoint
```
PATCH /kyc/:id
```

### Parameters
- `id`: KYC verification UUID or user displayCode

### Request Body
```json
{
  "status": "verified" | "pending" | "rejected",
  "reviewer": "admin@example.com",
  "rejectionReason": null | "Reason if rejected"
}
```

### Response
```json
{
  "id": "uuid",
  "userId": "uuid",
  "user": { ... },
  "status": "verified",
  "reviewer": "admin@example.com",
  "reviewedAt": "2025-10-23T12:00:00.000Z",
  ...
}
```

---

## Status

- ✅ Frontend implementation: **Complete**
- ✅ Error handling: **Complete with detailed logging**
- ✅ PATCH method: **Using correct method**
- ❌ Backend endpoint: **Not found (404)**
- ⏳ Waiting for: **Backend team to fix/deploy PATCH /kyc/:id**

---

## Contact Backend Team

**Issue Summary:**
The frontend is correctly calling `PATCH https://hmr-backend.vercel.app/kyc/{kycId}` but getting a 404 error. Please verify that:

1. The PATCH /kyc/:id endpoint is implemented
2. It's deployed to Vercel
3. The route is registered correctly
4. CORS allows PATCH method

**Test Case:**
```bash
curl -X PATCH https://hmr-backend.vercel.app/kyc/d8162efb-59b1-4a46-8d4e-a7297a658850 \
  -H "Content-Type: application/json" \
  -d '{"status":"verified","reviewer":"admin@test.com"}'
  
# Expected: 200 OK with updated KYC object
# Currently getting: 404 Not Found
```

---

**Updated:** October 23, 2025




