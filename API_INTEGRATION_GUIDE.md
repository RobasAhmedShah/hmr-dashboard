# HMR Dashboard - Backend API Integration Guide

## 🔗 Backend URL
**Deployed Backend**: https://hmr-backend.vercel.app/

---

## 📊 **API MAPPING - Frontend to Backend**

### ✅ **APIs ALREADY AVAILABLE in New Backend**

#### 1. **User Management**
| Frontend Endpoint | New Backend Endpoint | Status | Notes |
|------------------|---------------------|---------|-------|
| `POST /admin/users` | `POST /admin/users` | ✅ Available | Create user with auto wallet/KYC/portfolio |
| `GET /admin/users` | `GET /admin/users` | ✅ Available | Get all users (admin) |

#### 2. **Organizations**
| Frontend Endpoint | New Backend Endpoint | Status | Notes |
|------------------|---------------------|---------|-------|
| N/A | `POST /organizations` | ✅ Available | New feature in backend |
| N/A | `GET /organizations` | ✅ Available | New feature in backend |
| N/A | `GET /organizations/:id/liquidity` | ✅ Available | New feature in backend |

#### 3. **Properties**
| Frontend Endpoint | New Backend Endpoint | Status | Notes |
|------------------|---------------------|---------|-------|
| `POST /admin/properties` | `POST /properties` | ✅ Available | Create property (needs org ID) |
| `GET /admin/properties` | `GET /properties` | ✅ Available | Get all properties |
| `GET /properties` | `GET /properties` | ✅ Available | Public properties list |

#### 4. **Investments**
| Frontend Endpoint | New Backend Endpoint | Status | Notes |
|------------------|---------------------|---------|-------|
| `POST /investments` | `POST /investments/invest` | ✅ Available | Create investment (event-driven) |
| `GET /admin/investments` | `GET /investments` | ✅ Available | Get all investments |

#### 5. **Wallet Operations**
| Frontend Endpoint | New Backend Endpoint | Status | Notes |
|------------------|---------------------|---------|-------|
| `POST /wallet-transactions/deposit` | `POST /wallet/deposit` | ✅ Available | Wallet deposit (event-driven) |
| `GET /users/wallet/:userId` | `GET /wallet/user/:userId` | ✅ Available | Get user wallet balance |

#### 6. **Transactions**
| Frontend Endpoint | New Backend Endpoint | Status | Notes |
|------------------|---------------------|---------|-------|
| `GET /admin/transactions` | `GET /transactions` | ✅ Available | Get all transactions |
| `GET /wallet-transactions/user/:userId` | `GET /transactions/user/:userId` | ✅ Available | Get user transactions |

#### 7. **Portfolio**
| Frontend Endpoint | New Backend Endpoint | Status | Notes |
|------------------|---------------------|---------|-------|
| `GET /portfolio/:userId` | `GET /portfolio/user/:userId/detailed` | ✅ Available | Get detailed portfolio |

#### 8. **Rewards**
| Frontend Endpoint | New Backend Endpoint | Status | Notes |
|------------------|---------------------|---------|-------|
| N/A | `POST /rewards/distribute` | ✅ Available | New feature - distribute ROI |
| N/A | `GET /rewards` | ✅ Available | Get all rewards |

---

## ❌ **MISSING APIs - Need to be Added to Backend**

### 🔴 **HIGH PRIORITY - Required for Admin Dashboard**

#### 1. **Dashboard & Analytics APIs**
```javascript
// These are CRITICAL for the admin dashboard overview page
GET /admin/dashboard
  Response: {
    activeUsers: number,
    totalUsers: number,
    totalProperties: number,
    activeProperties: number,
    totalInvestments: number (PKR),
    activeTransactions: number,
    totalRevenue: number,
    monthlyRevenue: number,
    commissionEarned: number,
    fullyFundedProperties: number,
    inProgressProperties: number,
    averageFunding: number (percentage),
    recentActivity: [
      {
        description: string,
        timestamp: datetime
      }
    ]
  }

GET /admin/analytics
  Response: {
    usersGrowth: string (e.g., "+12%"),
    propertiesGrowth: string,
    investmentsGrowth: string,
    transactionsGrowth: string
  }
```

