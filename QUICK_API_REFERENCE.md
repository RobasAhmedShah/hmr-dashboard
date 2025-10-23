# Quick API Reference - Frontend to Backend Mapping

## 🚀 **Currently Working APIs** ✅

| Frontend Call | Backend Endpoint | Method | Status | Notes |
|--------------|------------------|--------|--------|-------|
| `adminAPI.getUsers()` | `/admin/users` | GET | ✅ Works | Returns all users |
| `adminAPI.createUser()` | `/admin/users` | POST | ✅ Works | Auto-creates wallet, KYC, portfolio |
| `propertiesAPI.getAll()` | `/properties` | GET | ✅ Works | Get all properties |
| `propertiesAPI.create()` | `/properties` | POST | ✅ Works | Requires organizationId |
| `investmentsAPI.create()` | `/investments/invest` | POST | ✅ Works | Event-driven investment |
| `walletTransactionsAPI.createDeposit()` | `/wallet/deposit` | POST | ✅ Works | Event-driven deposit |
| `portfolioAPI.getPortfolio()` | `/portfolio/user/:userId/detailed` | GET | ✅ Works | Detailed portfolio |
| `adminAPI.getInvestments()` | `/investments` | GET | ✅ Works | All investments |
| `adminAPI.getTransactions()` | `/transactions` | GET | ✅ Works | All transactions |

---

## ❌ **Missing APIs - Need Backend Implementation**

### 🔴 **CRITICAL - Dashboard Won't Load**
| Frontend Call | Expected Backend Endpoint | Method | Priority | Impact |
|--------------|---------------------------|--------|----------|---------|
| `adminAPI.getDashboard()` | `/admin/dashboard` | GET | 🔴 Critical | Admin dashboard overview broken |
| `adminAPI.getAnalytics()` | `/admin/analytics` | GET | 🔴 Critical | Growth metrics missing |

### 🟠 **HIGH - Admin Features Broken**
| Frontend Call | Expected Backend Endpoint | Method | Priority | Impact |
|--------------|---------------------------|--------|----------|---------|
| `adminAPI.getUser(id)` | `/admin/users/:id` | GET | 🟠 High | Can't view single user |
| `adminAPI.updateUser(id, data)` | `/admin/users/:id` | PUT | 🟠 High | Can't edit users |
| `adminAPI.deleteUser(id)` | `/admin/users/:id` | DELETE | 🟠 High | Can't delete users |
| `adminAPI.updateUserStatus(id, data)` | `/admin/users/:id/status` | PATCH | 🟠 High | Can't activate/deactivate |
| `adminAPI.getProperties()` | `/admin/properties` | GET | 🟠 High | No admin filters |
| `adminAPI.getProperty(id)` | `/admin/properties/:id` | GET | 🟠 High | Can't view single property |
| `adminAPI.getPropertyDetail(id)` | `/admin/properties/:id/detail` | GET | 🟠 High | No detailed property view |
| `adminAPI.updateProperty(id, data)` | `/admin/properties/:id` | PUT | 🟠 High | Can't edit properties |
| `adminAPI.deleteProperty(id)` | `/admin/properties/:id` | DELETE | 🟠 High | Can't delete properties |
| `adminAPI.updatePropertyStatus(id, data)` | `/admin/properties/:id/status` | PATCH | 🟠 High | Can't change status |

### 🟡 **MEDIUM - User Features**
| Frontend Call | Expected Backend Endpoint | Method | Priority | Impact |
|--------------|---------------------------|--------|----------|---------|
| `authAPI.register()` | `/auth/register` | POST | 🟡 Medium | Users can't register |
| `authAPI.login()` | `/auth/login` | POST | 🟡 Medium | Users can't login |
| `authAPI.getCurrentUser()` | `/auth/me` | GET | 🟡 Medium | Can't get auth user |
| `usersAPI.getProfileById(id)` | `/users/profile/:userId` | GET | 🟡 Medium | No user profiles |
| `portfolioAPI.getSummary(userId)` | `/portfolio/summary/:userId` | GET | 🟡 Medium | No portfolio summary |
| `portfolioAPI.getStats(userId)` | `/portfolio/stats/:userId` | GET | 🟡 Medium | No growth metrics |
| `propertiesAPI.getFeatured()` | `/properties/featured` | GET | 🟡 Medium | No featured properties |
| `propertiesAPI.getBySlug(slug)` | `/properties/slug/:slug` | GET | 🟡 Medium | Can't get by slug |
| `investmentsAPI.getMyInvestments()` | `/investments/my-investments` | GET | 🟡 Medium | Users can't see investments |

