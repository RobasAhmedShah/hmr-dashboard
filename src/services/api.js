import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance for main backend
const api = axios.create({
  baseURL: API_BASE_URL,
  // Don't set default Content-Type - let axios set it based on data type
  // For JSON requests, axios will set 'application/json'
  // For FormData, axios will set 'multipart/form-data' with boundary automatically
});

// Create separate axios instance for blocks backend (for documents)
const blocksApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Authentication API (User End) - Using mobile auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/api/mobile/auth/login', credentials), // POST /api/mobile/auth/login
  register: (userData) => api.post('/api/mobile/auth/register', userData), // POST /api/mobile/auth/register
  registerWithPayment: (userData) => api.post('/auth/register-with-payment', userData), // POST /api/auth/register-with-payment (if exists)
  googleLogin: (googleData) => api.post('/auth/google', googleData), // POST /api/auth/google (if exists)
  refreshToken: (refreshToken) => api.post('/api/mobile/auth/refresh', { refreshToken }), // POST /api/mobile/auth/refresh
  logout: () => api.post('/api/mobile/auth/logout'), // POST /api/mobile/auth/logout
  getCurrentUser: () => api.get('/api/mobile/auth/me'), // GET /api/mobile/auth/me
};

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set Content-Type for JSON requests (non-FormData)
    if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    // For FormData, let axios/browser set Content-Type automatically with boundary
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log 404 errors as warnings instead of errors to reduce noise
    if (error.response?.status === 404) {
      console.warn(`API endpoint not found (404): ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    } else if (error.response?.status >= 500) {
      console.error(`Server error (${error.response.status}): ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    }
    return Promise.reject(error);
  }
);

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
  uploadImages: (id, formData) => api.post(`/properties/${id}/upload-images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Investments API (Complete - User End)
export const investmentsAPI = {
  create: (investmentData) => api.post('/investments', investmentData), // Create investment (POST /investments)
  invest: (investData) => api.post('/investments/invest', investData), // Make investment (POST /investments/invest)
  getAll: (params) => api.get('/investments', { params }), // Get all investments with optional filters (GET /investments?userId=...)
  getMyInvestments: (params) => api.get('/investments', { params: { ...params, userId: params?.userId } }), // Use /investments with userId query param
  getByUserId: (userId) => api.get('/investments', { params: { userId } }), // GET /investments?userId=:userId
  getById: (id) => api.get(`/investments/${id}`), // GET /investments/:id
  updateStatus: (id, status) => api.patch(`/investments/${id}/status`, { status }), // PATCH /investments/:id/status (if exists)
  cancel: (id) => api.patch(`/investments/${id}/cancel`), // PATCH /investments/:id/cancel (if exists)
  getPortfolioSummary: () => api.get('/investments/portfolio/summary'), // GET /investments/portfolio/summary (if exists)
  // Investment Analytics
  getUserAnalytics: (userId) => api.get(`/investments/analytics/user/${userId}`), // GET /investments/analytics/user/:userId
  getOrganizationAnalytics: (orgId) => api.get(`/investments/analytics/organization/${orgId}`), // GET /investments/analytics/organization/:orgId
  getUserOrgAnalytics: (userId, orgId) => api.get(`/investments/analytics/user/${userId}/organization/${orgId}`), // GET /investments/analytics/user/:userId/organization/:orgId
};

// Users API (Complete - User End)
export const usersAPI = {
  getAll: () => api.get('/admin/users'), // GET /admin/users (for profile switcher - backend uses admin endpoint)
  getById: async (userId) => {
    // Backend doesn't have direct GET /users/:userId, so we fetch all and filter
    // Or use admin/users endpoint and filter client-side
    try {
      const response = await api.get('/admin/users');
      const users = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      const user = users.find(u => u.id === userId || u.displayCode === userId);
      if (!user) {
        throw new Error('User not found');
      }
      return { data: user };
    } catch (error) {
      throw error;
    }
  },
  updateUser: (userId, userData) => api.patch(`/users/${userId}`, userData), // PATCH /users/:userId - Update user profile
  getProfile: () => api.get('/api/mobile/profile'), // GET /api/mobile/profile (authenticated user - requires JWT)
  getProfileById: async (userId) => {
    // Backend doesn't have direct GET /users/:userId, so we fetch all and filter
    try {
      const response = await api.get('/admin/users');
      const users = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      const user = users.find(u => u.id === userId || u.displayCode === userId);
      if (!user) {
        throw new Error('User not found');
      }
      return { data: user };
    } catch (error) {
      throw error;
    }
  },
  updateProfile: (profileData) => api.patch('/api/mobile/profile', profileData), // PATCH /api/mobile/profile (requires JWT)
  changePassword: (passwordData) => api.put('/users/change-password', passwordData), // PUT /users/change-password (if exists)
  submitKYC: (kycData) => api.post('/kyc/submit', kycData), // POST /kyc/submit
  getKYCStatus: (userId) => api.get(`/kyc/user/${userId}`), // GET /kyc/user/:userId
  getActivity: () => api.get('/users/activity'), // GET /users/activity (if exists)
  getNotifications: (userId) => {
    // If userId is provided, use the public endpoint that doesn't require JWT
    if (userId) {
      return api.get(`/api/notifications/user/${userId}`);
    }
    // Otherwise, try the JWT-protected endpoint (for mobile app)
    return api.get('/api/notifications');
  },
  markNotificationAsRead: (notificationId, userId) => api.patch(`/api/notifications/mark-read/${notificationId}/user/${userId}`), // PATCH /api/notifications/mark-read/:notificationId/user/:userId
  markAllNotificationsAsRead: (userId) => api.patch(`/api/notifications/mark-all-read/user/${userId}`), // PATCH /api/notifications/mark-all-read/user/:userId
  getWallet: () => api.get('/api/mobile/wallet'), // GET /api/mobile/wallet (authenticated user - requires JWT)
  getWalletById: (userId) => api.get(`/wallet/user/${userId}`), // GET /wallet/user/:userId (backend uses /wallet/user)
  getHoldings: (userId) => api.get(`/wallet/holdings/${userId}`), // GET /wallet/holdings/:userId (if exists)
  getAllUsers: () => api.get('/admin/users'), // GET /admin/users (for profile switcher - backend uses admin endpoint)
  // Mobile Investments API (requires JWT auth)
  getMyInvestments: () => api.get('/api/mobile/investments'), // GET /api/mobile/investments (authenticated user)
  // Web Push Notifications
  registerWebPush: (subscription, userId) => {
    // If userId is provided, use the public endpoint that doesn't require JWT
    if (userId) {
      return api.post(`/api/notifications/register-web-push/${userId}`, { subscription });
    }
    // Otherwise, try the JWT-protected endpoint (for mobile app)
    return api.post('/api/notifications/register-web-push', { subscription });
  },
  getVapidPublicKey: () => api.get('/api/notifications/vapid-public-key'), // GET /api/notifications/vapid-public-key
};

// Payment Methods API (User End)
export const paymentMethodsAPI = {
  getAll: (userId) => api.get(`/payment-methods${userId ? `?userId=${userId}` : ''}`), // GET /api/payment-methods?userId={userId}
  create: (paymentData) => api.post('/payment-methods', paymentData), // POST /api/payment-methods
  setDefault: (id) => api.put(`/payment-methods/${id}/default`), // PUT /api/payment-methods/:id/default
  delete: (id) => api.delete(`/payment-methods/${id}`), // DELETE /api/payment-methods/:id
  verify: (id, otp) => api.post(`/payment-methods/${id}/verify`, { otp }), // POST /api/payment-methods/:id/verify
};

// Wallet API (Complete - User End)
export const walletAPI = {
  // Wallet operations - Use mobile wallet endpoint for consistent format
  getWallet: (userId) => {
    // For dashboard, we can use the regular wallet endpoint and transform it
    // Or use mobile endpoint if authenticated
    return api.get(`/wallet/user/${userId}`); // Get wallet by user ID or displayCode (GET /wallet/user/:userId)
  },
  // Mobile wallet endpoint (requires JWT auth) - returns { usdc, totalValue, totalInvested, totalEarnings, pendingDeposits }
  getMobileWallet: () => api.get('/api/mobile/wallet'), // GET /api/mobile/wallet (requires JWT auth)
  getAllWallets: () => api.get('/wallet'), // Get all wallets (GET /wallet)
  updateWallet: (walletId, walletData) => api.patch(`/wallet/${walletId}`, walletData), // Update wallet (PATCH /wallet/:id)
  deposit: (depositData) => api.post('/wallet/deposit', depositData), // Create deposit (POST /wallet/deposit)
  buyTokens: (data) => api.post('/investments/invest', data), // Use investments/invest endpoint for buying tokens
  getHoldings: (userId) => api.get(`/wallet/holdings/${userId}`), // GET /wallet/holdings/:userId (if exists)
  getHistory: (userId, params) => api.get(`/transactions/user/${userId}`, { params }), // GET /transactions/user/:userId
  getProperties: (params) => api.get('/properties', { params }), // GET /properties
  getProperty: (id) => api.get(`/properties/${id}`), // GET /properties/:id
};

// Wallet Transactions API (Complete - User End)
export const walletTransactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }), // GET /transactions (with filters)
  createDeposit: (depositData) => api.post('/wallet/deposit', depositData), // POST /wallet/deposit
  createWithdrawal: (withdrawalData) => api.post('/wallet-transactions/withdrawal', withdrawalData), // POST /wallet-transactions/withdrawal (if exists)
  verifyOTP: (id, otp) => api.post(`/wallet-transactions/${id}/verify-otp`, { otp }), // POST /wallet-transactions/:id/verify-otp (if exists)
  getById: (id) => api.get(`/transactions/${id}`), // GET /transactions/:id
  getBalance: () => api.get('/wallet-transactions/balance/current'), // GET /wallet-transactions/balance/current (if exists)
  getByUserId: (userId, params) => api.get(`/transactions/user/${userId}`, { params }), // GET /transactions/user/:userId
  // New on-chain and third-party deposit methods
  createOnChainDeposit: (data) => api.post('/wallet/deposit', {  // POST /wallet/deposit (with provider/blockchain)
    userId: data.userId,
    blockchain: data.blockchain,
    provider: data.provider || data.blockchain,
    action: 'generate',
    amount: data.amount || 1000,
    currency: data.currency || 'PKR'
  }),
  createThirdPartyDeposit: (data) => api.post('/wallet/deposit', { // POST /wallet/deposit (with provider)
    ...data,
    provider: data.provider,
    action: 'generate',
    type: 'thirdparty'
  }),
};

// Organizations API (Real estate developers)
export const organizationsAPI = {
  // List all organizations
  getAll: (params) => api.get('/organizations', { params }),
  
  // Get organization by ID or displayCode (ORG-000001)
  getById: (id) => api.get(`/organizations/${id}`),
  
  // Create a new organization
  create: (data) => api.post('/organizations', data),
  
  // Upload organization logo
  uploadLogo: (id, formData) => api.post(`/organizations/${id}/upload-logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
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

// Organization Admin Management API
export const orgAdminAPI = {
  // Admin endpoints (for main admin to manage organizations)
  getAllOrganizations: () => api.get('/admin/organizations'),
  createOrganization: (data) => api.post('/admin/organizations', data),
  updateOrganization: (id, data) => api.patch(`/admin/organizations/${id}`, data),
  deleteOrganization: (id) => api.delete(`/admin/organizations/${id}`),
  resetOrgPassword: (id, data) => api.post(`/admin/organizations/${id}/reset-password`, data),
  
  // Org admin auth endpoints
  orgAdminLogin: (credentials) => api.post('/org/auth/login', credentials),
  changeOrgAdminPassword: (adminId, data) => api.patch(`/org/auth/change-password/${adminId}`, data),
};

// Admin API (Updated to match actual backend)
// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  
  // Users CRUD
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`), // Not yet implemented
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data), // Try PATCH instead of PUT
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
  
  // Notifications
  sendNotification: (data) => api.post('/admin/notifications/send', data), // POST /admin/notifications/send
};

// Portfolio API (Complete - User End)
export const portfolioAPI = {
  getPortfolio: (userId) => api.get(`/portfolio/user/${userId}/detailed`), // GET /portfolio/user/:userId/detailed
  getDetailedPortfolio: (userId) => api.get(`/portfolio/user/${userId}/detailed`), // Alias for clarity
  getSummary: (userId) => api.get(`/portfolio/user/${userId}/detailed`), // Use detailed endpoint for summary
  getStats: (userId) => api.get(`/portfolio/user/${userId}/detailed`), // Use detailed endpoint for stats
  updateStats: (userId, statsData) => api.put(`/portfolio/stats/${userId}`, statsData), // PUT /api/portfolio/stats/:userId (if exists)
};


// Rewards API (Complete)
export const rewardsAPI = {
  getAll: (params) => api.get('/rewards', { params }), // Get all rewards
  getByUserId: (userId) => api.get('/rewards', { params: { userId } }), // Get user rewards
  getById: (id) => api.get(`/rewards/${id}`), // Get reward by ID or displayCode
  distributeRoi: (roiData) => blocksApi.post('/rewards/distribute', roiData), // Distribute ROI rewards via Blocks Backend - expects { propertyId, totalRoiUSDT }
};

// Upload API (File uploads)
export const uploadAPI = {
  // Upload single image
  // Axios will automatically detect FormData and set Content-Type with boundary
  uploadImage: (category, formData) => api.post(`/upload/image/${category}`, formData),
  // Upload multiple images
  uploadImages: (category, formData) => api.post(`/upload/images/${category}`, formData),
  // Upload document
  uploadDocument: (category, formData) => api.post(`/upload/document/${category}`, formData),
  // Get file URL
  getFileUrl: (category, filename) => `${API_BASE_URL}/upload/file/${category}/${filename}`,
  // Check if file exists
  checkFile: (category, filename) => api.get(`/upload/exists/${category}/${filename}`),
};

// Docs API
export const docsAPI = {
  getDocs: () => api.get('/docs'),
};

// KYC API (User End)
export const kycAPI = {
  submit: (kycData) => api.post('/kyc/submit', kycData), // POST /kyc/submit
  submitKYC: (kycData) => api.post('/kyc/submit', kycData), // Legacy alias
  uploadImage: (formData) => api.post('/kyc/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }), // POST /kyc/upload-image (if exists)
  getStatus: (userId) => api.get(`/kyc/user/${userId}`), // GET /kyc/user/:userId
  getKYCStatus: (userId) => api.get(`/kyc/user/${userId}`), // Legacy alias
  updateKYCStatus: (kycId, statusData) => api.patch(`/kyc/${kycId}`, statusData), // Admin only - PATCH /kyc/:id
  detectCardType: (cardNumber) => api.post('/kyc/detect-card-type', { cardNumber }), // POST /kyc/detect-card-type (if exists)
};

// Calculator API (User End)
export const calculatorAPI = {
  calculateROI: (data) => api.post('/calculator/roi', data), // POST /api/calculator/roi
  calculateInvestment: (data) => api.post('/calculator/investment', data), // POST /api/calculator/investment
};

// Support API (User End)
export const supportAPI = {
  getFAQ: () => api.get('/support/faq'), // GET /api/support/faq
  getContactInfo: () => api.get('/support/contact-info'), // GET /api/support/contact-info
  submitContact: (contactData) => api.post('/support/contact', contactData), // POST /api/support/contact
};

// Blocks Backend API (for document storage)
// Note: Endpoint paths are configurable - update if backend uses different paths
const BLOCKS_DOCUMENTS_ENDPOINT = process.env.REACT_APP_BLOCKS_DOCUMENTS_ENDPOINT || '/property-documents';
const BLOCKS_DOCUMENTS_ENDPOINT_ALT = '/documents'; // Alternative endpoint
const BLOCKS_DOCUMENTS_ENDPOINT_ALT2 = '/properties/documents'; // Another alternative

export const blocksBackendAPI = {
  // Upload document to blocks backend
  // POST /upload/document/properties
  uploadDocument: async (file, propertyId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (propertyId) {
      formData.append('propertyId', propertyId);
    }
    
    console.log('📤 Uploading document to blocks backend:', {
      fileName: file.name,
      fileSize: file.size,
      propertyId,
      endpoint: `${API_BASE_URL}/upload/document/properties`
    });
    
    try {
      const response = await blocksApi.post('/upload/document/properties', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Document uploaded to blocks backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to upload document to blocks backend:', error);
      throw error;
    }
  },
  
  // Post property documents to blocks backend using PATCH
  // Tries multiple endpoint patterns if one fails
  postPropertyDocuments: async (propertyId, documents) => {
    // documents is now an object: { brochure, floorPlan, compliance }
    const payload = {
      documents: documents || { brochure: null, floorPlan: null, compliance: [] }
    };
    
    console.log('📤 PATCH posting documents to blocks backend:', {
      propertyId,
      endpoint: `${API_BASE_URL}/properties/${propertyId}`,
      payload
    });
    
    // Use PATCH to /properties/:id with documents in body
    try {
      return await blocksApi.patch(`/properties/${propertyId}`, payload);
    } catch (error) {
      console.error('❌ PATCH failed, trying alternative endpoints:', error);
      if (error.response?.status === 404) {
        console.warn(`⚠️ Endpoint /properties/${propertyId} not found (404), trying alternatives...`);
        
        // Try alternative endpoints
        const alternatives = [
          BLOCKS_DOCUMENTS_ENDPOINT,
          BLOCKS_DOCUMENTS_ENDPOINT_ALT,
          BLOCKS_DOCUMENTS_ENDPOINT_ALT2
        ];
        for (const altEndpoint of alternatives) {
          try {
            console.log(`🔄 Trying alternative endpoint: ${altEndpoint}`);
            const altPayload = { propertyId, documents: payload.documents };
            return await blocksApi.post(altEndpoint, altPayload);
          } catch (altError) {
            if (altError.response?.status !== 404) {
              // If it's not a 404, throw the error (might be auth, validation, etc.)
              throw altError;
            }
          }
        }
        
        // If all endpoints return 404, throw original error with helpful message
        throw new Error(`All document endpoints returned 404. Please check backend routes.`);
      }
      throw error;
    }
  },
  
  // Update property documents in blocks backend using PATCH
  updatePropertyDocuments: async (propertyId, documents) => {
    // documents is now an object: { brochure, floorPlan, compliance }
    const payload = {
      documents: documents || { brochure: null, floorPlan: null, compliance: [] }
    };
    
    console.log('📤 PATCH updating documents in blocks backend:', {
      propertyId,
      endpoint: `${API_BASE_URL}/properties/${propertyId}`,
      payload
    });
    
    try {
      // Use PATCH to /properties/:id with documents in body
      return await blocksApi.patch(`/properties/${propertyId}`, payload);
    } catch (error) {
      console.error('❌ PATCH failed, trying alternative endpoints:', error);
      if (error.response?.status === 404) {
        // Try alternative endpoints
        const alternatives = [
          `${BLOCKS_DOCUMENTS_ENDPOINT}/${propertyId}`,
          `${BLOCKS_DOCUMENTS_ENDPOINT_ALT}/${propertyId}`,
          `${BLOCKS_DOCUMENTS_ENDPOINT_ALT2}/${propertyId}`
        ];
        for (const altEndpoint of alternatives) {
          try {
            console.log(`🔄 Trying alternative endpoint: ${altEndpoint}`);
            return await blocksApi.patch(altEndpoint, payload);
          } catch (altError) {
            if (altError.response?.status !== 404) {
              throw altError;
            }
          }
        }
        throw new Error(`All document update endpoints returned 404. Please check backend routes.`);
      }
      throw error;
    }
  },
  
  // Get property documents from blocks backend
  getPropertyDocuments: async (propertyId) => {
    try {
      return await blocksApi.get(`${BLOCKS_DOCUMENTS_ENDPOINT}/${propertyId}`);
    } catch (error) {
      if (error.response?.status === 404) {
        // Try alternative endpoints
        const alternatives = [
          `${BLOCKS_DOCUMENTS_ENDPOINT_ALT}/${propertyId}`,
          `${BLOCKS_DOCUMENTS_ENDPOINT_ALT2}/${propertyId}`
        ];
        for (const altEndpoint of alternatives) {
          try {
            return await blocksApi.get(altEndpoint);
          } catch (altError) {
            if (altError.response?.status !== 404) {
              throw altError;
            }
          }
        }
      }
      throw error;
    }
  }
};

export default api;
