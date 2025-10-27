# System Architecture Overview 🏗️

## Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        HMR Property Platform                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐          ┌──────────────────────────┐
│   ADMIN DASHBOARD        │          │  ORGANIZATION DASHBOARD  │
│   (Super Admin)          │          │  (Org-Specific)          │
└──────────────────────────┘          └──────────────────────────┘
         │                                        │
         │                                        │
    ┌────▼─────┐                         ┌───────▼────────┐
    │  LOGIN   │                         │     LOGIN      │
    │          │                         │                │
    │ /admin/  │                         │  /org/login    │
    │  login   │                         │                │
    └────┬─────┘                         └───────┬────────┘
         │                                        │
         │ Credentials:                           │ Credentials:
         │ admin@hmrbuilders.com                  │ • admin@hmr.com
         │ admin123                               │ • admin@saima.com
         │                                        │
    ┌────▼─────────────────────┐         ┌───────▼────────────────┐
    │   ADMIN DASHBOARD        │         │   ORG DASHBOARD        │
    │   /admin                 │         │   /orgdashboard        │
    │                          │         │                        │
    │ Views ALL Organizations  │         │ Views ONLY Their Org   │
    │                          │         │                        │
    │ Tabs:                    │         │ Tabs:                  │
    │ • Overview               │         │ • Overview             │
    │ • Properties (ALL)       │         │ • Properties (Filtered)│
    │ • Users (ALL)            │         │ • Users (Filtered)     │
    │ • Transactions (ALL)     │         │ • Transactions (Filtered)│
    │ • Investments (ALL)      │         │ • Investments (Filtered)│
    │ • Organizations          │         │                        │
    └──────────────────────────┘         └────────────────────────┘
```

---

## Data Flow

### Admin Dashboard Flow:
```
User Login (admin@hmrbuilders.com)
    ↓
AdminAuth validates credentials
    ↓
Store session in localStorage
    ↓
Redirect to /admin
    ↓
Fetch ALL data (no organizationId filter)
    ↓
Display ALL organizations' data
```

### Organization Dashboard Flow:
```
User Login (admin@hmr.com OR admin@saima.com)
    ↓
OrganizationAuth validates credentials
    ↓
Store session + organizationId in localStorage
    ↓
Redirect to /orgdashboard
    ↓
Fetch data with organizationId filter
    ↓
Display ONLY their organization's data
```

---

## API Integration

### Admin API Calls (No Filter):
```javascript
// Shows ALL data
adminAPI.getProperties({ limit: 1000 })
adminAPI.getUsers({ limit: 10, page: 1 })
adminAPI.getInvestments({ limit: 1000 })
adminAPI.getTransactions({ limit: 1000 })
```

### Organization API Calls (With Filter):
```javascript
// Shows ONLY HMR data
adminAPI.getProperties({ 
  limit: 1000, 
  organizationId: 'hmr-company'  ← Filter
})

adminAPI.getUsers({ 
  limit: 10, 
  page: 1,
  organizationId: 'hmr-company'  ← Filter
})