---

## 🔄 **API Endpoint Differences**

### Investment Creation
**Frontend expects:**
```javascript
POST /investments
{
  userId: "USR-000001",
  propertyId: "PRP-000001", 
  tokensToBuy: 1000
}
```

**Backend has:**
```javascript
POST /investments/invest
{
  userId: "USR-000001",
  propertyId: "PRP-000001",
  tokensToBuy: 1000
}
```

**Solution:** Update frontend to use `/investments/invest`

---

### Wallet Deposit
**Frontend expects:**
```javascript
POST /wallet-transactions/deposit
{
  userId: "USR-000001",
  amountUSDT: 50000
}
```

**Backend has:**
```javascript
POST /wallet/deposit
{
  userId: "USR-000001",
  amountUSDT: 50000
}
```

**Solution:** Update frontend to use `/wallet/deposit`

---

### Portfolio Detailed
**Frontend expects:**
```javascript
GET /portfolio/:userId
```

**Backend has:**
```javascript
GET /portfolio/user/:userId/detailed
```

**Solution:** Update frontend route

---

### User Transactions
**Frontend expects:**
```javascript
GET /wallet-transactions/user/:userId
```

**Backend has:**
```javascript
GET /transactions/user/:userId
```

**Solution:** Update frontend route

---

## 📦 **Frontend API Service Updates Needed**

Update `frontend/src/services/api.js`:

```javascript
// INVESTMENTS - Update endpoint
export const investmentsAPI = {
  create: (investmentData) => api.post('/investments/invest', investmentData), // CHANGED
  // ... rest
};

// WALLET - Update endpoints
export const walletTransactionsAPI = {
  createDeposit: (depositData) => api.post('/wallet/deposit', depositData), // CHANGED
  getByUserId: (userId, params) => api.get(`/transactions/user/${userId}`, { params }), // CHANGED
  // ... rest
};

// PORTFOLIO - Update endpoints  
export const portfolioAPI = {
  getPortfolio: (userId) => api.get(`/portfolio/user/${userId}/detailed`), // CHANGED
  // ... rest
};
```

---

## 🏗️ **Organization Management - New Feature**

The backend has organization management that the frontend doesn't use yet:

```javascript
// Add to frontend/src/services/api.js
export const organizationsAPI = {
  getAll: () => api.get('/organizations'),
  getById: (id) => api.get(`/organizations/${id}`),
  getLiquidity: (id) => api.get(`/organizations/${id}/liquidity`),
  create: (data) => api.post('/organizations', data),
};
```

**Properties now require organizationId:**
```javascript
// When creating a property:
{
  "organizationId": "ORG-000001", // REQUIRED
  "title": "Property Name",
  // ... other fields
}
```

---

## 🎯 **Immediate Action Items**

### 1. Update Frontend API Routes (Do This Now)
Create this file to update the API calls:

**File:** `frontend/src/services/api-updates.js`
```javascript
import api from './api';

// Updated endpoints to match new backend
export const updatedInvestmentsAPI = {
  ...investmentsAPI,
  create: (investmentData) => api.post('/investments/invest', investmentData),
};

export const updatedWalletAPI = {
  ...walletTransactionsAPI,
  createDeposit: (depositData) => api.post('/wallet/deposit', depositData),
  getByUserId: (userId, params) => api.get(`/transactions/user/${userId}`, { params }),
};

export const updatedPortfolioAPI = {
  ...portfolioAPI,
  getPortfolio: (userId) => api.get(`/portfolio/user/${userId}/detailed`),
};
```

### 2. Backend - Implement Critical APIs (Priority Order)
1. `GET /admin/dashboard` - Dashboard stats
2. `GET /admin/analytics` - Growth metrics  
3. `GET /admin/users/:id` - Single user
4. `PUT /admin/users/:id` - Update user
5. `DELETE /admin/users/:id` - Delete user
6. `PATCH /admin/users/:id/status` - Update status
7. `GET /admin/properties` - Admin properties with filters
8. `PUT /admin/properties/:id` - Update property
9. `DELETE /admin/properties/:id` - Delete property
10. `POST /auth/login` - Authentication

