import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck,
  UserX,
  Users,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  AlertTriangle,
  Wallet,
  TrendingUp,
  DollarSign,
  Building2,
  X
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import UserForm from '../../components/admin/UserForm';
import { adminAPI, usersAPI, investmentsAPI, walletTransactionsAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';

const UsersManagement = () => {
  const { isAuthenticated } = useAdminAuth();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    kyc_status: '',
    include_inactive: false,
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [selectedUserKYC, setSelectedUserKYC] = useState(null);
  const [kycData, setKycData] = useState(null);
  const [loadingKYC, setLoadingKYC] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [userFinancialData, setUserFinancialData] = useState(null);
  const [loadingFinancialData, setLoadingFinancialData] = useState(false);

  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery(
    ['admin-users', filters, currentPage],
    () => adminAPI.getUsers({
      ...filters,
      page: currentPage,
      limit: 10,
      include_inactive: filters.include_inactive
    }),
    {
      enabled: isAuthenticated
    }
  );

  // Fetch all KYC statuses
  const { data: allKYCData } = useQuery(
    ['all-kyc-statuses'],
    () => adminAPI.getAllKYC(),
    {
      enabled: isAuthenticated,
      staleTime: 60000 // Cache for 1 minute
    }
  );

  // Update user status mutation
  const updateStatusMutation = useMutation(
    ({ id, is_active }) => adminAPI.updateUserStatus(id, { is_active }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        setShowModal(false);
        setSelectedUser(null);
      }
    }
  );

  // Create user mutation
  const createUserMutation = useMutation(
    (userData) => adminAPI.createUser(userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        setShowUserForm(false);
        setEditingUser(null);
      }
    }
  );

  // Update user mutation
  const updateUserMutation = useMutation(
    ({ id, data }) => adminAPI.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        setShowUserForm(false);
        setEditingUser(null);
      }
    }
  );

  // Delete user mutation
  const deleteUserMutation = useMutation(
    (id) => adminAPI.deleteUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        setShowDeleteModal(false);
        setUserToDelete(null);
        console.log('User deleted successfully');
      },
      onError: (error) => {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  );

  // Update KYC status mutation
  const updateKYCMutation = useMutation(
    ({ kycId, kycStatus, reviewer, rejectionReason }) => 
      adminAPI.updateKYCStatus(kycId, { status: kycStatus, reviewer, rejectionReason }),
    {
      onSuccess: (response, variables) => {
        queryClient.invalidateQueries(['admin-users']);
        queryClient.invalidateQueries(['all-kyc-statuses']); // Refresh KYC statuses
        setShowKYCModal(false);
        setSelectedUserKYC(null);
        setKycData(null);
        console.log('KYC status updated successfully:', response);
        alert(`✅ KYC status updated to "${variables.kycStatus}" successfully!`);
      },
      onError: (error) => {
        console.error('Failed to update KYC status:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          endpoint: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          sentData: error.config?.data
        });
        
        let errorMessage = 'Failed to update KYC status.\n\n';
        
        if (error.message === 'Network Error') {
          errorMessage += '⚠️ CORS Error: The backend does not allow PATCH requests.\n\n';
          errorMessage += 'Backend team needs to:\n';
          errorMessage += '1. Enable CORS for PATCH method\n';
          errorMessage += '2. Add http://localhost:3000 to allowed origins\n';
          errorMessage += '3. Add "PATCH" to Access-Control-Allow-Methods in CORS config';
        } else if (error.response?.status === 404) {
          errorMessage += '⚠️ KYC Endpoint Not Found (404)\n\n';
          errorMessage += `Tried: ${error.config?.method?.toUpperCase()} ${error.config?.url}\n\n`;
          errorMessage += 'This could mean:\n';
          errorMessage += '1. The KYC ID is invalid or not found in database\n';
          errorMessage += '2. Backend endpoint PATCH /kyc/:id is not deployed\n';
          errorMessage += '3. Backend URL might be incorrect\n\n';
          errorMessage += 'Check browser console (F12) for full error details.';
        } else if (error.response?.status === 401) {
          errorMessage += 'Unauthorized. Admin access required.';
        } else {
          errorMessage += error.response?.data?.message || error.message;
        }
        
        alert(errorMessage);
      }
    }
  );

  // Handle different response formats from backend
  const users = usersData?.data?.data?.users || 
                usersData?.data?.users || 
                usersData?.data || 
                (Array.isArray(usersData) ? usersData : []);
  
  // Count inactive users
  const inactiveUsersCount = users.filter(u => !(u.isActive !== undefined ? u.isActive : u.is_active)).length;
  const activeUsersCount = users.filter(u => (u.isActive !== undefined ? u.isActive : u.is_active)).length;
  
  const pagination = usersData?.data?.data?.pagination || 
                     usersData?.data?.pagination || 
                     {
                       totalPages: 1,
                       currentPage: 1,
                       totalUsers: users.length,
                       hasPrev: false,
                       hasNext: false
                     };


  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleStatusUpdate = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const confirmStatusUpdate = () => {
    if (selectedUser) {
      updateStatusMutation.mutate({
        id: selectedUser.id,
        is_active: selectedUser.is_active
      });
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleSaveUser = (userData) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const handleDeleteUser = (user) => {
    console.log('Delete user clicked for:', user.name, user.id);
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      console.log('Confirming delete for user:', userToDelete.id);
      deleteUserMutation.mutate(userToDelete.id);
    } else {
      console.log('No user selected for deletion');
    }
  };

  const handleKYCStatusUpdate = async (user) => {
    setSelectedUserKYC(user);
    setShowKYCModal(true);
    setLoadingKYC(true);
    setKycData(null);

    try {
      // Fetch KYC data from the KYC verification table using user's displayCode
      const response = await adminAPI.getUserKYC(user.displayCode || user.id);
      setKycData(response.data);
    } catch (error) {
      console.error('Failed to fetch KYC data:', error);
      // If no KYC found, it's okay - user hasn't submitted KYC yet
      setKycData(null);
    } finally {
      setLoadingKYC(false);
    }
  };

  const confirmKYCUpdate = (newStatus, rejectionReason = null) => {
    if (kycData && kycData.id) {
      console.log('Updating KYC:', {
        kycId: kycData.id,
        kycStatus: newStatus,
        reviewer: 'Admin',
        rejectionReason: rejectionReason
      });
      
      updateKYCMutation.mutate({
        kycId: kycData.id,
        kycStatus: newStatus,
        reviewer: 'Admin', // You can get this from auth context
        rejectionReason: rejectionReason
      });
    } else {
      alert('No KYC verification found for this user.');
    }
  };

  // Helper function to get KYC status for a user
  const getUserKYCStatus = (user) => {
    if (!allKYCData?.data) return 'not_submitted';
    
    // Find KYC record for this user by userId or displayCode
    const kycRecord = allKYCData.data.find(kyc => 
      kyc.userId === user.id || 
      kyc.userId === user.displayCode ||
      kyc.user?.id === user.id ||
      kyc.user?.displayCode === user.displayCode
    );
    
    return kycRecord?.status || 'not_submitted';
  };

  const getKYCStatusBadge = (status) => {
    const statusMap = {
      'verified': { variant: 'success', text: 'Verified', icon: CheckCircle },
      'pending': { variant: 'warning', text: 'Pending', icon: Clock },
      'rejected': { variant: 'danger', text: 'Rejected', icon: XCircle },
      'not_submitted': { variant: 'default', text: 'Not Submitted', icon: XCircle }
    };
    return statusMap[status] || { variant: 'default', text: status, icon: Clock };
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? { variant: 'success', text: 'Active', icon: UserCheck }
      : { variant: 'danger', text: 'Inactive', icon: UserX };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view users.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-muted-foreground">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load users</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Users Management</h2>
          <p className="text-muted-foreground">
            Manage all users in your platform
            {pagination.totalUsers > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({pagination.totalUsers} {pagination.totalUsers === 1 ? 'user' : 'users'}
                {filters.include_inactive && inactiveUsersCount > 0 && (
                  <span className="text-red-600">
                    {' '}• {inactiveUsersCount} deleted
                  </span>
                )}
                )
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleCreateUser} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Stats Cards - Show when inactive users filter is enabled */}
      {filters.include_inactive && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-card-foreground">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{activeUsersCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deleted Users</p>
                <p className="text-2xl font-bold text-red-600">{inactiveUsersCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">KYC Status</label>
            <select
              value={filters.kyc_status}
              onChange={(e) => handleFilterChange('kyc_status', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="">All KYC Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sort By</label>
            <select
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="created_at">Date Created</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="kyc_status">KYC Status</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Order</label>
            <select
              value={filters.sort_order}
              onChange={(e) => handleFilterChange('sort_order', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
        
        {/* Additional Options */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="include_inactive"
              checked={filters.include_inactive}
              onChange={(e) => handleFilterChange('include_inactive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-ring border-input rounded"
            />
            <label htmlFor="include_inactive" className="ml-2 text-sm text-foreground">
              Include inactive users (deleted users)
            </label>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div>
          <table className="w-full table-fixed text-sm">
            <thead className="bg-accent">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[16rem]">
                  User
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[20rem]">
                  Contact
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[7rem]">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[9rem]">
                  KYC Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[12rem]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {users.map((user) => {
                // Get real KYC status from KYC table
                const userKYCStatus = getUserKYCStatus(user);
                const kycInfo = getKYCStatusBadge(userKYCStatus);
                const statusInfo = getStatusBadge(user.isActive !== undefined ? user.isActive : user.is_active);
                const KycIcon = kycInfo.icon;
                const StatusIcon = statusInfo.icon;

                const isDeleted = !(user.isActive !== undefined ? user.isActive : user.is_active);
                
                return (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-accent ${isDeleted ? 'bg-red-50 opacity-60' : ''}`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap overflow-hidden">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium text-foreground">
                              {(user.fullName || user.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 min-w-0">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={async () => {
                                setSelectedUserDetails(user);
                                setShowUserDetailsModal(true);
                                
                                // Fetch financial data
                                setLoadingFinancialData(true);
                                try {
                                  const userId = user.id || user.displayCode;
                                  
                                  // Fetch wallet, portfolio (includes investments), and transactions in parallel
                                  const [walletResponse, portfolioResponse, transactionsResponse] = await Promise.allSettled([
                                    usersAPI.getWalletById(userId).catch(() => ({ data: null })),
                                    fetch(`https://hmr-backend.vercel.app/portfolio/user/${userId}/detailed`).then(r => r.json()).catch(() => null),
                                    walletTransactionsAPI.getByUserId(userId).catch(() => ({ data: [] }))
                                  ]);
                                  
                                  // Parse wallet data
                                  const walletData = walletResponse.status === 'fulfilled' ? walletResponse.value?.data : null;
                                  const walletBalance = parseFloat(walletData?.balanceUSDT || walletData?.data?.balanceUSDT || walletData?.balance || walletData?.data?.balance || 0);
                                  
                                  // Parse portfolio data (comprehensive investment data)
                                  const portfolioData = portfolioResponse.status === 'fulfilled' ? portfolioResponse.value : null;
                                  const investments = portfolioData?.investments || [];
                                  const summary = portfolioData?.summary || {};
                                  
                                  // Use portfolio summary data
                                  const totalInvestments = parseFloat(summary.totalInvestedUSDT || 0);
                                  const totalReturns = parseFloat(summary.totalRewardsUSDT || 0);
                                  const totalCurrentValue = parseFloat(summary.totalCurrentValueUSDT || 0);
                                  const totalNetROI = parseFloat(summary.totalNetROI || 0);
                                  const activeInvestments = parseInt(summary.activeInvestments || 0);
                                  const averageROI = parseFloat(summary.averageROI || 0);
                                  const propertiesInvested = investments.length;
                                  
                                  // Parse transactions data
                                  const transactionsData = transactionsResponse.status === 'fulfilled' ? transactionsResponse.value?.data : [];
                                  const transactions = Array.isArray(transactionsData) ? transactionsData : 
                                                      transactionsData?.data?.transactions || 
                                                      transactionsData?.transactions || 
                                                      transactionsData?.data || 
                                                      [];
                                  
                                  console.log('📊 Raw API Responses:', {
                                    walletResponse: walletResponse.status === 'fulfilled' ? walletResponse.value?.data : 'failed',
                                    portfolioResponse: portfolioResponse.status === 'fulfilled' ? portfolioResponse.value : 'failed',
                                    transactionsResponse: transactionsResponse.status === 'fulfilled' ? transactionsResponse.value?.data : 'failed'
                                  });
                                  
                                  console.log('📊 User Financial Data:', {
                                    userId,
                                    walletBalance,
                                    totalInvestments,
                                    totalReturns,
                                    totalCurrentValue,
                                    totalNetROI,
                                    activeInvestments,
                                    averageROI,
                                    propertiesInvested,
                                    investments: investments.length,
                                    transactions: transactions.length
                                  });
                                  
                                  setUserFinancialData({
                                    walletBalance,
                                    totalInvestments,
                                    totalReturns,
                                    totalCurrentValue,
                                    totalNetROI,
                                    activeInvestments,
                                    averageROI,
                                    propertiesInvested,
                                    investments: investments,
                                    transactions: transactions
                                  });
                                } catch (error) {
                                  console.error('Failed to fetch financial data:', error);
                                  setUserFinancialData({
                                    walletBalance: 0,
                                    totalInvestments: 0,
                                    totalReturns: 0,
                                    propertiesInvested: 0,
                                    investments: [],
                                    transactions: []
                                  });
                                } finally {
                                  setLoadingFinancialData(false);
                                }
                              }}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer truncate max-w-[10rem]"
                            >
                              {user.fullName || user.name || 'Unknown User'}
                            </button>
                            {user.displayCode && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                                {user.displayCode}
                            </span>
                            )}
                            {isDeleted && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                                <Trash2 className="w-3 h-3 mr-1" />
                                Deleted
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[10rem]">
                            ID: {user.id?.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-card-foreground truncate max-w-[14rem]">
                          <Mail className="w-3 h-3 mr-2 text-muted-foreground" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center text-xs text-muted-foreground truncate max-w-[14rem]">
                            <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                            <span className="truncate">{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge variant={statusInfo.variant} className="flex items-center text-[10px] px-2 py-0.5">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.text}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button 
                        onClick={() => handleKYCStatusUpdate(user)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        title="Click to update KYC status"
                      >
                      <Badge variant={kycInfo.variant} className="flex items-center text-[10px] px-2 py-0.5">
                        <KycIcon className="w-3 h-3 mr-1" />
                        {kycInfo.text}
                      </Badge>
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-start space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 flex-shrink-0"
                          onClick={() => handleEditUser(user)}
                          title="Edit user"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-7 w-7 p-0 flex-shrink-0"
                          onClick={() => handleStatusUpdate(user)}
                          title="Update status"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`h-7 w-7 p-0 flex-shrink-0 ${isDeleted ? 'text-muted-foreground cursor-not-allowed opacity-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                          onClick={() => isDeleted ? null : handleDeleteUser(user)}
                          title={isDeleted ? 'User already deleted' : `Delete ${user.fullName || user.name}`}
                          disabled={isDeleted}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-foreground">
                  Showing{' '}
                  <span className="font-medium">
                    {((currentPage - 1) * 10) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, pagination.totalUsers)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalUsers}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-card border-input text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Status Update Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-card">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-card-foreground mb-4">
                Update User Status
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    User: {selectedUser.fullName || selectedUser.name}
                  </label>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email: {selectedUser.email}
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUser.isActive !== undefined ? selectedUser.isActive : selectedUser.is_active}
                      onChange={(e) => setSelectedUser(prev => ({ 
                        ...prev, 
                        isActive: e.target.checked,
                        is_active: e.target.checked 
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-ring border-input rounded"
                    />
                    <span className="ml-2 text-sm text-foreground">Active User</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmStatusUpdate}
                  disabled={updateStatusMutation.isLoading}
                >
                  {updateStatusMutation.isLoading ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
          isLoading={createUserMutation.isLoading || updateUserMutation.isLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-card">
            <div className="mt-3">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-card-foreground">Delete User</h3>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-6">
                Are you sure you want to delete <strong>{userToDelete.fullName || userToDelete.name}</strong>? 
                This will deactivate the user account.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={deleteUserMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteUser}
                  disabled={deleteUserMutation.isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteUserMutation.isLoading ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Status Update Modal */}
      {showKYCModal && selectedUserKYC && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-card">
            <div className="mt-3">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-card-foreground">Update KYC Status</h3>
                  <p className="text-sm text-muted-foreground">Review and approve user verification</p>
                </div>
              </div>

              {/* User Information */}
              <div className="bg-accent p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">User Name</p>
                    <p className="text-sm font-medium text-card-foreground">{selectedUserKYC.fullName || selectedUserKYC.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">User ID</p>
                    <p className="text-sm font-medium text-card-foreground">{selectedUserKYC.displayCode || selectedUserKYC.id?.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium text-card-foreground">{selectedUserKYC.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <p className="text-sm font-medium text-card-foreground">{selectedUserKYC.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current KYC Status</p>
                    {loadingKYC ? (
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    ) : (
                      <Badge variant={getKYCStatusBadge(kycData?.status || 'not_submitted').variant} className="inline-flex">
                        {getKYCStatusBadge(kycData?.status || 'not_submitted').text}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Joined Date</p>
                    <p className="text-sm font-medium text-card-foreground">{formatDate(selectedUserKYC.createdAt || selectedUserKYC.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* KYC Details from KYC Verification Table */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-card-foreground mb-3">KYC Verification Details</h4>
                <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                  {loadingKYC ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading KYC data...</p>
                    </div>
                  ) : kycData ? (
                    <>
                      {/* Verified Success Banner */}
                      {kycData.status === 'verified' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center">
                            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                            <div>
                              <p className="text-sm font-semibold text-green-800">KYC Verified Successfully</p>
                              <p className="text-xs text-green-600 mt-1">
                                This user has been verified and can access all features. Status cannot be reverted.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Verification Type</p>
                          <p className="text-sm text-card-foreground uppercase">{kycData.type || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Submission Date</p>
                          <p className="text-sm text-card-foreground">{kycData.submittedAt ? formatDate(kycData.submittedAt) : 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Reviewed By</p>
                          <p className="text-sm text-card-foreground">{kycData.reviewer || 'Not reviewed yet'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Reviewed Date</p>
                          <p className="text-sm text-card-foreground">{kycData.reviewedAt ? formatDate(kycData.reviewedAt) : 'Not reviewed yet'}</p>
                        </div>
                      </div>
                      
                      {/* Document Links */}
                      <div className="pt-3 border-t space-y-2">
                        <p className="text-xs text-muted-foreground mb-2">Uploaded Documents:</p>
                        {kycData.documentFrontUrl && (
                          <div>
                            <a 
                              href={kycData.documentFrontUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm underline block"
                            >
                              📄 View Front Document
                            </a>
                          </div>
                        )}
                        {kycData.documentBackUrl && (
                          <div>
                            <a 
                              href={kycData.documentBackUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm underline block"
                            >
                              📄 View Back Document
                            </a>
                          </div>
                        )}
                        {kycData.selfieUrl && (
                          <div>
                            <a 
                              href={kycData.selfieUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm underline block"
                            >
                              🤳 View Selfie
                            </a>
                          </div>
                        )}
                        {!kycData.documentFrontUrl && !kycData.documentBackUrl && !kycData.selfieUrl && (
                          <p className="text-sm text-muted-foreground italic">No documents uploaded</p>
                        )}
                      </div>

                      {/* Additional Metadata */}
                      {kycData.metadata && Object.keys(kycData.metadata).length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Additional Information:</p>
                          <pre className="text-xs bg-accent p-2 rounded overflow-auto">
                            {JSON.stringify(kycData.metadata, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {kycData.status === 'rejected' && kycData.rejectionReason && (
                        <div className="pt-3 border-t bg-red-50 p-3 rounded">
                          <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason:</p>
                          <p className="text-sm text-red-900">{kycData.rejectionReason}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 bg-accent rounded-lg">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3">
                        <XCircle className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground mb-1">KYC Not Submitted</p>
                      <p className="text-sm text-muted-foreground">User hasn't submitted their KYC documents yet</p>
                      <div className="mt-4 p-3 bg-blue-50 rounded-md mx-8">
                        <p className="text-xs text-blue-700">
                          <strong>Note:</strong> User must submit their CNIC/documents before you can verify their account.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowKYCModal(false);
                    setSelectedUserKYC(null);
                    setKycData(null);
                  }}
                  disabled={updateKYCMutation.isLoading}
                >
                  Close
                </Button>
                {kycData ? (
                  kycData.status === 'verified' ? (
                    // If KYC is verified, show message that it cannot be changed
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-medium text-green-600">
                        KYC is verified and cannot be reverted
                      </p>
                    </div>
                  ) : (
                    // If KYC is pending or rejected, show action buttons
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason (optional):');
                          if (reason !== null) { // null means user clicked Cancel
                            confirmKYCUpdate('rejected', reason || 'No reason provided');
                          }
                        }}
                        disabled={updateKYCMutation.isLoading || kycData.status === 'rejected'}
                        className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {kycData.status === 'rejected' ? 'Already Rejected' : 'Reject KYC'}
                      </Button>
                      <Button
                        onClick={() => confirmKYCUpdate('pending')}
                        disabled={updateKYCMutation.isLoading || kycData.status === 'pending'}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {kycData.status === 'pending' ? 'Already Pending' : 'Mark Pending'}
                      </Button>
                      <Button
                        onClick={() => confirmKYCUpdate('verified')}
                        disabled={updateKYCMutation.isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {updateKYCMutation.isLoading ? 'Approving...' : 'Approve KYC'}
                      </Button>
                    </div>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground italic">No KYC submitted - User needs to submit KYC documents first</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUserDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-card my-10">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowUserDetailsModal(false);
                setSelectedUserDetails(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-muted-foreground"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {(selectedUserDetails.fullName || selectedUserDetails.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground">
                    {selectedUserDetails.fullName || selectedUserDetails.name || 'Unknown User'}
                  </h2>
                  <p className="text-muted-foreground flex items-center mt-1">
                    <Mail className="w-4 h-4 mr-1" />
                    {selectedUserDetails.email}
                  </p>
                  {selectedUserDetails.displayCode && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {selectedUserDetails.displayCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Stats Cards - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card className="p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
                    {loadingFinancialData ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : (
                      <p className="text-lg font-bold text-green-600">
                        USD {(userFinancialData?.walletBalance || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Investments</p>
                    {loadingFinancialData ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : (
                      <p className="text-lg font-bold text-blue-600">
                        USD {(userFinancialData?.totalInvestments || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Returns</p>
                    {loadingFinancialData ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : (
                      <p className="text-lg font-bold text-purple-600">
                        USD {(userFinancialData?.totalReturns || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Properties</p>
                    {loadingFinancialData ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : (
                      <p className="text-lg font-bold text-orange-600">
                        {userFinancialData?.propertiesInvested || 0}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Financial Stats Cards - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                    {loadingFinancialData ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : (
                      <p className="text-lg font-bold text-indigo-600">
                        USD {(userFinancialData?.totalCurrentValue || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Net ROI</p>
                    {loadingFinancialData ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : (
                      <p className={`text-lg font-bold ${(userFinancialData?.totalNetROI || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        USD {(userFinancialData?.totalNetROI || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-l-4 border-teal-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Average ROI</p>
                    {loadingFinancialData ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : (
                      <p className="text-lg font-bold text-teal-600">
                        {(userFinancialData?.averageROI || 0).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-l-4 border-cyan-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Active Investments</p>
                    {loadingFinancialData ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : (
                      <p className="text-lg font-bold text-cyan-600">
                        {userFinancialData?.activeInvestments || 0}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-cyan-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* User Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-base text-card-foreground">{selectedUserDetails.fullName || selectedUserDetails.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-base text-card-foreground">{selectedUserDetails.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-base text-card-foreground">{selectedUserDetails.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">User ID</label>
                    <p className="text-base text-card-foreground font-mono text-xs">{selectedUserDetails.id}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Account Status</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Account Status</label>
                    <Badge variant={getStatusBadge(selectedUserDetails.isActive !== undefined ? selectedUserDetails.isActive : selectedUserDetails.is_active).variant}>
                      {getStatusBadge(selectedUserDetails.isActive !== undefined ? selectedUserDetails.isActive : selectedUserDetails.is_active).text}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">KYC Status</label>
                    <Badge variant={getKYCStatusBadge(getUserKYCStatus(selectedUserDetails)).variant}>
                      {getKYCStatusBadge(getUserKYCStatus(selectedUserDetails)).text}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Joined Date</label>
                    <p className="text-base text-card-foreground">{formatDate(selectedUserDetails.createdAt || selectedUserDetails.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Last Login</label>
                    <p className="text-base text-card-foreground">{selectedUserDetails.lastLogin ? formatDate(selectedUserDetails.lastLogin) : 'Never'}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Investment Details */}
            {userFinancialData && userFinancialData.investments && userFinancialData.investments.length > 0 && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Investment Portfolio</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-accent">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Property</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Amount Invested</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Tokens</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Returns</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {userFinancialData.investments.map((investment, index) => {
                        const amount = parseFloat(investment.amountInvestedUSDT || investment.amount || 0);
                        const tokens = parseFloat(investment.tokensPurchased || investment.tokens || 0);
                        const returns = parseFloat(investment.totalRewardsUSDT || investment.returns || 0);
                        const propertyName = investment.property?.title || investment.propertyName || 'N/A';
                        const displayCode = investment.displayCode || '';
                        const status = investment.status || 'active';
                        
                        return (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">
                              <div>
                                <p className="font-medium text-card-foreground">{propertyName}</p>
                                {displayCode && (
                                  <p className="text-xs text-muted-foreground">{displayCode}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-card-foreground">USD {amount.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-card-foreground">{tokens.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-green-600">USD {returns.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm">
                              <Badge variant={status === 'confirmed' || status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'default'}>
                                {status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Transaction History */}
            {userFinancialData && userFinancialData.transactions && userFinancialData.transactions.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Recent Transactions</h3>
                <div className="space-y-2">
                  {userFinancialData.transactions.slice(0, 5).map((transaction, index) => {
                    const txType = transaction.type || 'unknown';
                    const isDeposit = txType === 'deposit';
                    const amount = parseFloat(transaction.amountUSDT || transaction.amount_in_pkr || transaction.amount || 0);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${isDeposit ? 'bg-green-100' : 'bg-red-100'}`}>
                            <DollarSign className={`w-4 h-4 ${isDeposit ? 'text-green-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-card-foreground">{transaction.description || txType}</p>
                              {transaction.displayCode && (
                                <span className="text-xs text-muted-foreground">({transaction.displayCode})</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt || transaction.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${isDeposit ? 'text-green-600' : 'text-red-600'}`}>
                            {isDeposit ? '+' : '-'}USD {amount.toLocaleString()}
                          </p>
                          <Badge variant={transaction.status === 'completed' ? 'success' : transaction.status === 'pending' ? 'warning' : 'default'}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUserDetailsModal(false);
                  setSelectedUserDetails(null);
                }}
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUserDetailsModal(false);
                  handleEditUser(selectedUserDetails);
                }}
                className="flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
