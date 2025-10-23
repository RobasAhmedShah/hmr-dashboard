# Backend API Requirements - Priority Implementation Guide

## 🎯 **CRITICAL - Implement These First (Admin Dashboard Won't Work Without These)**

### 1. Dashboard Statistics API
**Endpoint:** `GET /admin/dashboard`

**Purpose:** Provides summary statistics for admin dashboard overview

**Response Schema:**
```typescript
{
  "success": true,
  "data": {
    "activeUsers": 150,           // Count of active users
    "totalUsers": 200,            // Total users (including inactive)
    "totalProperties": 25,        // Total properties
    "activeProperties": 20,       // Properties with status 'active'
    "totalInvestments": 5000000,  // Total PKR invested
    "activeTransactions": 45,     // Transactions this month
    "totalRevenue": 10000000,     // Total revenue
    "monthlyRevenue": 500000,     // This month's revenue
    "commissionEarned": 250000,   // Commission earned
    "fullyFundedProperties": 5,   // Properties at 100% funding
    "inProgressProperties": 15,   // Properties with partial funding
    "averageFunding": 67.5,       // Average funding percentage
    "recentActivity": [
      {
        "description": "New user registered: John Doe",
        "timestamp": "2024-01-20T10:30:00Z"
      },
      {
        "description": "Investment made in Property ABC",
        "timestamp": "2024-01-20T09:15:00Z"
      }
    ]
  }
}
```

**Implementation Notes:**
```javascript
// Example NestJS implementation
@Get('admin/dashboard')
async getDashboardStats() {
  const activeUsers = await this.usersRepository.count({ where: { is_active: true } });
  const totalUsers = await this.usersRepository.count();
  const totalProperties = await this.propertiesRepository.count();
  
  // Calculate total investments
  const investments = await this.investmentsRepository.find();
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.amountUSDT, 0);
  
  // Get recent activity from event logs or audit table
  const recentActivity = await this.getRecentActivityLogs(10);
  
  return {
    activeUsers,
    totalUsers,
    totalProperties,
    totalInvestments,
    // ... other fields
    recentActivity
  };
}
```

---

### 2. Analytics API
**Endpoint:** `GET /admin/analytics`

**Purpose:** Growth metrics and trends

**Response Schema:**
```typescript
{
  "success": true,
  "data": {
    "usersGrowth": "+12.5%",        // % change vs last period
    "propertiesGrowth": "+8.3%",
    "investmentsGrowth": "+25.7%",
    "transactionsGrowth": "+15.2%"
  }
}
```

**Implementation Notes:**
```javascript
// Calculate growth percentages
@Get('admin/analytics')
async getAnalytics() {
  const currentMonth = await this.getCurrentMonthMetrics();
  const lastMonth = await this.getLastMonthMetrics();
  
  const usersGrowth = this.calculateGrowth(currentMonth.users, lastMonth.users);
  const propertiesGrowth = this.calculateGrowth(currentMonth.properties, lastMonth.properties);
  
  return {
    usersGrowth: `${usersGrowth >= 0 ? '+' : ''}${usersGrowth.toFixed(1)}%`,
    propertiesGrowth: `${propertiesGrowth >= 0 ? '+' : ''}${propertiesGrowth.toFixed(1)}%`,
    // ...
  };
}

private calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
```

---

### 3. User CRUD Operations

#### Get Single User
**Endpoint:** `GET /admin/users/:id`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "user": {
      "id": "USR-000001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+923001234567",
      "role": "user",
      "is_active": true,
      "kyc_status": "verified",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z",
      "wallet": {
        "balance": 50000
      },
      "portfolio": {
        "totalInvestment": 100000,
        "activeInvestments": 5
      }
    }
  }
}
```

#### Update User
**Endpoint:** `PUT /admin/users/:id`

**Request Body:**
```typescript
{
  "fullName": "John Updated Doe",
  "email": "newemail@example.com",
  "phone": "+923001234567",
  "role": "admin"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "user": { /* updated user object */ }
  }
}
```

#### Delete User (Soft Delete)
**Endpoint:** `DELETE /admin/users/:id`

**Implementation:**
```javascript
@Delete('admin/users/:id')
async deleteUser(@Param('id') id: string) {
  // Soft delete - set is_active to false
  await this.usersRepository.update(id, { is_active: false });
  
  return {
    success: true,
    message: 'User deleted successfully'
  };
}
```

#### Update User Status
**Endpoint:** `PATCH /admin/users/:id/status`

**Request Body:**
```typescript
{
  "is_active": false
}
```

---

### 4. Property CRUD Operations

#### Get All Properties (Admin)
**Endpoint:** `GET /admin/properties?search=&status=&property_type=&page=1&limit=10&sort_by=created_at&sort_order=desc`

**Query Parameters:**
- `search` - Search in title, description, city
- `status` - Filter by status (active, coming-soon, construction, sold-out, etc.)
- `property_type` - Filter by type (residential, commercial, mixed-use)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort_by` - Sort field (created_at, title, pricing_total_value, pricing_expected_roi)
- `sort_order` - asc or desc