### 3. Testing Checklist
- [ ] Update API base URL to `https://hmr-backend.vercel.app`
- [ ] Test user creation - should work ✅
- [ ] Test property creation - need organization first ⚠️
- [ ] Test investment creation - should work ✅
- [ ] Test wallet deposit - should work ✅
- [ ] Dashboard page - will show errors ❌
- [ ] Users management - partial (list works, edit/delete don't) ⚠️
- [ ] Properties management - partial (list works, edit/delete don't) ⚠️

---

## 🔐 **Authentication Flow**

### Current Status: ❌ Not Implemented
The frontend has auth code but backend doesn't have these endpoints:

```javascript
// Frontend expects:
POST /auth/register → ❌ Missing
POST /auth/login → ❌ Missing  
GET /auth/me → ❌ Missing
POST /auth/logout → ❌ Missing
```

### Workaround for Testing:
Currently using demo data and localStorage for user selection. No real authentication.

### When Backend Implements Auth:
1. Add JWT middleware
2. Implement login/register endpoints
3. Add Authorization header to all protected routes
4. Update frontend to use tokens

---

## 📊 **Response Format**

### Frontend Expects:
```javascript
{
  data: {
    data: [...],
    pagination: {...}
  }
}
```

### Backend Currently Returns:
Varies by endpoint, needs standardization

### Solution:
Add response transformation interceptor in backend

---

## 🛠️ **Property Schema Mapping**

### Backend Field Names → Frontend Expected Names

| Backend | Frontend | Notes |
|---------|----------|-------|
| `address` | `location_address` | Rename needed |
| `city` | `location_city` | Rename needed |
| `state` | `location_state` | Rename needed |
| `zipCode` | `location_zip_code` | Rename needed |
| `country` | `location_country` | Rename needed |
| `purchasePriceUSDT` | `pricing_total_value` | Rename needed |
| `totalTokens` | `tokenization_total_tokens` | Rename needed |
| `pricePerTokenUSDT` | `pricing_price_per_token` | Rename needed |
| `expectedROI` | `pricing_expected_roi` | Rename needed |
| `imageUrl` | `image_url` | Rename needed |

**Option 1:** Update backend to use frontend naming
**Option 2:** Transform data in frontend after API calls
**Option 3:** Add a DTO transformer in backend

---

## 💰 **Currency Handling**

### Backend: USDT (Tether)
### Frontend: PKR (Pakistan Rupees)

**Conversion needed:**
- 1 USDT ≈ 280 PKR (approximate)
- Add conversion rate configuration
- Transform amounts in responses

```javascript
// Add to frontend utils
const USDT_TO_PKR_RATE = 280;

export const convertUSDTtoPKR = (usdt) => usdt * USDT_TO_PKR_RATE;
export const convertPKRtoUSDT = (pkr) => pkr / USDT_TO_PKR_RATE;
```

---

## 📝 **ID Format**

### Backend Uses Formatted IDs:
- Users: `USR-000001`, `USR-000002`, ...
- Properties: `PRP-000001`, `PRP-000002`, ...
- Organizations: `ORG-000001`, `ORG-000002`, ...
- Investments: `INV-000001`, ...
- Transactions: `TXN-000001`, ...

### Frontend Compatible: ✅
No changes needed, frontend uses ID as string.

---

## ⚡ **Event-Driven Features**

Backend has event-driven architecture for:

1. **User Creation** → Auto creates Wallet, KYC, Portfolio
2. **Wallet Deposit** → Updates balance + Creates transaction
3. **Investment** → Updates portfolio + Organization liquidity + Transactions
4. **Reward Distribution** → Updates wallets + Portfolios + Transactions

Frontend doesn't need to change, just make the API call and backend handles the rest.

---

## 🎨 **Status Values**

### Property Status:
- `planning`
- `construction`  
- `active`
- `coming-soon`
- `on-hold`
- `sold-out`
- `completed`

### User KYC Status:
- `pending`
- `verified`
- `rejected`

### Investment Status:
- `pending`
- `completed`
- `cancelled`

### Transaction Status:
- `pending`
- `completed`
- `failed`

---

This quick reference should help you understand what's working, what's missing, and what needs to be updated!