#### 2. **User Management - Individual Operations**
```javascript
// Get single user details
GET /admin/users/:id
  Response: { user: {...} }

// Update user
PUT /admin/users/:id
  Body: {
    fullName?: string,
    email?: string,
    phone?: string,
    role?: string
  }

// Delete user (soft delete)
DELETE /admin/users/:id
  Response: { message: "User deleted successfully" }

// Update user status
PATCH /admin/users/:id/status
  Body: {
    is_active: boolean
  }
```

#### 3. **Property Management - Admin Operations**
```javascript
// Get all properties (admin filtered view)
GET /admin/properties?search=&status=&property_type=&page=1&limit=10
  Response: {
    properties: [...],
    pagination: {
      totalPages: number,
      currentPage: number,
      totalProperties: number
    }
  }

// Get single property
GET /admin/properties/:id
  Response: { property: {...} }

// Get detailed property info
GET /admin/properties/:id/detail
  Response: {
    property: {...},
    investments: [...],
    statistics: {...}
  }

// Update property
PUT /admin/properties/:id
  Body: {
    title?: string,
    description?: string,
    address?: string,
    city?: string,
    state?: string,
    zipCode?: string,
    country?: string,
    purchasePriceUSDT?: number,
    totalTokens?: number,
    pricePerTokenUSDT?: number,
    expectedROI?: number,
    imageUrl?: string,
    slug?: string,
    status?: string,
    property_type?: string
  }

// Delete property (soft delete, only if no investments)
DELETE /admin/properties/:id
  Response: { message: "Property deleted successfully" }

// Update property status
PATCH /admin/properties/:id/status
  Body: {
    status?: string,
    is_active?: boolean,
    is_featured?: boolean
  }
```

#### 4. **Investment Management - Admin View**
```javascript
// Get all investments with filters
GET /admin/investments?search=&status=&page=1&limit=10
  Response: {
    investments: [...],
    pagination: {
      totalPages: number,
      currentPage: number,
      totalInvestments: number
    }
  }
```

#### 5. **Transaction Management - Admin View**
```javascript
// Get all transactions with filters
GET /admin/transactions?search=&type=&status=&page=1&limit=10
  Response: {
    transactions: [...],
    pagination: {
      totalPages: number,
      currentPage: number,
      totalTransactions: number
    }
  }
```

---

### 🟡 **MEDIUM PRIORITY - User Features**

#### 6. **Authentication APIs**
```javascript
// User registration
POST /auth/register
  Body: {
    fullName: string,
    email: string,
    phone: string,
    password: string
  }

// User login
POST /auth/login
  Body: {
    email: string,
    password: string
  }
  Response: {
    token: string,
    user: {...}
  }

// Get current authenticated user
GET /auth/me
  Headers: { Authorization: "Bearer <token>" }
  Response: { user: {...} }

// Logout
POST /auth/logout
```

#### 7. **User Profile APIs**
```javascript
// Get user profile
GET /users/profile/:userId
  Response: { profile: {...} }

// Update user profile
PUT /users/profile
  Body: {
    firstName?: string,
    lastName?: string,
    phone?: string,
    address?: object
  }

// Get user holdings/investments
GET /users/holdings
  Response: { holdings: [...] }
```

#### 8. **Property Public APIs**
```javascript
// Get featured properties
GET /properties/featured
  Response: { properties: [...] }

// Get property by slug
GET /properties/slug/:slug
  Response: { property: {...} }

// Get property by ID
GET /properties/:id
  Response: { property: {...} }

// Get property statistics
GET /properties/:id/stats
  Response: {
    totalInvestors: number,
    fundingPercentage: number,
    estimatedCompletion: date
  }

// Get filter options (for search/filter UI)
GET /properties/filter-options
  Response: {
    cities: string[],
    property_types: string[],
    price_ranges: object[]
  }
```

#### 9. **Investment User APIs**
```javascript
// Get user's investments
GET /investments/my-investments?page=1&limit=10
  Headers: { Authorization: "Bearer <token>" }
  Response: {
    investments: [...],
    pagination: {...}
  }

// Get investment by ID
GET /investments/:id
  Response: { investment: {...} }

// Cancel investment (if allowed)
PATCH /investments/:id/cancel
  Response: { message: "Investment cancelled" }
```

#### 10. **Portfolio APIs**
```javascript
// Get portfolio summary
GET /portfolio/summary/:userId
  Response: {
    totalInvestment: number,
    currentValue: number,
    totalROI: number,
    activeInvestments: number
  }

// Get portfolio statistics (with growth metrics)
GET /portfolio/stats/:userId
  Response: {
    totalInvestment: number,
    currentValue: number,
    totalROI: number,
    activeInvestments: number,
    totalInvestmentChange: number,
    currentValueChange: number,
    totalROIChange: number,
    activeInvestmentsChange: number
  }
```