**Response:**
```typescript
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "PRP-000001",
        "title": "Luxury Apartment Complex",
        "description": "Modern apartments in DHA",
        "location_city": "Karachi",
        "location_state": "Sindh",
        "location_address": "123 Main St",
        "location_zip_code": "75500",
        "location_country": "Pakistan",
        "pricing_total_value": 50000000,
        "pricing_min_investment": 100000,
        "pricing_price_per_token": 1000,
        "pricing_expected_roi": 15.5,
        "tokenization_total_tokens": 50000,
        "tokenization_available_tokens": 30000,
        "property_type": "residential",
        "status": "active",
        "is_active": true,
        "is_featured": true,
        "image_url": "https://...",
        "slug": "luxury-apartment-complex",
        "organization_id": "ORG-000001",
        "created_at": "2024-01-10T08:00:00Z",
        "updated_at": "2024-01-20T10:30:00Z"
      }
    ],
    "pagination": {
      "totalPages": 5,
      "currentPage": 1,
      "totalProperties": 50,
      "hasPrev": false,
      "hasNext": true
    }
  }
}
```

**Implementation:**
```javascript
@Get('admin/properties')
async getAdminProperties(@Query() query: GetPropertiesDto) {
  const { search, status, property_type, page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = query;
  
  const queryBuilder = this.propertiesRepository.createQueryBuilder('property');
  
  if (search) {
    queryBuilder.where(
      '(property.title ILIKE :search OR property.description ILIKE :search OR property.city ILIKE :search)',
      { search: `%${search}%` }
    );
  }
  
  if (status) {
    queryBuilder.andWhere('property.status = :status', { status });
  }
  
  if (property_type) {
    queryBuilder.andWhere('property.property_type = :property_type', { property_type });
  }
  
  queryBuilder
    .orderBy(`property.${sort_by}`, sort_order.toUpperCase() as 'ASC' | 'DESC')
    .skip((page - 1) * limit)
    .take(limit);
  
  const [properties, total] = await queryBuilder.getManyAndCount();
  
  return {
    properties,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProperties: total,
      hasPrev: page > 1,
      hasNext: page < Math.ceil(total / limit)
    }
  };
}
```

#### Get Single Property
**Endpoint:** `GET /admin/properties/:id`

#### Get Property Details (with investments & stats)
**Endpoint:** `GET /admin/properties/:id/detail`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "property": { /* full property object */ },
    "investments": [
      {
        "id": "INV-000001",
        "userId": "USR-000001",
        "userName": "John Doe",
        "tokensToBuy": 1000,
        "amountUSDT": 1000000,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "statistics": {
      "totalInvestors": 15,
      "totalInvested": 20000000,
      "fundingPercentage": 40,
      "estimatedCompletion": "2025-06-30"
    }
  }
}
```

#### Update Property
**Endpoint:** `PUT /admin/properties/:id`

**Request Body:**
```typescript
{
  "title": "Updated Title",
  "description": "Updated description",
  "city": "Lahore",
  "status": "active",
  "property_type": "commercial",
  // ... other fields
}
```

#### Delete Property
**Endpoint:** `DELETE /admin/properties/:id`

**Implementation:**
```javascript
@Delete('admin/properties/:id')
async deleteProperty(@Param('id') id: string) {
  // Check if property has investments
  const investmentCount = await this.investmentsRepository.count({
    where: { propertyId: id }
  });
  
  if (investmentCount > 0) {
    throw new BadRequestException('Cannot delete property with active investments');
  }
  
  // Soft delete
  await this.propertiesRepository.update(id, { is_active: false });
  
  return {
    success: true,
    message: 'Property deleted successfully'
  };
}
```

#### Update Property Status
**Endpoint:** `PATCH /admin/properties/:id/status`

**Request Body:**
```typescript
{
  "status": "sold-out",
  "is_active": false,
  "is_featured": true
}
```

---

### 5. Investment & Transaction Admin Lists

#### Get All Investments
**Endpoint:** `GET /admin/investments?search=&status=&page=1&limit=10`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "investments": [
      {
        "id": "INV-000001",
        "userId": "USR-000001",
        "propertyId": "PRP-000001",
        "user": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "property": {
          "title": "Luxury Apartment",
          "city": "Karachi"
        },
        "tokensToBuy": 1000,
        "amountUSDT": 1000000,
        "status": "completed",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "totalPages": 10,
      "currentPage": 1,
      "totalInvestments": 100,
      "hasPrev": false,
      "hasNext": true
    }
  }
}
```

