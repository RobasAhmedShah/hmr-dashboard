# 🏢 HMR Dashboard - Real Estate Investment Platform

A comprehensive admin dashboard and user portal for managing real estate investments, built with React and integrated with a NestJS backend.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Backend Integration](#backend-integration)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [API Integration](#api-integration)
- [Admin Dashboard](#admin-dashboard)
- [User Portal](#user-portal)
- [Environment Variables](#environment-variables)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

HMR Dashboard is a modern real estate investment platform that enables:
- **Investors** to browse properties, make investments, track portfolios, and manage wallets
- **Admins** to manage properties, users, transactions, investments, and analytics
- **Organizations** to list properties and track liquidity

The platform uses **tokenization** where properties are divided into tokens that investors can purchase, with automatic ROI distribution.

---

## ✨ Features

### 🔐 Admin Features
- **Dashboard Overview** - Real-time statistics and analytics
- **Property Management** - Create, view, edit properties with tokenization
- **User Management** - Manage users with auto-wallet/KYC/portfolio creation
- **Transaction Monitoring** - Track all deposits, withdrawals, and investments
- **Investment Tracking** - Monitor all investments across properties
- **Analytics** - Growth metrics and performance indicators

### 👥 User Features
- **Property Browsing** - View available properties with filtering
- **Investment** - Purchase property tokens with wallet balance
- **Portfolio** - Track investments, returns, and performance
- **Wallet Management** - Deposit funds, view balance, transaction history
- **KYC Verification** - Submit documents for verification
- **Payment Methods** - Add cards, bank accounts for deposits
- **ROI Tracking** - Automatic reward distribution and tracking

### 🏗️ Core Capabilities
- **Tokenization** - Properties divided into purchasable tokens
- **Auto-Creation** - User creation auto-generates wallet, KYC, portfolio
- **Event-Driven** - Async operations with event emitters
- **Pessimistic Locking** - Race condition prevention on investments
- **Transaction Traceability** - Full audit trail with entity tracking
- **Display Codes** - Human-readable IDs (USR-000001, PROP-000001)

---

## 🛠️ Tech Stack

### Frontend
- **React** 18.x - UI framework
- **React Router** 6.x - Navigation
- **React Query** - Server state management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client

### Backend
- **NestJS** - Node.js framework
- **PostgreSQL** - Database
- **Prisma** - ORM
- **TypeScript** - Language
- **Decimal.js** - Precise calculations
- **class-validator** - Validation
- **Vercel** - Hosting

---

## 📁 Project Structure

```
hmr-dashboard/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── admin/           # Admin-specific components
│   │   │   │   ├── AdminAuth.js
│   │   │   │   ├── PropertyForm.js
│   │   │   │   └── UserForm.js
│   │   │   ├── Layout/
│   │   │   │   ├── Header.js
│   │   │   │   └── Layout.js
│   │   │   └── ui/              # UI primitives
│   │   │       ├── Button.js
│   │   │       ├── Card.js
│   │   │       ├── Input.js
│   │   │       └── Badge.js
│   │   ├── contexts/            # React contexts
│   │   │   ├── AuthContext.js
│   │   │   └── UserContext.js
│   │   ├── pages/               # Page components
│   │   │   ├── admin/           # Admin pages
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── AdminLogin.js
│   │   │   │   ├── PropertiesManagement.js
│   │   │   │   ├── UsersManagement.js
│   │   │   │   ├── TransactionsManagement.js
│   │   │   │   └── InvestmentsManagement.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Portfolio.js
│   │   │   ├── Properties.js
│   │   │   └── Wallet.js
│   │   ├── services/            # API integration
│   │   │   ├── api.js           # API client
│   │   │   └── demoData.js
│   │   ├── utils/               # Utility functions
│   │   ├── App.js               # Root component
│   │   ├── index.js             # Entry point
│   │   └── index.css            # Global styles
│   ├── package.json
│   └── tailwind.config.js
├── API_INTEGRATION_GUIDE.md     # Detailed API integration guide
├── BACKEND_INTEGRATION_STATUS.md # Current integration status
├── BACKEND_API_REQUIREMENTS.md  # Backend requirements
├── QUICK_API_REFERENCE.md       # Quick API reference
└── README.md                    # This file
```

---

## 🔗 Backend Integration

### Backend Repository
- **Repository**: [https://github.com/robasahmedshah/hmr-backend](https://github.com/robasahmedshah/hmr-backend)
- **Deployed URL**: [https://hmr-backend.vercel.app](https://hmr-backend.vercel.app)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM

### Available Backend Endpoints

#### ✅ Fully Implemented & Working

**Organizations**
- `POST /organizations` - Create organization
- `GET /organizations` - List all organizations
- `GET /organizations/:id` - Get organization details
- `GET /organizations/:id/liquidity` - Get liquidity analytics
- `GET /organizations/:id/transactions` - Get organization transactions

**Users**
- `POST /admin/users` - Create user (auto-creates wallet, KYC, portfolio)
- `GET /admin/users` - List all users

**Properties**
- `POST /properties` - Create property with tokenization
- `GET /properties` - List all properties
- `GET /properties/:id` - Get property by ID or displayCode
- `GET /properties?slug=:slug` - Get property by slug
- `GET /properties?displayCode=:code` - Get property by display code

**Investments**
- `POST /investments` - Create investment (legacy)
- `POST /investments/invest` - Create investment (token-based)
- `GET /investments` - List all investments
- `GET /investments?userId=:id` - Get user investments
- `GET /investments/:id` - Get investment details

**Transactions**
- `GET /transactions` - List all transactions
- `GET /transactions/user/:userId` - Get user transactions

**Wallet**
- `POST /wallet/deposit` - Deposit funds
- `GET /wallet/user/:userId` - Get user wallet
- `GET /wallet` - List all wallets

**Portfolio**
- `GET /portfolio/user/:userId/detailed` - Get detailed portfolio

**Payment Methods**
- `POST /payment-methods` - Add payment method
- `GET /payment-methods?userId=:id` - Get user payment methods
- `GET /payment-methods/:id` - Get payment method
- `PATCH /payment-methods/:id/verify` - Verify payment method
- `PATCH /payment-methods/:id/default` - Set default payment method
- `DELETE /payment-methods/:id` - Delete payment method
- `POST /payment-methods/deposit` - Deposit via payment method

**KYC**
- `POST /kyc` - Submit/update KYC
- `GET /kyc` - List all KYC verifications
- `GET /kyc/user/:userId` - Get user KYC
- `GET /kyc/:id` - Get KYC by ID
- `PATCH /kyc/:id` - Update KYC status

**Rewards**
- `POST /rewards/distribute` - Distribute ROI to investors
- `GET /rewards` - List all rewards
- `GET /rewards?userId=:id` - Get user rewards
- `GET /rewards/:id` - Get reward details

#### ❌ Not Yet Implemented (Needed for Full Functionality)

**Admin Dashboard**
- `GET /admin/dashboard` - Dashboard statistics ⚠️
- `GET /admin/analytics` - Growth metrics ⚠️

**User CRUD**
- `GET /admin/users/:id` - Get single user ⚠️
- `PUT /admin/users/:id` - Update user ⚠️
- `DELETE /admin/users/:id` - Delete user ⚠️
- `PATCH /admin/users/:id/status` - Update user status ⚠️

**Property CRUD**
- `PUT /properties/:id` - Update property ⚠️
- `DELETE /properties/:id` - Delete property ⚠️
- `PATCH /properties/:id/status` - Update property status ⚠️

**Response Format**
- Pagination metadata on list endpoints ⚠️
- Transaction summary statistics ⚠️

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or yarn
- Backend deployed at [https://hmr-backend.vercel.app](https://hmr-backend.vercel.app)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/afrazalamjr/hmr-dashboard.git
   cd hmr-dashboard
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure environment**
   Create `frontend/.env` file:
   ```env
   REACT_APP_API_URL=https://hmr-backend.vercel.app
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

### Admin Access
- Navigate to `/admin/login`
- Use admin credentials (configure in AdminAuth.js)
- Default demo admin: 
  - Username: `admin`
  - Password: `admin123`

---

## 📜 Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

---

## 🔌 API Integration

### API Client Configuration

The frontend uses Axios with a centralized API client (`frontend/src/services/api.js`):

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hmr-backend.vercel.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### API Modules

**Admin API**
```javascript
import { adminAPI } from './services/api';

// Get all properties
const properties = await adminAPI.getProperties({ page: 1, limit: 10 });

// Create user (auto-creates wallet, KYC, portfolio)
const user = await adminAPI.createUser({
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  role: 'user'
});

// Get transactions
const transactions = await adminAPI.getTransactions({ page: 1 });

// Get investments
const investments = await adminAPI.getInvestments({ page: 1 });
```

**Properties API**
```javascript
import { propertiesAPI } from './services/api';

// List properties
const properties = await propertiesAPI.getAll();

// Get property by ID or displayCode
const property = await propertiesAPI.getById('PROP-000001');

// Create property
const newProperty = await propertiesAPI.create({
  organizationId: 'ORG-000001',
  title: 'Marina View Residences',
  slug: 'marina-view',
  type: 'residential',
  status: 'active',
  totalValueUSDT: 1000000,
  totalTokens: 1000,
  expectedROI: 10,
  city: 'Karachi',
  country: 'Pakistan'
});
```

**Investments API**
```javascript
import { investmentsAPI } from './services/api';

// Create investment
const investment = await investmentsAPI.create({
  userId: 'USR-000001',
  propertyId: 'PROP-000001',
  tokensToBuy: 2.5
});
```

**Wallet API**
```javascript
import { walletTransactionsAPI } from './services/api';

// Deposit funds
await walletTransactionsAPI.createDeposit({
  userId: 'USR-000001',
  amountUSDT: 5000
});

// Get user wallet
const wallet = await usersAPI.getWalletById('USR-000001');
```

### Data Flow Example

**Creating an Investment**
```
1. User selects property (PROP-000001)
2. Frontend calls: investmentsAPI.create({
     userId: 'USR-000001',
     propertyId: 'PROP-000001', 
     tokensToBuy: 2.5
   })
3. Backend (POST /investments/invest):
   - Locks wallet + property (pessimistic)
   - Validates available tokens & wallet balance
   - Calculates amount (2.5 * pricePerToken)
   - Decrements property.availableTokens
   - Decrements wallet.balanceUSDT
   - Credits organization.liquidityUSDT
   - Creates investment record (INV-000001)
   - Creates transaction record (TXN-000001)
   - Updates portfolio
   - Emits events
4. Frontend receives investment data
5. React Query refetches wallet, portfolio, property
6. UI updates automatically
```

---

## 👨‍💼 Admin Dashboard

### Features

**Overview Tab**
- Total users, properties, investments, transactions
- Growth metrics (users, properties, investments)
- Recent activity feed
- Quick stats cards

**Properties Management**
- ✅ List all properties with search, filter, sort
- ✅ Create new properties
- ✅ View property details
- ✅ Property count display
- ⚠️ Edit property (backend endpoint missing)
- ⚠️ Delete property (backend endpoint missing)
- ⚠️ Update status (backend endpoint missing)

**Users Management**
- ✅ List all users
- ✅ Create new users (auto-creates wallet, KYC, portfolio)
- ✅ View user details
- ⚠️ Edit user (backend endpoint missing)
- ⚠️ Delete user (backend endpoint missing)
- ⚠️ Update status (backend endpoint missing)

**Transactions Management**
- ✅ List all transactions with filters
- ✅ Search transactions
- ✅ Transaction count display
- ✅ View user details per transaction
- ⚠️ Summary statistics (needs backend response format)

**Investments Management**
- ✅ List all investments
- ✅ View investment details
- ✅ Filter by status
- ⚠️ Update status (backend endpoint missing)

### Access Control

Admin routes are protected by `AdminAuth` context:
```javascript
import { useAdminAuth } from '../../components/admin/AdminAuth';

const { isAuthenticated, adminUser, logout } = useAdminAuth();
```

---

## 👤 User Portal

### Features

**Home Page**
- Featured properties
- Platform overview
- Call-to-action

**Properties**
- Browse all properties
- Filter by type, location, price
- Search properties
- View property details with tokenization info

**Portfolio**
- Total investment value
- Current value & ROI
- Active investments list
- Rewards history
- Performance metrics

**Wallet**
- Current balance
- Deposit funds
- Transaction history
- Payment methods management

**Profile**
- Personal information
- KYC verification status
- Settings
- Activity history

---

## 🔐 Environment Variables

Create `frontend/.env`:

```env
# Backend API URL
REACT_APP_API_URL=https://hmr-backend.vercel.app

# Optional: Analytics
REACT_APP_GA_TRACKING_ID=your-tracking-id

# Optional: Feature Flags
REACT_APP_ENABLE_KYC=true
REACT_APP_ENABLE_PAYMENTS=true
```

---

## 📚 Documentation

This repository includes comprehensive documentation:

### Core Documentation
- **[README.md](./README.md)** (this file) - Project overview and setup
- **[API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)** - Detailed API integration guide
- **[BACKEND_INTEGRATION_STATUS.md](./BACKEND_INTEGRATION_STATUS.md)** - Current integration status
- **[QUICK_API_REFERENCE.md](./QUICK_API_REFERENCE.md)** - Quick API reference

### Backend Documentation
- **Backend Repo**: [https://github.com/robasahmedshah/hmr-backend](https://github.com/robasahmedshah/hmr-backend)
- **API Endpoints**: See `API_ENDPOINTS.md` in backend repo
- **Event-Driven Architecture**: See `EVENT_DRIVEN_ARCHITECTURE.md` in backend repo
- **Transaction Traceability**: See `TRANSACTION_TRACEABILITY.md` in backend repo

### Key Concepts

**Display Codes**
- Human-readable IDs for all entities
- Format: `PREFIX-XXXXXX` (e.g., USR-000001, PROP-000001)
- Auto-generated via PostgreSQL sequences
- Used interchangeably with UUIDs in API calls

**Tokenization**
- Properties divided into purchasable tokens
- `totalValueUSDT / totalTokens = pricePerTokenUSDT`
- `availableTokens` decrements on each investment
- Investors own `tokens` worth `tokens * pricePerTokenUSDT`

**Auto-Creation Flow**
- Creating a user automatically creates:
  1. User record (USR-XXXXXX)
  2. Wallet (balance: 0)
  3. KYC record (status: pending)
  4. Portfolio (all zeros)
- All in a single transaction

**Event-Driven Operations**
- Investments emit events for portfolio updates
- Deposits emit events for wallet updates
- Rewards emit events for balance updates
- Async processing with event emitters

**Pessimistic Locking**
- Critical operations lock database rows
- Prevents race conditions on investments
- Ensures data consistency

---

## 🔄 Workflow Examples

### Creating a Property Investment

```javascript
// 1. Create organization (one-time)
POST /organizations
{
  "name": "HMR Builders",
  "description": "Leading developer",
  "website": "https://hmrbuilders.com"
}
// Returns: ORG-000001

// 2. Create property
POST /properties
{
  "organizationId": "ORG-000001",
  "title": "Marina View Residences",
  "slug": "marina-view",
  "type": "residential",
  "status": "active",
  "totalValueUSDT": 1000000,
  "totalTokens": 1000,
  "expectedROI": 10,
  "city": "Karachi",
  "country": "Pakistan"
}
// Returns: PROP-000001
// Computed: pricePerTokenUSDT = 1000

// 3. Create user (auto-creates wallet, KYC, portfolio)
POST /admin/users
{
  "fullName": "Ali Khan",
  "email": "ali@example.com",
  "phone": "+92300123456",
  "role": "user"
}
// Returns: USR-000001
// Auto-creates: Wallet, KYC, Portfolio

// 4. Deposit funds
POST /wallet/deposit
{
  "userId": "USR-000001",
  "amountUSDT": 5000
}
// Wallet balance: 5000

// 5. Make investment
POST /investments/invest
{
  "userId": "USR-000001",
  "propertyId": "PROP-000001",
  "tokensToBuy": 2.5
}
// Investment created: INV-000001
// Tokens purchased: 2.5
// Amount deducted: 2500 (2.5 * 1000)
// Wallet balance: 2500 (5000 - 2500)
// Property availableTokens: 997.5 (1000 - 2.5)

// 6. Distribute ROI
POST /rewards/distribute
{
  "propertyId": "PROP-000001",
  "totalRoiUSDT": 100000
}
// User reward: 250 USDT (2.5/1000 * 100000)
// Wallet balance: 2750 (2500 + 250)
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow React best practices
- Use functional components with hooks
- Implement proper error handling
- Add PropTypes or TypeScript types
- Write meaningful commit messages
- Update documentation for new features

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Admin Dashboard Overview** - Statistics not showing (backend endpoint missing)
2. **Property Edit/Delete** - Buttons disabled (backend CRUD endpoints missing)
3. **User Edit/Delete** - Buttons disabled (backend CRUD endpoints missing)
4. **Pagination** - Limited functionality (backend needs pagination metadata)
5. **Transaction Summary** - No summary stats (backend response format)

### See Also
- [BACKEND_INTEGRATION_STATUS.md](./BACKEND_INTEGRATION_STATUS.md) for complete status
- [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md) for integration details

---

## 🔮 Roadmap

### Phase 1: Backend Completion (In Progress)
- [ ] Implement `/admin/dashboard` endpoint
- [ ] Implement `/admin/analytics` endpoint
- [ ] Add property CRUD operations (PUT, DELETE, PATCH)
- [ ] Add user CRUD operations (GET/:id, PUT, DELETE, PATCH)
- [ ] Add pagination metadata to all list endpoints
- [ ] Add transaction summary statistics

### Phase 2: Frontend Enhancement
- [ ] Add real-time notifications
- [ ] Implement advanced charts and analytics
- [ ] Add export functionality (CSV, PDF)
- [ ] Implement dark mode
- [ ] Add mobile responsiveness improvements

### Phase 3: Features
- [ ] Multi-language support
- [ ] Advanced filtering and search
- [ ] Property comparison tool
- [ ] Investment calculator
- [ ] Email notifications
- [ ] Document management system

---

## 📊 System Requirements

### Development
- Node.js 16.x or higher
- npm 8.x or higher
- 4GB RAM minimum
- Modern browser (Chrome, Firefox, Safari, Edge)

### Production
- Static hosting (Vercel, Netlify, etc.)
- CDN for assets
- HTTPS enabled
- Backend at https://hmr-backend.vercel.app

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Team

- **Frontend Developer**: [Afraz Alam](https://github.com/afrazalamjr)
- **Backend Developer**: [Robas Ahmed Shah](https://github.com/RobasAhmedShah)
- **Backend Contributor**: [Abdul Samad](https://github.com/itxsamad1)

---

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- React team for React and related libraries
- Tailwind CSS for the utility-first CSS framework
- All contributors and supporters

---

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

---

## 🔗 Links

- **Frontend Repository**: [https://github.com/afrazalamjr/hmr-dashboard](https://github.com/afrazalamjr/hmr-dashboard)
- **Backend Repository**: [https://github.com/robasahmedshah/hmr-backend](https://github.com/robasahmedshah/hmr-backend)
- **Live Backend**: [https://hmr-backend.vercel.app](https://hmr-backend.vercel.app)
- **Documentation**: [API Integration Guide](./API_INTEGRATION_GUIDE.md)

---

**Made with ❤️ by the HMR Team**