---

### 🟢 **LOW PRIORITY - Additional Features**

#### 11. **KYC APIs**
```javascript
// Submit KYC
POST /kyc/submit
  Body: {
    userId: string,
    documentType: string,
    documentNumber: string,
    images: string[]
  }

// Get KYC status
GET /kyc/status/:userId
  Response: {
    status: "pending" | "verified" | "rejected",
    documents: [...]
  }

// Update KYC status (admin)
PATCH /kyc/update-status/:kycId
  Body: {
    status: string,
    notes?: string
  }
```

#### 12. **Payment Methods**
```javascript
// Get user payment methods
GET /payment-methods?userId=:userId
  Response: { paymentMethods: [...] }

// Add payment method
POST /payment-methods
  Body: {
    userId: string,
    type: string,
    details: object
  }

// Delete payment method
DELETE /payment-methods/:id
```

#### 13. **Support/Contact APIs**
```javascript
// Submit contact form
POST /support/contact
  Body: {
    name: string,
    email: string,
    message: string
  }

// Get FAQs
GET /support/faq
  Response: { faqs: [...] }
```

#### 14. **Calculator APIs**
```javascript
// Calculate ROI
POST /calculator/roi
  Body: {
    investmentAmount: number,
    expectedROI: number,
    timeframe: number
  }
  Response: {
    projectedReturn: number,
    totalValue: number
  }

// Calculate investment options
POST /calculator/investment
  Body: {
    propertyId: string,
    amount: number
  }
  Response: {
    tokens: number,
    expectedMonthlyReturn: number,
    totalReturn: number
  }
```

---

## 🔧 **BACKEND MODIFICATIONS NEEDED**

### 1. **API Response Format Standardization**
The frontend expects responses in this format:
```javascript
{
  data: {
    data: [...], // or single object
    pagination: {
      totalPages: number,
      currentPage: number,
      totalRecords: number,
      hasPrev: boolean,
      hasNext: boolean
    },
    summary: {} // optional
  }
}
```

### 2. **Admin Routes Namespace**
Create `/admin/*` routes for administrative operations with proper authentication:
- `/admin/dashboard`
- `/admin/analytics`
- `/admin/users/*`
- `/admin/properties/*`
- `/admin/investments`
- `/admin/transactions`

### 3. **Query Parameter Support**
Add support for filtering and pagination:
- `?search=` - text search across relevant fields
- `?page=1&limit=10` - pagination
- `?sort_by=field&sort_order=asc|desc` - sorting
- `?status=` - filter by status
- `?property_type=` - filter by type
- `?include_inactive=true` - include soft-deleted records

### 4. **Authentication & Authorization**
Implement:
- JWT-based authentication
- Role-based access control (admin vs user)
- Protected routes middleware
- Admin-only endpoints

### 5. **Property Schema Adjustments**
Map your backend fields to frontend expectations:

**Backend → Frontend Mapping:**
```javascript
{
  // Backend fields          → Frontend expected fields
  organizationId              → organization_id
  title                       → title ✓
  description                 → description ✓
  address                     → location_address
  city                        → location_city
  state                       → location_state
  zipCode                     → location_zip_code
  country                     → location_country
  purchasePriceUSDT           → pricing_total_value
  totalTokens                 → tokenization_total_tokens
  pricePerTokenUSDT           → pricing_price_per_token
  expectedROI                 → pricing_expected_roi
  imageUrl                    → image_url
  slug                        → slug ✓
  // Add these fields:
  property_type               → residential/commercial/mixed-use
  status                      → active/coming-soon/construction/sold-out
  is_active                   → boolean
  is_featured                 → boolean
  pricing_min_investment      → minimum investment amount
  tokenization_available_tokens → remaining tokens for sale
}
```