#### Get All Transactions
**Endpoint:** `GET /admin/transactions?search=&type=&status=&page=1&limit=10`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "TXN-000001",
        "userId": "USR-000001",
        "user": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "type": "deposit",
        "amount": 50000,
        "status": "completed",
        "description": "Wallet deposit",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "totalPages": 20,
      "currentPage": 1,
      "totalTransactions": 200,
      "hasPrev": false,
      "hasNext": true
    }
  }
}
```

---

## 🔐 **AUTHENTICATION APIS - High Priority**

### 1. User Registration
**Endpoint:** `POST /auth/register`

**Request:**
```typescript
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+923001234567",
  "password": "SecurePassword123!"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "USR-000001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+923001234567",
      "role": "user"
    }
  }
}
```

### 2. User Login
**Endpoint:** `POST /auth/login`

**Request:**
```typescript
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { /* user object */ }
  }
}
```

### 3. Get Current User
**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "user": { /* full user object with profile */ }
  }
}
```

### 4. Logout
**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 🏢 **PROPERTY PUBLIC APIS - Medium Priority**

### 1. Featured Properties
**Endpoint:** `GET /properties/featured`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "properties": [
      { /* property objects where is_featured = true */ }
    ]
  }
}
```

### 2. Property by Slug
**Endpoint:** `GET /properties/slug/:slug`

### 3. Property Statistics
**Endpoint:** `GET /properties/:id/stats`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "totalInvestors": 25,
    "fundingPercentage": 67.5,
    "totalInvested": 33750000,
    "remainingTokens": 16250,
    "estimatedCompletion": "2025-12-31"
  }
}
```

### 4. Filter Options
**Endpoint:** `GET /properties/filter-options`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "cities": ["Karachi", "Lahore", "Islamabad", "Rawalpindi"],
    "property_types": ["residential", "commercial", "mixed-use"],
    "price_ranges": [
      { "label": "Under 1M", "min": 0, "max": 1000000 },
      { "label": "1M - 5M", "min": 1000000, "max": 5000000 },
      { "label": "5M - 10M", "min": 5000000, "max": 10000000 },
      { "label": "Above 10M", "min": 10000000, "max": null }
    ]
  }
}
```

---

## 💼 **PORTFOLIO APIS - Medium Priority**

### 1. Portfolio Summary
**Endpoint:** `GET /portfolio/summary/:userId`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "totalInvestment": 500000,
    "currentValue": 575000,
    "totalROI": 15.0,
    "activeInvestments": 5,
    "totalProfit": 75000
  }
}
```

### 2. Portfolio Statistics (with growth)
**Endpoint:** `GET /portfolio/stats/:userId`

**Response:**
```typescript
{
  "success": true,
  "data": {
    "totalInvestment": 500000,
    "currentValue": 575000,
    "totalROI": 15.0,
    "activeInvestments": 5,
    "totalInvestmentChange": 12.5,      // % change from last month
    "currentValueChange": 8.3,
    "totalROIChange": 2.1,
    "activeInvestmentsChange": 1         // absolute change
  }
}
```

**Implementation:**
```javascript
@Get('portfolio/stats/:userId')
async getPortfolioStats(@Param('userId') userId: string) {
  const currentStats = await this.getCurrentPortfolioStats(userId);
  const lastMonthStats = await this.getLastMonthPortfolioStats(userId);
  
  return {
    ...currentStats,
    totalInvestmentChange: this.calculateGrowth(currentStats.totalInvestment, lastMonthStats.totalInvestment),
    currentValueChange: this.calculateGrowth(currentStats.currentValue, lastMonthStats.currentValue),
    totalROIChange: currentStats.totalROI - lastMonthStats.totalROI,
    activeInvestmentsChange: currentStats.activeInvestments - lastMonthStats.activeInvestments
  };
}
```

---

## 📦 **USER INVESTMENT APIS**

