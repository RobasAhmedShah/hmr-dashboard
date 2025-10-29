# HMR Builders - Real Estate Tokenization Platform

A modern React-based frontend for the HMR Builders Real Estate Tokenization Platform with multi-organization support, admin dashboards, and comprehensive property investment management.

## 🚀 Project Overview

This platform enables:
- **Property Browsing**: Browse and filter real estate properties
- **Investment Management**: Track investments and portfolio performance
- **Multi-Organization Support**: Organizations can manage their own properties and investors
- **Admin Dashboard**: Super admin can manage all organizations, properties, users, and transactions
- **Organization Dashboard**: Organization-specific admins can view and manage their own data
- **Authentication**: Secure authentication system for admins and organization admins
- **Payment Integration**: Manage wallet deposits and transactions

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Tech Stack](#tech-stack)
4. [API Integration](#api-integration)
5. [Organization Management](#organization-management)
6. [Admin Dashboards](#admin-dashboards)
7. [Deployment](#deployment)
8. [Backend API Reference](#backend-api-reference)
9. [Development](#development)

---

## 🏁 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file (if needed):**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure environment variables in `.env.local` (if needed):**
   ```env
   REACT_APP_API_URL=https://hmr-backend.vercel.app
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

The application will open at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

---

## 📁 Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── admin/              # Admin-specific components
│   │   ├── AdminAuth.js
│   │   ├── PropertyForm.js
│   │   ├── UserForm.js
│   │   ├── CreateOrganizationModal.js
│   │   ├── EditOrganizationModal.js
│   │   ├── CredentialsModal.js
│   │   └── ResetPasswordModal.js
│   ├── organization/       # Organization-specific components
│   │   └── OrganizationAuth.js
│   ├── ui/                 # Basic UI components (Button, Input, Card, Badge, Select)
│   └── Layout/             # Layout components (Header, Layout)
├── contexts/               # React contexts
│   ├── AuthContext.js      # User authentication context
│   └── UserContext.js      # User data context
├── pages/                  # Page components
│   ├── admin/              # Admin dashboard pages
│   │   ├── AdminLogin.js
│   │   ├── AdminDashboard.js
│   │   ├── PropertiesManagement.js
│   │   ├── UsersManagement.js
│   │   ├── InvestmentsManagement.js
│   │   ├── TransactionsManagement.js
│   │   ├── OrganizationsManagement.js
│   │   └── PropertyDetail.js
│   ├── organization/       # Organization dashboard pages
│   │   ├── OrgLogin.js
│   │   ├── OrgDashboard.js
│   │   ├── OrgPropertiesManagement.js
│   │   ├── OrgUsersManagement.js
│   │   ├── OrgInvestmentsManagement.js
│   │   ├── OrgTransactionsManagement.js
│   │   └── OrgProfile.js
│   ├── Home.js             # Landing page
│   ├── Properties.js        # Public properties listing
│   ├── Login.js            # User login
│   ├── Register.js         # User registration
│   ├── Dashboard.js        # User dashboard
│   ├── Portfolio.js        # User portfolio
│   ├── Wallet.js           # User wallet
│   └── Profile.js          # User profile
├── services/               # API services
│   ├── api.js             # API client configuration and endpoints
│   └── demoData.js        # Demo data for development
├── utils/                 # Utility functions
│   ├── cn.js              # Class name utility (Tailwind merge)
│   └── formatLocation.js  # Location formatting utility
├── App.js                 # Main app component
└── index.js               # App entry point
```

---

## 🛠️ Tech Stack

- **React 18** - Frontend framework
- **React Router 6** - Client-side routing
- **React Query 3** - Data fetching and caching
- **React Hook Form** - Form handling
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **clsx & tailwind-merge** - Class name utilities

---

## 🔌 API Integration

### Backend Base URL

**Production Backend**: `https://hmr-backend.vercel.app`

All API calls are centralized in `src/services/api.js`.

### Key API Modules

1. **Admin API** (`adminAPI`)
   - User management (CRUD)
   - Properties management
   - Investments and transactions
   - Dashboard statistics

2. **Organization Admin API** (`orgAdminAPI`)
   - Organization management (CRUD)
   - Organization admin authentication
   - Password reset
   - Password change

3. **Properties API** (`propertiesAPI`)
   - Get all properties
   - Get property by ID
   - Create property

4. **Organizations API** (`organizationsAPI`)
   - Get all organizations
   - Get organization by ID
   - Get organization liquidity

5. **Investments API** (`investmentsAPI`)
   - Create investment
   - Get investments
   - Get investment analytics

6. **Wallet Transactions API** (`walletTransactionsAPI`)
   - Create deposit
   - Get user transactions

7. **Portfolio API** (`portfolioAPI`)
   - Get detailed portfolio
   - Get portfolio summary

---

## 🏢 Organization Management

### Overview

The platform supports a multi-organization architecture:

1. **Super Admin** (`admin@hmrbuilders.com`)
   - Can create, edit, delete organizations
   - Views ALL organizations' data
   - Manages organization admin credentials
   - Can reset organization admin passwords

2. **Organization Admin** (e.g., `admin@hmr.com`)
   - Views ONLY their organization's data
   - Manages their organization's properties
   - Views their organization's investors
   - Can change their own password

### Organization Creation Flow

1. **Super Admin** creates organization via Admin Dashboard → Organizations tab
2. System auto-generates admin credentials (or allows manual entry)
3. Credentials are displayed to super admin
4. Organization admin can log in at `/org/login`
5. Organization admin sees filtered data for their organization only

### Organization Management Features

- ✅ Create organization with auto-generated or manual credentials
- ✅ Edit organization details (name, description, website, logo)
- ✅ Reset organization admin password
- ✅ Delete organization (cascades to admin)
- ✅ View organization statistics (properties, investments, users)
- ✅ Display admin information (email, full name, last login)

### Organization Admin Features

- ✅ Login with organization-specific credentials
- ✅ View organization dashboard with filtered data
- ✅ Manage organization's properties
- ✅ View organization's investors
- ✅ View organization's investments and transactions
- ✅ Change password from profile page

---

## 👨‍💼 Admin Dashboards

### Super Admin Dashboard (`/admin`)

**Routes:**
- `/admin/login` - Admin login
- `/admin` - Main dashboard (overview)
- `/admin/properties` - All properties management
- `/admin/users` - All users management
- `/admin/investments` - All investments management
- `/admin/transactions` - All transactions management
- `/admin/organizations` - Organizations management
- `/admin/property/:id` - Property detail view

**Features:**
- View statistics for ALL organizations
- Manage all properties
- Manage all users
- Create and manage organizations
- View all investments and transactions
- Property detail page with comprehensive data

### Organization Dashboard (`/orgdashboard`)

**Routes:**
- `/org/login` - Organization admin login
- `/orgdashboard` - Organization dashboard (overview)
- `/orgdashboard/properties` - Organization's properties
- `/orgdashboard/users` - Organization's investors
- `/orgdashboard/investments` - Organization's investments
- `/orgdashboard/transactions` - Organization's transactions
- `/orgdashboard/profile` - Organization admin profile

**Features:**
- View statistics for OWN organization only
- Manage organization's properties
- View organization's investors
- View organization's investments and transactions
- Change password

---

## 🌐 Backend API Reference

### Working APIs

#### Admin Endpoints
- `GET /admin/users` - List all users
- `POST /admin/users` - Create user
- `GET /admin/investments` - List all investments
- `GET /admin/transactions` - List all transactions

#### Organization Admin Endpoints
- `POST /admin/organizations` - Create organization and admin
- `GET /admin/organizations` - List all organizations with admin info
- `PATCH /admin/organizations/:id` - Update organization
- `DELETE /admin/organizations/:id` - Delete organization
- `POST /admin/organizations/:id/reset-password` - Reset org admin password
- `POST /org/auth/login` - Organization admin login
- `PATCH /org/auth/change-password/:adminId` - Change org admin password

#### Properties Endpoints
- `GET /properties` - List all properties
- `GET /properties/:id` - Get property by ID
- `POST /properties` - Create property
- `GET /properties?org=ORG-000001` - Filter by organization

#### Investments Endpoints
- `GET /investments` - List all investments
- `POST /investments/invest` - Create investment
- `GET /investments/analytics/organization/:orgId` - Get org investment analytics

#### Transactions Endpoints
- `GET /transactions` - List all transactions
- `GET /transactions/user/:userId` - Get user transactions
- `GET /organizations/:id/transactions` - Get organization transactions

#### Wallet Endpoints
- `POST /wallet/deposit` - Create wallet deposit
- `GET /wallet/user/:userId` - Get user wallet

#### Portfolio Endpoints
- `GET /portfolio/user/:userId/detailed` - Get detailed portfolio

### API Response Handling

The frontend includes helper functions to handle various field name variations:

```javascript
// Investment amounts
getInvestmentAmount(investment) {
  return investment.amountUSDT || investment.amount_usdt || 
         investment.amount || investment.invested_amount || 0;
}

// Transaction amounts
getTransactionAmount(transaction) {
  return transaction.amountUSDT || transaction.amount_usdt || 
         transaction.amount || 0;
}

// Property values
getPropertyValue(property) {
  return property.totalValueUSDT || property.price || 
         property.purchasePriceUSDT || 0;
}
```

---

## 🔐 Authentication

### Admin Authentication

**Location**: `src/components/admin/AdminAuth.js`

**Flow:**
1. Admin logs in at `/admin/login`
2. Credentials stored in localStorage
3. Protected routes check for admin session
4. Auto-redirect to login if not authenticated

### Organization Admin Authentication

**Location**: `src/components/organization/OrganizationAuth.js`

**Flow:**
1. Organization admin logs in at `/org/login`
2. Backend validates credentials
3. Organization details fetched and stored
4. Session stored in localStorage
5. Protected routes check for organization session
6. Data filtered by organization ID

**Quick Login Buttons:**
- HMR Company: `admin@hmr.com`
- Saima Company: `admin@saima.com`

---

## 🎨 UI Components

### Reusable Components

All components are located in `src/components/ui/`:

- **Button** - Primary, secondary, outline variants
- **Input** - Text input with icon support
- **Card** - Container component
- **Badge** - Status badges (success, warning, error, info)
- **Select** - Dropdown select component

### Styling

- **Tailwind CSS** for utility-first styling
- **Custom color palette** for consistent theming
- **Responsive design** for mobile and desktop
- **Gradient backgrounds** for modern UI
- **Icon integration** using Lucide React

---

## 📊 Data Filtering

### Organization-Specific Filtering

Organization dashboards automatically filter data by `organizationId`:

```javascript
// Properties
GET /properties?org=ORG-000001

// Users (via investments analytics)
GET /investments/analytics/organization/ORG-000001

// Investments
GET /investments/analytics/organization/ORG-000001

// Transactions
GET /organizations/:orgId/transactions
```

### Admin Views

Admin dashboards fetch ALL data without filters:

```javascript
// All properties
GET /properties?limit=1000

// All users
GET /admin/users?limit=1000

// All investments
GET /investments?limit=1000

// All transactions
GET /transactions?limit=1000
```

---

## 🚀 Deployment

### Vercel Deployment

The backend is deployed on Vercel at: `https://hmr-backend.vercel.app`

### Build Configuration

The project uses Create React App with the following scripts:

- `npm start` - Development server
- `npm run build` - Production build
- `npm test` - Run tests
- `npm run eject` - Eject from CRA (not recommended)

### Environment Variables

If needed, create `.env.local` with:

```env
REACT_APP_API_URL=https://hmr-backend.vercel.app
```

---

## 🧪 Development

### Available Scripts

- `npm start` - Start development server on port 3000
- `npm run build` - Build for production (creates `build/` folder)
- `npm test` - Run tests in watch mode
- `npm run eject` - Eject from Create React App

### Development Workflow

1. Start development server: `npm start`
2. Make changes to source files
3. Hot reload will update the browser automatically
4. Test features in development
5. Build for production: `npm run build`

### Code Organization

- **Components**: Reusable UI components
- **Pages**: Full page components
- **Services**: API calls and data fetching
- **Contexts**: Global state management
- **Utils**: Helper functions

---

## 📝 Important Notes

### Field Name Variations

The backend may return data with different field names. The frontend includes fallback logic to handle:
- `amountUSDT`, `amount_usdt`, `amount`
- `pricePerTokenUSDT`, `pricePerToken`, `price_per_token`
- `totalValueUSDT`, `totalValue`, `price`
- `property.title` vs `property.name`
- `property.city` vs `property.location`

### Status Values

**Property Status:**
- `planning`, `construction`, `active`, `coming-soon`, `on-hold`, `sold-out`, `completed`

**Investment Status:**
- `pending`, `completed`, `cancelled`

**Transaction Status:**
- `pending`, `completed`, `failed`

**Transaction Types:**
- `Inflow`, `Outflow`, `Deposit`, `Withdrawal`, `Investment`, `Reward`

### Currency

- Backend uses **USDT** (Tether)
- Display can be in PKR (Pakistan Rupees) with conversion
- Conversion rate: ~280 PKR per USDT (approximate)

---

## 🔧 Troubleshooting

### Build Errors

If you encounter build errors:

1. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Node.js version:**
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```

3. **Check for missing dependencies:**
   ```bash
   npm install
   ```

### API Connection Issues

1. Verify backend is running: `https://hmr-backend.vercel.app`
2. Check network tab in browser DevTools
3. Verify API base URL in `src/services/api.js`
4. Check CORS configuration on backend

### Organization Data Not Showing

1. Verify organization admin is logged in
2. Check `organizationId` in localStorage
3. Verify API calls include organization filter
4. Check backend API responses in network tab

---

## 📚 Additional Resources

- **React Documentation**: https://react.dev
- **React Router**: https://reactrouter.com
- **React Query**: https://tanstack.com/query
- **Tailwind CSS**: https://tailwindcss.com
- **Lucide Icons**: https://lucide.dev

---

## 🎯 Future Enhancements

- [ ] JWT token-based authentication
- [ ] User authentication system
- [ ] Role-based permissions
- [ ] Two-factor authentication
- [ ] Real-time notifications
- [ ] Advanced analytics and reporting
- [ ] KYC system integration
- [ ] Payment gateway integration
- [ ] Dark mode support

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Support

For issues or questions:
1. Check this README for common solutions
2. Review the API documentation
3. Check browser console for errors
4. Verify backend API status

---

**Last Updated**: October 2025

**Version**: 1.0.0

**Status**: ✅ Production Ready