# ⚠️ Missing Backend Endpoints - Properties Management

## Current Issue

When trying to **edit**, **update status**, or **delete** properties, you're getting **404 errors** because these backend endpoints are not implemented yet.

---

## 🔴 Missing Endpoints

### 1. **Update Property** - 404 Error
```
PUT /properties/:id
```

**Current Error:**
```
Request failed with status code 404
```

**What Frontend Sends:**
```javascript
PUT https://hmr-backend.vercel.app/properties/{property-id}

Body: {
  title: "Property Name",
  organizationId: "ORG-000001",
  propertyType: "residential",
  status: "active",
  city: "Karachi",
  country: "Pakistan",
  purchasePriceUSDT: 1000000,
  expectedROI: 10,
  totalTokens: 1000,
  ... // all property fields
}
```

**Expected Response:**
```json
{
  "id": "property-uuid",
  "displayCode": "PROP-000001",
  "title": "Updated Property Name",
  ... // updated property data
}
```

---

### 2. **Update Property Status** - 404 Error
```
PATCH /properties/:id/status
```

**Current Error:**
```
PATCH https://hmr-backend.vercel.app/properties/{id}/status 404 (Not Found)
```

**What Frontend Sends:**
```javascript
PATCH https://hmr-backend.vercel.app/properties/{property-id}/status

Body: {
  status: "active" | "coming-soon" | "construction" | "on-hold" | "sold-out" | "completed",
  is_active: true | false,
  is_featured: true | false
}
```

**Expected Response:**
```json
{
  "id": "property-uuid",
  "status": "active",
  "is_active": true,
  "is_featured": false,
  ... // property data
}
```

---

### 3. **Delete Property** - 404 Error
```
DELETE /properties/:id
```

**Current Error:**
```
Request failed with status code 404
```

**What Frontend Sends:**
```javascript
DELETE https://hmr-backend.vercel.app/properties/{property-id}
```

**Expected Response:**
```json
{
  "message": "Property deleted successfully",
  "id": "property-uuid"
}
```

**Important Backend Logic:**
- ✅ Check if property has active investments
- ✅ Prevent deletion if funded (funding > 0%)
- ✅ Return 400 error if cannot delete
- ✅ Only delete if no investments exist

---

## ✅ Working Endpoints

### **Create Property** - Working ✅
```
POST /properties
```

**Status:** ✅ Implemented and working

**What it does:**
- Creates new property in database
- Auto-generates displayCode (PROP-XXXXXX)
- Returns created property data

---

### **List Properties** - Working ✅
```
GET /properties
```

**Status:** ✅ Implemented and working

**What it does:**
- Lists all properties
- Supports pagination, filtering, sorting
- Returns array of properties

---

### **Get Single Property** - Working ✅
```
GET /properties/:id
```

**Status:** ✅ Implemented and working

**What it does:**
- Gets single property by ID or displayCode
- Returns full property details

---

## 📋 Backend Implementation Guide

### **1. Implement PUT /properties/:id**

```typescript
// In properties.controller.ts
@Put(':id')
async updateProperty(
  @Param('id') id: string,
  @Body() updateDto: UpdatePropertyDto
) {
  // 1. Find property by ID or displayCode
  const property = await this.propertiesService.findOne(id);
  if (!property) {
    throw new NotFoundException(`Property with ID ${id} not found`);
  }
  
  // 2. Update property
  const updated = await this.propertiesService.update(id, updateDto);
  
  // 3. Return updated property
  return updated;
}
```

**Request Body:**
- All property fields (title, description, pricing, tokenization, etc.)
- Can be partial update or full update

**Response:**
- Updated property object with all fields

---

### **2. Implement PATCH /properties/:id/status**

```typescript
// In properties.controller.ts
@Patch(':id/status')
async updatePropertyStatus(
  @Param('id') id: string,
  @Body() statusDto: UpdatePropertyStatusDto
) {
  // 1. Validate status value
  const validStatuses = ['coming-soon', 'active', 'construction', 'on-hold', 'sold-out', 'completed'];
  if (!validStatuses.includes(statusDto.status)) {
    throw new BadRequestException('Invalid status value');
  }
  
  // 2. Find and update property
  const property = await this.propertiesService.updateStatus(id, statusDto);
  
  // 3. Return updated property
  return property;
}
```

**DTO (UpdatePropertyStatusDto):**
```typescript
export class UpdatePropertyStatusDto {
  @IsString()
  @IsOptional()
  status?: string;
  
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
  
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;
}
```

---

### **3. Implement DELETE /properties/:id**