### 1. Get User Investments
**Endpoint:** `GET /investments/my-investments?page=1&limit=10`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "investments": [
      {
        "id": "INV-000001",
        "property": {
          "id": "PRP-000001",
          "title": "Luxury Apartment",
          "city": "Karachi",
          "image_url": "..."
        },
        "tokensToBuy": 1000,
        "investmentAmount": 1000000,
        "currentValue": 1150000,
        "roiPercentage": 15.0,
        "status": "active",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

### 2. Get Investment by ID
**Endpoint:** `GET /investments/:id`

### 3. Cancel Investment
**Endpoint:** `PATCH /investments/:id/cancel`

**Response:**
```typescript
{
  "success": true,
  "message": "Investment cancelled successfully"
}
```

---

## 🔧 **RESPONSE FORMAT MIDDLEWARE**

**All endpoints should return responses in this format:**

```typescript
// Success Response
{
  "success": true,
  "data": {
    // Single object or array
    // Can include pagination, summary, etc.
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional details
  }
}
```

**NestJS Implementation:**
```typescript
// response.interceptor.ts
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data: data
      }))
    );
  }
}

// exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus?.() || 500;
    
    response.status(status).json({
      success: false,
      error: {
        code: exception.code || 'INTERNAL_ERROR',
        message: exception.message,
        details: exception.details || {}
      }
    });
  }
}
```

---

## 🔒 **AUTHENTICATION MIDDLEWARE**

```typescript
// auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// admin.guard.ts
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user && user.role === 'admin';
  }
}

// Usage in controllers
@UseGuards(JwtAuthGuard, AdminGuard)
@Get('admin/dashboard')
async getDashboard() {
  // Only accessible to authenticated admins
}
```

---

## 📊 **DATABASE SCHEMA UPDATES NEEDED**

### Properties Table
Add these columns:
```sql
ALTER TABLE properties 
ADD COLUMN property_type VARCHAR(50) DEFAULT 'residential',
ADD COLUMN status VARCHAR(50) DEFAULT 'active',
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN pricing_min_investment DECIMAL(15,2) DEFAULT 100000,
ADD COLUMN tokenization_available_tokens INTEGER;
```

### Users Table
Add these columns:
```sql
ALTER TABLE users
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN kyc_status VARCHAR(50) DEFAULT 'pending';
```

### Create Activity Log Table
```sql
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 **IMPLEMENTATION PRIORITY**

### Week 1: Critical Admin Features
1. ✅ Dashboard statistics endpoint
2. ✅ Analytics endpoint
3. ✅ User CRUD operations
4. ✅ Property CRUD operations with filters

### Week 2: Authentication & User Features
1. ✅ JWT authentication system
2. ✅ Login/register endpoints
3. ✅ User profile endpoints
4. ✅ Portfolio statistics with growth

### Week 3: Public Features
1. ✅ Featured properties
2. ✅ Property search and filters
3. ✅ User investments list
4. ✅ Property statistics

### Week 4: Additional Features
1. ✅ KYC system
2. ✅ Payment methods
3. ✅ Support/contact system
4. ✅ Calculator endpoints

---

## 📝 **TESTING CHECKLIST**

- [ ] Dashboard loads without errors
- [ ] Can create, edit, delete users
- [ ] Can create, edit, delete properties
- [ ] Pagination works on all list endpoints
- [ ] Search and filters work correctly
- [ ] User can register and login
- [ ] User can view their portfolio
- [ ] User can make investments
- [ ] Admin can view all transactions
- [ ] Admin can view analytics

---

## 🚀 **DEPLOYMENT NOTES**

1. Update environment variables for production
2. Enable CORS for frontend domain
3. Set up proper rate limiting
4. Configure JWT secret securely
5. Set up database backups
6. Monitor API performance
7. Set up error logging (Sentry, etc.)

---

## 💡 **TIPS**

1. **Use DTOs**: Create Data Transfer Objects for all request/response validation
2. **Use Swagger**: Document all APIs with Swagger/OpenAPI
3. **Use Pagination**: Always paginate list endpoints
4. **Use Caching**: Cache frequently accessed data (Redis)
5. **Use Transactions**: Wrap multiple DB operations in transactions
6. **Use Logging**: Log all important operations
7. **Use Validation**: Validate all inputs using class-validator
8. **Use Error Handling**: Implement global exception filters
9. **Use Rate Limiting**: Protect APIs from abuse
10. **Use API Versioning**: Plan for future API changes

---

This document provides everything needed to implement the missing backend APIs. Start with the Critical section and work your way down.

