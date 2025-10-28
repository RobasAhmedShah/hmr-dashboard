import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hmr-backend.vercel.app';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (no auth needed for demo)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (no auth redirects)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  registerWithPayment: (userData) => api.post('/auth/register-with-payment', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  googleAuth: (googleData) => api.post('/auth/google', googleData),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// Properties API (Complete)
export const propertiesAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getFeatured: () => api.get('/properties/featured'),
  getBySlug: (slug) => api.get(`/properties/slug/${slug}`),
  getById: (id) => api.get(`/properties/${id}`),
  getStats: (id) => api.get(`/properties/${id}/stats`),
  getFilterOptions: () => api.get('/properties/filter-options'),
  create: (propertyData) => api.post('/properties', propertyData),
  update: (id, propertyData) => api.put(`/properties/${id}`, propertyData),
  delete: (id) => api.delete(`/properties/${id}`),
};

// Investments API (Complete)
export const investmentsAPI = {
  create: (investmentData) => api.post('/investments/invest', investmentData), // Updated for new backend
  getMyInvestments: (params) => api.get('/investments/my-investments', { params }),
  getByUserId: (userId) => api.get(`/investments/user/${userId}`),
  getById: (id) => api.get(`/investments/${id}`),
  updateStatus: (id, status) => api.patch(`/investments/${id}/status`, { status }),
  cancel: (id) => api.patch(`/investments/${id}/cancel`),
  getPortfolioSummary: () => api.get('/investments/portfolio/summary'),
};

// Users API (Complete)
export const usersAPI = {
  getAll: () => api.get('/admin/users'), // Updated for new backend
  getProfile: () => api.get('/users/profile'),
  getProfileById: (userId) => api.get(`/users/profile/${userId}`),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
  submitKYC: (kycData) => api.post('/users/kyc', kycData),
  getKYCStatus: () => api.get('/users/kyc/status'),
  getActivity: () => api.get('/users/activity'),
  getNotifications: () => api.get('/users/notifications'),
  getWallet: () => api.get('/users/wallet'),
  getWalletById: (userId) => api.get(`/wallet/user/${userId}`), // Updated for new backend
  getHoldings: () => api.get('/users/holdings'),
  getAllUsers: () => api.get('/admin/users'), // Updated for new backend
};

// Payment Methods API
export const paymentMethodsAPI = {
  getAll: (userId) => api.get(`/payment-methods${userId ? `?userId=${userId}` : ''}`),
  create: (paymentData) => api.post('/payment-methods', paymentData),
  setDefault: (id) => api.put(`/payment-methods/${id}/default`),
  delete: (id) => api.delete(`/payment-methods/${id}`),
  verify: (id, otp) => api.post(`/payment-methods/${id}/verify`, { otp }),
};

// Wallet Transactions API (Complete)
export const walletTransactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }), // Updated for new backend
  createDeposit: (depositData) => api.post('/wallet/deposit', depositData), // Updated for new backend
  createWithdrawal: (withdrawalData) => api.post('/wallet-transactions/withdrawal', withdrawalData),
  verifyOTP: (id, otp) => api.post(`/wallet-transactions/${id}/verify-otp`, { otp }),
  getById: (id) => api.get(`/wallet-transactions/${id}`),
  getBalance: () => api.get('/wallet-transactions/balance/current'),
  getByUserId: (userId, params) => api.get(`/transactions/user/${userId}`, { params }), // Updated for new backend
  // New on-chain and third-party deposit methods
  createOnChainDeposit: (data) => api.post('/wallet/deposit', {  // Updated for new backend
    userId: data.userId,
    provider: data.blockchain,
    action: 'generate',
    amount: 1000, // Default amount for address generation
    currency: 'PKR'
  }),
  createThirdPartyDeposit: (data) => api.post('/wallet/deposit', { ...data, type: 'thirdparty' }), // Updated for new backend
};