```typescript
// In properties.controller.ts
@Delete(':id')
async deleteProperty(@Param('id') id: string) {
  // 1. Find property
  const property = await this.propertiesService.findOne(id);
  if (!property) {
    throw new NotFoundException(`Property with ID ${id} not found`);
  }
  
  // 2. Check if property has investments
  const hasInvestments = await this.investmentsService.hasInvestmentsForProperty(id);
  if (hasInvestments) {
    throw new BadRequestException(
      'Cannot delete property with active investments. ' +
      'Property must have zero funding to be deleted.'
    );
  }
  
  // 3. Check funding percentage
  const fundingPercentage = ((property.totalTokens - property.availableTokens) / property.totalTokens) * 100;
  if (fundingPercentage > 0) {
    throw new BadRequestException(
      `Cannot delete property with ${fundingPercentage.toFixed(2)}% funding`
    );
  }
  
  // 4. Delete property
  await this.propertiesService.delete(id);
  
  // 5. Return confirmation
  return {
    message: 'Property deleted successfully',
    id: id
  };
}
```

**Important Checks:**
- ✅ Property exists
- ✅ No active investments
- ✅ Funding is exactly 0%
- ✅ Return appropriate errors

---

## 🔧 Frontend Current Status

### **Error Handling - Implemented** ✅

The frontend now shows **helpful error messages** for all 404 errors:

#### **Update Property (404):**
```
❌ Failed to update property

⚠️ Endpoint Not Found (404)

The backend endpoint PUT /properties/:id is not implemented yet.

📋 Backend Team To-Do:
1. Implement PUT /properties/:id endpoint
2. Accept full property data in request body
3. Update property in database
4. Return updated property data

💡 Current Status: Frontend is ready, waiting for backend implementation.
```

#### **Update Status (404):**
```
❌ Failed to update property status

⚠️ Endpoint Not Found (404)

The backend endpoint PATCH /properties/:id/status is not implemented yet.

📋 Backend Team To-Do:
1. Implement PATCH /properties/:id/status endpoint
2. Accept: { status, is_active, is_featured }
3. Return updated property data

💡 Workaround: Use the main Edit button to update property details.
```

#### **Delete Property (404):**
```
❌ Failed to delete property

⚠️ Endpoint Not Found (404)

The backend endpoint DELETE /properties/:id is not implemented yet.

📋 Backend Team To-Do:
1. Implement DELETE /properties/:id endpoint
2. Check if property has active investments
3. Prevent deletion if funded
4. Delete property from database
5. Return success confirmation

💡 Current Status: Frontend is ready with delete protection, waiting for backend implementation.
```

---

## ✅ Success Messages - Implemented

When operations succeed, users now see:

- ✅ **Create**: "Property created successfully!"
- ✅ **Update**: "Property updated successfully!"
- ✅ **Delete**: "Property deleted successfully!"
- ✅ **Status Update**: "Property status updated successfully!"

---

## 📊 Current Backend API Status

| Endpoint | Method | Status | Used For |
|----------|--------|--------|----------|
| `/properties` | GET | ✅ Working | List properties |
| `/properties/:id` | GET | ✅ Working | Get single property |
| `/properties` | POST | ✅ Working | Create property |
| `/properties/:id` | PUT | ❌ Missing | Update property |
| `/properties/:id/status` | PATCH | ❌ Missing | Update status |
| `/properties/:id` | DELETE | ❌ Missing | Delete property |

---

## 🚀 Quick Test Commands

### Test if endpoints exist:

```bash
# Test GET (should work)
curl https://hmr-backend.vercel.app/properties

# Test PUT (will return 404)
curl -X PUT https://hmr-backend.vercel.app/properties/{id} \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Property"}'

# Test PATCH status (will return 404)
curl -X PATCH https://hmr-backend.vercel.app/properties/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}'

# Test DELETE (will return 404)
curl -X DELETE https://hmr-backend.vercel.app/properties/{id}
```

---

## 💡 Workarounds

### **Until backend is ready:**

1. **Creating Properties**: ✅ **Works perfectly**
   - Use "Add Property" button
   - Fill the form
   - Click Save

2. **Viewing Properties**: ✅ **Works perfectly**
   - List shows all properties
   - Click property title to view details
   - All data displays correctly

3. **Editing Properties**: ❌ **Not working** (404 error)
   - Wait for `PUT /properties/:id` to be implemented
   - Or manually update in database

4. **Changing Status**: ❌ **Not working** (404 error)
   - Wait for `PATCH /properties/:id/status` to be implemented
   - Or manually update in database

5. **Deleting Properties**: ❌ **Not working** (404 error)
   - Wait for `DELETE /properties/:id` to be implemented
   - Or manually delete from database

---

## 📞 Message for Backend Team

### **Summary:**

The frontend Properties Management is **100% complete** with:
- ✅ Full CRUD UI
- ✅ All forms working
- ✅ Smart delete protection
- ✅ Field mapping for any backend format
- ✅ Comprehensive error handling
- ✅ Debug logging
- ✅ User-friendly messages

**We're just waiting for these 3 backend endpoints:**

1. `PUT /properties/:id` - Update property
2. `PATCH /properties/:id/status` - Update status/featured/active
3. `DELETE /properties/:id` - Delete property (with funding check)

**Frontend is production-ready and will work immediately once these endpoints are deployed!** 🚀

---

**Updated:** October 23, 2025
**Status:** Frontend Complete ✅ | Backend Endpoints Needed ⚠️




