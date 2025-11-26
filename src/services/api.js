import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hmr-backend.vercel.app';
const BLOCKS_BACKEND_URL = 'https://blocks-backend.vercel.app';

// Create axios instance for main backend
const api = axios.create({
  baseURL: API_BASE_URL,
  // Don't set default Content-Type - let axios set it based on data type
  // For JSON requests, axios will set 'application/json'
  // For FormData, axios will set 'multipart/form-data' with boundary automatically
});

// Create separate axios instance for blocks backend (for documents)
const blocksApi = axios.create({
  baseURL: BLOCKS_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Authentication API (User End)
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials), // POST /api/auth/login
  register: (userData) => api.post('/auth/register', userData), // POST /api/auth/register
  registerWithPayment: (userData) => api.post('/auth/register-with-payment', userData), // POST /api/auth/register-with-payment
  googleLogin: (googleData) => api.post('/auth/google', googleData), // POST /api/auth/google
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }), // POST /api/auth/refresh
  logout: () => api.post('/auth/logout'), // POST /api/auth/logout
  getCurrentUser: () => api.get('/auth/me'), // GET /api/auth/me
};

// Request interceptor (no auth needed for demo)
api.interceptors.request.use(
  (config) => {
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
  create: (investmentData) => api.post('/investments', investmentData), // Create investment (POST /api/investments)
  invest: (investData) => api.post('/investments/invest', investData), // Make investment
  getAll: (params) => api.get('/investments', { params }), // Get all investments with optional filters
  getMyInvestments: (params) => api.get('/investments/my-investments', { params }), // GET /api/investments/my-investments
  getByUserId: (userId) => api.get(`/investments/user/${userId}`), // GET /api/investments/user/:userId
  getById: (id) => api.get(`/investments/${id}`), // GET /api/investments/:id
  updateStatus: (id, status) => api.patch(`/investments/${id}/status`, { status }),
  cancel: (id) => api.patch(`/investments/${id}/cancel`),
  getPortfolioSummary: () => api.get('/investments/portfolio/summary'), // GET /api/investments/portfolio/summary
  // Investment Analytics
  getUserAnalytics: (userId) => api.get(`/investments/analytics/user/${userId}`),
  getOrganizationAnalytics: (orgId) => api.get(`/investments/analytics/organization/${orgId}`),
  getUserOrgAnalytics: (userId, orgId) => api.get(`/investments/analytics/user/${userId}/organization/${orgId}`),
};

// Users API (Complete - User End)
export const usersAPI = {
  getAll: () => api.get('/admin/users'), // GET /api/admin/users (for profile switcher - backend uses admin endpoint)
  getById: (userId) => api.get(`/users/${userId}`), // GET /api/users/:userId (Get user by ID or displayCode)
  updateUser: (userId, userData) => api.patch(`/users/${userId}`, userData), // Update user profile
  getProfile: () => api.get('/users/profile'), // GET /api/users/profile (authenticated user)
  getProfileById: (userId) => api.get(`/users/profile/${userId}`), // GET /api/users/profile/:userId
  updateProfile: (profileData) => api.put('/users/profile', profileData), // PUT /api/users/profile
  changePassword: (passwordData) => api.put('/users/change-password', passwordData), // PUT /api/users/change-password
  submitKYC: (kycData) => api.post('/users/kyc', kycData), // POST /api/users/kyc
  getKYCStatus: () => api.get('/users/kyc/status'), // GET /api/users/kyc/status
  getActivity: () => api.get('/users/activity'), // GET /api/users/activity
  getNotifications: () => api.get('/users/notifications'), // GET /api/users/notifications
  getWallet: () => api.get('/users/wallet'), // GET /api/users/wallet (authenticated user)
  getWalletById: (userId) => api.get(`/wallet/user/${userId}`), // GET /api/wallet/user/:userId (backend uses /wallet/user not /users/wallet)
  getHoldings: () => api.get('/users/holdings'), // GET /api/users/holdings
  getAllUsers: () => api.get('/admin/users'), // GET /api/admin/users (for profile switcher - backend uses admin endpoint)
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
  // Wallet operations
  getWallet: (userId) => api.get(`/wallet/user/${userId}`), // Get wallet by user ID or displayCode
  getAllWallets: () => api.get('/wallet'), // Get all wallets
  updateWallet: (walletId, walletData) => api.patch(`/wallet/${walletId}`, walletData), // Update wallet
  deposit: (depositData) => api.post('/wallet/deposit', depositData), // Create deposit
  buyTokens: (data) => api.post('/wallet/buy-tokens', data), // POST /api/wallet/buy-tokens
  getHoldings: (userId) => api.get(`/wallet/holdings/${userId}`), // GET /api/wallet/holdings/:userId
  getHistory: (userId, params) => api.get(`/wallet/history/${userId}`, { params }), // GET /api/wallet/history/:userId
  getProperties: (params) => api.get('/wallet/properties', { params }), // GET /api/wallet/properties
  getProperty: (id) => api.get(`/wallet/properties/${id}`), // GET /api/wallet/properties/:id
};

// Wallet Transactions API (Complete - User End)
export const walletTransactionsAPI = {
  getAll: (params) => api.get('/wallet-transactions', { params }), // GET /api/wallet-transactions (with filters)
  createDeposit: (depositData) => api.post('/wallet-transactions/deposit', depositData), // POST /api/wallet-transactions/deposit
  createWithdrawal: (withdrawalData) => api.post('/wallet-transactions/withdrawal', withdrawalData), // POST /api/wallet-transactions/withdrawal
  verifyOTP: (id, otp) => api.post(`/wallet-transactions/${id}/verify-otp`, { otp }), // POST /api/wallet-transactions/:id/verify-otp
  getById: (id) => api.get(`/wallet-transactions/${id}`), // GET /api/wallet-transactions/:id
  getBalance: () => api.get('/wallet-transactions/balance/current'), // GET /api/wallet-transactions/balance/current
  getByUserId: (userId, params) => api.get(`/wallet-transactions/user/${userId}`, { params }), // GET /api/wallet-transactions/user/:userId
  // New on-chain and third-party deposit methods
  createOnChainDeposit: (data) => api.post('/wallet-transactions/deposit', {  // POST /api/wallet-transactions/deposit (with provider/blockchain)
    userId: data.userId,
    blockchain: data.blockchain,
    provider: data.provider || data.blockchain,
    action: 'generate',
    amount: data.amount || 1000,
    currency: data.currency || 'PKR'
  }),
  createThirdPartyDeposit: (data) => api.post('/wallet-transactions/deposit', { // POST /api/wallet-transactions/deposit (with provider)
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
};

// Portfolio API (Complete - User End)
export const portfolioAPI = {
  getPortfolio: (userId) => api.get(`/portfolio/${userId}`), // GET /api/portfolio/:userId
  getDetailedPortfolio: (userId) => api.get(`/portfolio/${userId}`), // Alias for clarity
  getSummary: (userId) => api.get(`/portfolio/summary/${userId}`), // GET /api/portfolio/summary/:userId
  getStats: (userId) => api.get(`/portfolio/stats/${userId}`), // GET /api/portfolio/stats/:userId
  updateStats: (userId, statsData) => api.put(`/portfolio/stats/${userId}`, statsData), // PUT /api/portfolio/stats/:userId
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
  submit: (kycData) => api.post('/kyc/submit', kycData), // POST /api/kyc/submit
  submitKYC: (kycData) => api.post('/kyc/submit', kycData), // Legacy alias
  uploadImage: (formData) => api.post('/kyc/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }), // POST /api/kyc/upload-image
  getStatus: (userId) => api.get(`/kyc/status/${userId}`), // GET /api/kyc/status/:userId
  getKYCStatus: (userId) => api.get(`/kyc/status/${userId}`), // Legacy alias
  updateKYCStatus: (kycId, statusData) => api.patch(`/kyc/update-status/${kycId}`, statusData), // Admin only
  detectCardType: (cardNumber) => api.post('/kyc/detect-card-type', { cardNumber }), // POST /api/kyc/detect-card-type
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
      endpoint: `${BLOCKS_BACKEND_URL}/upload/document/properties`
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
      endpoint: `${BLOCKS_BACKEND_URL}/properties/${propertyId}`,
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
      endpoint: `${BLOCKS_BACKEND_URL}/properties/${propertyId}`,
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