### 6. **User Schema Adjustments**
```javascript
{
  // Backend                  → Frontend
  fullName                    → name
  email                       → email ✓
  phone                       → phone ✓
  role                        → role ✓
  // Add these:
  is_active                   → boolean
  kyc_status                  → "pending"|"verified"|"rejected"
  created_at                  → ISO datetime
  updated_at                  → ISO datetime
}
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### Phase 1: Critical Admin Features ⚡
- [ ] `GET /admin/dashboard` - Dashboard statistics
- [ ] `GET /admin/analytics` - Growth metrics
- [ ] `GET /admin/users/:id` - Single user details
- [ ] `PUT /admin/users/:id` - Update user
- [ ] `DELETE /admin/users/:id` - Delete user
- [ ] `PATCH /admin/users/:id/status` - Update user status
- [ ] `GET /admin/properties` - Admin properties list with filters
- [ ] `GET /admin/properties/:id` - Single property
- [ ] `PUT /admin/properties/:id` - Update property
- [ ] `DELETE /admin/properties/:id` - Delete property
- [ ] `PATCH /admin/properties/:id/status` - Update property status

### Phase 2: User Authentication & Profile 🔐
- [ ] `POST /auth/register` - User registration
- [ ] `POST /auth/login` - User login
- [ ] `GET /auth/me` - Get current user
- [ ] `POST /auth/logout` - Logout
- [ ] `GET /users/profile/:userId` - Get profile
- [ ] `PUT /users/profile` - Update profile

### Phase 3: Property & Investment Features 🏢
- [ ] `GET /properties/featured` - Featured properties
- [ ] `GET /properties/slug/:slug` - Property by slug
- [ ] `GET /properties/:id` - Property details
- [ ] `GET /properties/:id/stats` - Property statistics
- [ ] `GET /investments/my-investments` - User investments
- [ ] `GET /portfolio/summary/:userId` - Portfolio summary
- [ ] `GET /portfolio/stats/:userId` - Portfolio stats with growth

### Phase 4: Additional Features 🎯
- [ ] KYC APIs
- [ ] Payment Methods APIs
- [ ] Support/Contact APIs
- [ ] Calculator APIs
- [ ] Wallet withdrawal APIs
- [ ] Notifications APIs

---

## 🚀 **QUICK START - Testing with Current Backend**

### 1. Update Frontend Environment
Create `.env` file in frontend directory:
```env
REACT_APP_API_URL=https://hmr-backend.vercel.app
```

### 2. Test Available Endpoints
You can immediately test these working endpoints:

```javascript
// Create a test user
POST https://hmr-backend.vercel.app/admin/users
{
  "fullName": "Test User",
  "email": "test@example.com",
  "phone": "+1234567890",
  "role": "user"
}

// Create organization (needed for properties)
POST https://hmr-backend.vercel.app/organizations
{
  "name": "Test Organization",
  "description": "Test org",
  "website": "https://test.org",
  "logoUrl": "https://test.org/logo.png"
}

// Create property
POST https://hmr-backend.vercel.app/properties
{
  "organizationId": "ORG-000001",
  "title": "Test Property",
  "description": "Test description",
  "address": "123 Main St",
  "city": "Karachi",
  "state": "Sindh",
  "zipCode": "12345",
  "country": "Pakistan",
  "purchasePriceUSDT": 100000,
  "totalTokens": 100000,
  "pricePerTokenUSDT": 1,
  "expectedROI": 0.1,
  "imageUrl": "https://example.com/image.jpg",
  "slug": "test-property"
}
```

### 3. Missing Features Workaround
For now, the admin dashboard will show errors for:
- Dashboard statistics (`/admin/dashboard`)
- Analytics (`/admin/analytics`)
- Individual user/property operations

These need to be implemented in the backend first.

---

## 📝 **NOTES**

1. **Currency**: Frontend uses PKR, backend uses USDT - decide on conversion strategy
2. **Event-Driven Architecture**: Current backend uses events for wallet/portfolio updates
3. **ID Format**: Backend uses formatted IDs (USR-000001, PRP-000001, ORG-000001)
4. **Soft Delete**: Both systems should support soft deletes (`is_active` flag)
5. **Timestamps**: Use ISO 8601 format for all datetime fields

---

## 🔗 **API Documentation Links**

- **Backend Deployment**: https://hmr-backend.vercel.app/
- **API Base URL**: `https://hmr-backend.vercel.app`
- **No trailing `/api`** in the base URL (unlike previous backend)

---

## 🎯 **PRIORITY RECOMMENDATION**

**Immediate Action Items:**
1. ✅ Update frontend API base URL (DONE)
2. ⚠️ Implement `/admin/dashboard` and `/admin/analytics` endpoints
3. ⚠️ Add CRUD operations for admin user/property management
4. ⚠️ Implement authentication system
5. ⚠️ Add response format standardization middleware

This will allow the admin dashboard to work fully while you gradually add the remaining features.