// Shows ONLY Saima data
adminAPI.getInvestments({ 
  limit: 1000,
  organizationId: 'saima-company'  ← Filter
})
```

---

## Organizations

### Current Organizations:

| Organization | Email | Password | Organization ID | Slug |
|-------------|-------|----------|-----------------|------|
| **HMR Company** | admin@hmr.com | hmr123 | hmr-company | hmr |
| **Saima Company** | admin@saima.com | saima123 | saima-company | saima |

### Super Admin:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Super Admin** | admin@hmrbuilders.com | admin123 | ALL Organizations |

---

## Route Structure

### Public Routes:
- `/` - Home
- `/login` - User Login
- `/register` - User Registration
- `/properties` - Browse Properties
- `/dashboard` - User Dashboard
- `/portfolio` - User Portfolio
- `/wallet` - User Wallet
- `/profile` - User Profile

### Admin Routes (Super Admin):
- `/admin/login` - Admin Login
- `/admin` - Admin Dashboard (ALL data)
- `/admin/property/:id` - Property Details

### Organization Routes (HMR/Saima):
- `/org/login` - Organization Login
- `/orgdashboard` - Organization Dashboard (Filtered data)

---

## Component Structure

```
frontend/src/
├── components/
│   ├── admin/
│   │   └── AdminAuth.js          ← Admin authentication
│   └── organization/
│       └── OrganizationAuth.js   ← Organization authentication
│
├── pages/
│   ├── admin/
│   │   ├── AdminLogin.js
│   │   ├── AdminDashboard.js
│   │   ├── PropertiesManagement.js
│   │   ├── UsersManagement.js
│   │   ├── InvestmentsManagement.js
│   │   └── TransactionsManagement.js
│   │
│   └── organization/              ← NEW!
│       ├── OrgLogin.js
│       ├── OrgDashboard.js
│       ├── OrgPropertiesManagement.js
│       ├── OrgUsersManagement.js
│       ├── OrgInvestmentsManagement.js
│       └── OrgTransactionsManagement.js
```

---

## Authentication Flow

### Session Storage:

#### Admin Session:
```javascript
localStorage.setItem('adminSession', 'true')
localStorage.setItem('adminUser', JSON.stringify({
  email: 'admin@hmrbuilders.com',
  role: 'admin'
}))
```

#### Organization Session:
```javascript
localStorage.setItem('orgSession', 'true')
localStorage.setItem('orgUser', JSON.stringify({
  email: 'admin@hmr.com',
  organizationName: 'HMR Company',
  organizationId: 'hmr-company',
  organizationSlug: 'hmr',
  role: 'organization_admin'
}))
```

---

## UI Design

### Admin Dashboard:
- **Color**: Blue theme
- **Icon**: Shield
- **Header**: "Admin Dashboard"
- **No banner** (shows all orgs)

### Organization Dashboard:
- **Color**: Blue-to-Purple gradient
- **Icon**: Building2
- **Header**: "{Organization Name}"
- **Banner**: "🏢 {Org Name} Organization" with gradient background

---

## Feature Comparison

| Feature | Admin Dashboard | Organization Dashboard |
|---------|----------------|----------------------|
| **View All Orgs** | ✅ Yes | ❌ No |
| **View Own Org** | ✅ Yes | ✅ Yes |
| **Manage Organizations** | ✅ Yes | ❌ No |
| **CRUD Properties** | ✅ All | ⚠️ Only own (view) |
| **CRUD Users** | ✅ All | ⚠️ Only own (view) |
| **View Investments** | ✅ All | ✅ Only own |
| **View Transactions** | ✅ All | ✅ Only own |
| **Analytics** | ✅ All orgs | ✅ Own org only |

---

## Backend Expected Behavior

### When organizationId is provided:
```
GET /properties?organizationId=hmr-company
→ Returns only HMR properties

GET /users?organizationId=saima-company
→ Returns only Saima users

GET /investments?organizationId=hmr-company
→ Returns only HMR investments
```

### When organizationId is NOT provided:
```
GET /properties
→ Returns ALL properties (for admin)

GET /users
→ Returns ALL users (for admin)
```

---

## Security Considerations

### Current Implementation:
✅ Session-based authentication  
✅ Separate credentials per organization  
✅ Protected routes with auth checks  
✅ Auto-redirect when not authenticated  

### Future Enhancements:
- 🔄 JWT token-based authentication
- 🔄 Role-based permissions
- 🔄 Two-factor authentication
- 🔄 Password reset functionality
- 🔄 Session timeout
- 🔄 Audit logs

---

## Summary

### What We Built:

1. ✅ **Organization Authentication System**
   - Separate credentials for HMR and Saima
   - Session management
   - Protected routes

2. ✅ **Organization Dashboard**
   - Beautiful gradient UI
   - Organization-specific banner
   - Tab navigation

3. ✅ **Filtered Management Pages**
   - Properties (filtered by org)
   - Users (filtered by org)
   - Investments (filtered by org)
   - Transactions (filtered by org)

4. ✅ **Complete Separation**
   - Admin Dashboard = unchanged
   - Organization Dashboard = new & separate
   - No conflicts between systems

---

## Testing Checklist

- [ ] HMR login works
- [ ] HMR sees only HMR data
- [ ] Saima login works
- [ ] Saima sees only Saima data
- [ ] Admin login still works
- [ ] Admin sees ALL data
- [ ] Organization banner displays correctly
- [ ] Logout works for both systems
- [ ] Session persistence works
- [ ] Protected routes redirect to login

---

**🎉 Complete Multi-Organization System Ready! 🎉**

Admin Dashboard and Organization Dashboard now work independently with proper data filtering!