// Organizations API (Real estate developers)
export const organizationsAPI = {
  // List all organizations
  getAll: (params) => api.get('/organizations', { params }),
  
  // Get organization by ID or displayCode (ORG-000001)
  getById: (id) => api.get(`/organizations/${id}`),
  
  // Create a new organization
  create: (data) => api.post('/organizations', data),
  
  // Get organization liquidity analytics
  // GET /organizations/:id/liquidity
  getLiquidity: (id) => api.get(`/organizations/${id}/liquidity`),
  
  // Get all transactions for an organization
  // GET /organizations/:id/transactions
  getTransactions: (id, params) => api.get(`/organizations/${id}/transactions`, { params }),
  
  // Get organization-specific dashboard data
  // GET /admin/dashboard?organizationId=ORG-000001
  // Returns: user, wallet, kyc, investments, rewards, transactions, paymentMethods, portfolio (for user)
  // OR: overview, users, kyc, properties, investments, transactions (for platform/org)
  getDashboard: (id) => api.get(`/admin/dashboard`, { params: { organizationId: id } }),
  
  // Get organization properties
  // GET /properties?org=ORG-000001
  getProperties: (id, params) => api.get('/properties', { params: { org: id, ...params } }),
  
  // Get organization users (investors)
  // GET /admin/users?org=ORG-000001
  getUsers: (id, params) => api.get('/admin/users', { params: { org: id, ...params } }),
  
  // Get organization investments
  // GET /investments?org=ORG-000001
  getInvestments: (id, params) => api.get('/investments', { params: { org: id, ...params } }),
  
  // Get organization investment analytics
  // GET /investments/analytics/organization/:orgId
  getInvestmentAnalytics: (id) => api.get(`/investments/analytics/organization/${id}`),
};

// Admin API (Updated to match actual backend)
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  
  // Users CRUD
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`), // Not yet implemented
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data), // Not yet implemented
  deleteUser: (id) => api.delete(`/admin/users/${id}`), // Not yet implemented
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data), // Not yet implemented
  
  // KYC Management
  getUserKYC: (userId) => api.get(`/kyc/user/${userId}`), // Get KYC by user ID or displayCode
  updateKYCStatus: (kycId, data) => api.patch(`/kyc/${kycId}`, data), // Update KYC status (admin) - PATCH method as per backend
  getAllKYC: (params) => api.get('/kyc', { params }), // Get all KYC verifications
  
  // Organizations
  getOrganizations: (params) => api.get('/organizations', { params }), // Get all organizations
  
  // Properties CRUD - Use public endpoints as admin endpoints don't exist
  getProperties: (params) => api.get('/properties', { params }),
  getProperty: (id) => api.get(`/properties/${id}`),
  getPropertyDetail: (id) => api.get(`/properties/${id}`), // Use regular endpoint
  createProperty: (data) => api.post('/properties', data),
  updateProperty: (id, data) => api.patch(`/properties/${id}`, data), // PATCH for full property updates
  deleteProperty: (id) => api.delete(`/properties/${id}`), // Not yet implemented
  updatePropertyStatus: (id, statusData) => api.patch(`/properties/${id}`, { status: statusData.status }), // PATCH only status field
  
  // Investments - Use public endpoints
  getInvestments: (params) => api.get('/investments', { params }),
  getInvestment: (id) => api.get(`/investments/${id}`),
  
  // Transactions - Use public endpoints
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransaction: (id) => api.get(`/transactions/${id}`), // Not yet implemented
};

// Portfolio API (Mobile Optimized)
export const portfolioAPI = {
  getPortfolio: (userId) => api.get(`/portfolio/user/${userId}/detailed`), // Updated for new backend
  getSummary: (userId) => api.get(`/portfolio/summary/${userId}`),
  getStats: (userId) => api.get(`/portfolio/stats/${userId}`),
  updateStats: (userId, statsData) => api.put(`/portfolio/stats/${userId}`, statsData),
};

// Calculator API (Mobile Optimized)
export const calculatorAPI = {
  calculateROI: (data) => api.post('/calculator/roi', data),
  calculateInvestment: (data) => api.post('/calculator/investment', data),
};

// Support API (Mobile Optimized)
export const supportAPI = {
  submitContact: (data) => api.post('/support/contact', data),
  getFAQ: () => api.get('/support/faq'),
  getContactInfo: () => api.get('/support/contact-info'),
};

// Wallet API (Token Purchase & Management)
export const walletAPI = {
  buyTokens: (data) => api.post('/wallet/buy-tokens', data),
  getHoldings: (userId) => api.get(`/wallet/holdings/${userId}`),
  getHistory: (userId, params) => api.get(`/wallet/history/${userId}`, { params }),
  getProperties: (params) => api.get('/wallet/properties', { params }),
  getProperty: (id) => api.get(`/wallet/properties/${id}`),
};

// Docs API
export const docsAPI = {
  getDocs: () => api.get('/docs'),
};

// KYC API
export const kycAPI = {
  submitKYC: (kycData) => api.post('/kyc/submit', kycData),
  uploadImage: (formData) => api.post('/kyc/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getKYCStatus: (userId) => api.get(`/kyc/status/${userId}`),
  updateKYCStatus: (kycId, statusData) => api.patch(`/kyc/update-status/${kycId}`, statusData),
  detectCardType: (cardNumber) => api.post('/kyc/detect-card-type', { cardNumber }),
};

export default api;
