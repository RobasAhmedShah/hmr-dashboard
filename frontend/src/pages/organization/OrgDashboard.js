import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Activity,
  BarChart3,
  Shield,
  LogOut,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { organizationsAPI, adminAPI } from '../../services/api';
import { useOrganizationAuth } from '../../components/organization/OrganizationAuth';
import OrgPropertiesManagement from './OrgPropertiesManagement';
import OrgUsersManagement from './OrgUsersManagement';
import OrgTransactionsManagement from './OrgTransactionsManagement';
import OrgInvestmentsManagement from './OrgInvestmentsManagement';

const OrgDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { organizationUser, isAuthenticated, logout } = useOrganizationAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/org/login');
    }
  }, [isAuthenticated, navigate]);

  // Get organization info
  const organizationName = organizationUser?.organizationName || 'Organization';
  const organizationSlug = organizationUser?.organizationSlug || '';
  const organizationId = organizationUser?.organizationId || '';

  // Update browser tab title with organization name
  useEffect(() => {
    if (organizationName) {
      document.title = `${organizationName} - Organization Dashboard`;
    }
    return () => {
      document.title = 'HMR Platform'; // Reset on unmount
    };
  }, [organizationName]);

  // Debug: Log organization info
  useEffect(() => {
    console.log('🏢 Current Organization Info:', {
      name: organizationName,
      slug: organizationSlug,
      id: organizationId,
      email: organizationUser?.email,
      fullData: organizationUser
    });
  }, [organizationName, organizationSlug, organizationId, organizationUser]);

  // Fetch organization details
  const { data: orgData, isLoading: orgLoading } = useQuery(
    ['org-details', organizationId],
    async () => {
      console.log('🔄 Fetching organization details for ID:', organizationId);
      const response = await organizationsAPI.getById(organizationId);
      console.log('✅ Organization details:', response);
      return response;
    },
    { 
      refetchInterval: 30000,
      enabled: isAuthenticated && !!organizationId,
      retry: 1,
      onError: (error) => {
        console.log('Organization API error:', error.message);
      }
    }
  );

  // Fetch comprehensive dashboard data using REAL admin/dashboard endpoint
  const { data: dashboardData, isLoading: dashboardDataLoading } = useQuery(
    ['org-dashboard-data', organizationId],
    async () => {
      try {
        console.log(`🔄 Fetching ORGANIZATION-SPECIFIC dashboard for ${organizationName} (${organizationId})`);
        // Uses: GET /admin/dashboard?organizationId={organizationId}
        // Returns: Organization details, properties, investments, transactions, liquidity, investors
        const response = await organizationsAPI.getDashboard(organizationId);
        console.log(`✅ Dashboard Data for ${organizationName}:`, response.data);
        return response;
      } catch (error) {
        console.error(`❌ Dashboard fetch error for ${organizationName}:`, error);
        return null;
      }
    },
    { 
      enabled: isAuthenticated && !!organizationId,
      retry: 1
    }
  );

  // Fetch organization transactions to count (ORGANIZATION-SPECIFIC ONLY!)
  const { data: transactionsData, error: transactionsError } = useQuery(
    ['org-transactions-count', organizationId],
    async () => {
      console.log(`💳 Fetching ONLY ${organizationName} transactions (organizationId: ${organizationId})`);
      const response = await organizationsAPI.getTransactions(organizationId);
      const transactions = response.data?.transactions || response.data?.data?.transactions || response.data || [];
      console.log(`✅ Fetched ${Array.isArray(transactions) ? transactions.length : 0} transactions for ${organizationName} (${organizationId})`);
      return response;
    },
    { 
      enabled: isAuthenticated && !!organizationId,
      retry: 1,
      onError: (error) => {
        console.error(`❌ Transactions fetch error for ${organizationName}:`, error);
        console.error('Error details:', error.response?.data || error.message);
      }
    }
  );

  // Fetch organization liquidity/analytics
  const { data: liquidityData } = useQuery(
    ['org-liquidity', organizationId],
    async () => {
      try {
        console.log('🔄 Fetching liquidity analytics for organization:', organizationId);
        const response = await organizationsAPI.getLiquidity(organizationId);
        console.log('✅ Liquidity data:', response);
        return response;
      } catch (error) {
        console.log('ℹ️ Liquidity endpoint error:', error.message);
        return null;
      }
    },
    { 
      enabled: isAuthenticated && !!organizationId,
      retry: 1
    }
  );

  // Fetch properties - use dashboard data if available, otherwise fetch separately
  const { data: propertiesCountData } = useQuery(
    ['org-properties-count', organizationId],
    async () => {
      try {
        console.log(`🏢 Fetching ONLY ${organizationName} properties (organizationId: ${organizationId})`);
        // Use admin API with organizationId filter (REAL ENDPOINT)
        const response = await adminAPI.getProperties({ organizationId, limit: 1000 });
        const properties = response.data?.properties || response.data?.data?.properties || response.data || [];
        console.log(`✅ Fetched ${Array.isArray(properties) ? properties.length : 0} properties for ${organizationName} (${organizationId})`);
        return response;
      } catch (error) {
        console.error(`❌ Properties fetch error for ${organizationName}:`, error);
        return { data: [] };
      }
    },
    { 
      enabled: isAuthenticated && !!organizationId && !dashboardDataLoading,
      retry: 1
    }
  );

  // Fetch users - use admin API with organizationId filter
  const { data: usersCountData } = useQuery(
    ['org-users-count', organizationId],
    async () => {
      try {
        console.log(`👥 Fetching ONLY ${organizationName} users (organizationId: ${organizationId})`);
        // Use admin API with organizationId filter (REAL ENDPOINT)
        const response = await adminAPI.getUsers({ organizationId, limit: 1000 });
        const users = response.data?.users || response.data?.data?.users || response.data || [];
        console.log(`✅ Fetched ${Array.isArray(users) ? users.length : 0} users for ${organizationName} (${organizationId})`);
        return response;
      } catch (error) {
        console.error(`❌ Users fetch error for ${organizationName}:`, error);
        return { data: [] };
      }
    },
    { 
      enabled: isAuthenticated && !!organizationId && !dashboardDataLoading,
      retry: 1
    }
  );

  // Fetch investments - use admin API with organizationId filter
  const { data: investmentsCountData } = useQuery(
    ['org-investments-count', organizationId],
    async () => {
      try {
        console.log(`💰 Fetching ONLY ${organizationName} investments (organizationId: ${organizationId})`);
        // Use admin API with organizationId filter (REAL ENDPOINT)
        const response = await adminAPI.getInvestments({ organizationId, limit: 1000 });
        const investments = response.data?.investments || response.data?.data?.investments || response.data || [];
        console.log(`✅ Fetched ${Array.isArray(investments) ? investments.length : 0} investments for ${organizationName} (${organizationId})`);
        return response;
      } catch (error) {
        console.error(`❌ Investments fetch error for ${organizationName}:`, error);
        return { data: [] };
      }
    },
    { 
      enabled: isAuthenticated && !!organizationId && !dashboardDataLoading,
      retry: 1
    }
  );

  // Calculate statistics from fetched data
  const transactions = transactionsData?.data?.transactions || 
                      transactionsData?.data?.data?.transactions || 
                      transactionsData?.data || 
                      [];
  const properties = propertiesCountData?.data?.properties || 
                    propertiesCountData?.data?.data?.properties || 
                    propertiesCountData?.data || 
                    [];
  const users = usersCountData?.data?.users || 
               usersCountData?.data?.data?.users || 
               usersCountData?.data || 
               [];
  const investments = investmentsCountData?.data?.investments || 
                     investmentsCountData?.data?.data?.investments || 
                     investmentsCountData?.data || 
                     [];
  
  // Parse dashboard data from /admin/dashboard?organizationId={id}
  // According to API docs, returns: Organization details, properties, investments, transactions, liquidity, investors
  const dashboardStats = dashboardData?.data || null;
  const dashboardOrgData = dashboardStats?.organization || null;
  const dashboardProperties = dashboardStats?.properties || [];
  const dashboardInvestments = dashboardStats?.investments || [];
  const dashboardTransactions = dashboardStats?.transactions || [];
  const dashboardInvestors = dashboardStats?.investors || [];
  const dashboardLiquidity = dashboardStats?.liquidity || null;
  
  console.log('📊 Dashboard API Response (GET /admin/dashboard?organizationId=' + organizationId + '):', {
    hasDashboardData: !!dashboardStats,
    organizationDetails: dashboardOrgData,
    propertiesCount: Array.isArray(dashboardProperties) ? dashboardProperties.length : 0,
    investmentsCount: Array.isArray(dashboardInvestments) ? dashboardInvestments.length : 0,
    transactionsCount: Array.isArray(dashboardTransactions) ? dashboardTransactions.length : 0,
    investorsCount: Array.isArray(dashboardInvestors) ? dashboardInvestors.length : 0,
    liquidity: dashboardLiquidity,
    fullData: dashboardStats
  });
  
  // Debug logging - ORGANIZATION-SPECIFIC DATA ONLY
  console.log(`📊 ${organizationName} (${organizationId}) - ORGANIZATION-SPECIFIC Data Summary:`, {
    organizationId,
    organizationName,
    note: '⚠️ ALL DATA IS FILTERED FOR THIS ORGANIZATION ONLY!',
    transactions: {
      count: Array.isArray(transactions) ? transactions.length : 0,
      note: `Only ${organizationName}'s transactions`,
      data: transactions
    },
    properties: {
      count: Array.isArray(properties) ? properties.length : 0,
      note: `Only ${organizationName}'s properties`,
      data: properties
    },
    users: {
      count: Array.isArray(users) ? users.length : 0,
      note: `Only ${organizationName}'s users`,
      data: users
    },
    investments: {
      count: Array.isArray(investments) ? investments.length : 0,
      note: `Only ${organizationName}'s investments`,
      data: investments
    }
  });
  
  // Prioritize dashboard data from /admin/dashboard?organizationId={id}
  // If dashboard data exists, use it; otherwise calculate from individual endpoints
  const stats = dashboardStats ? {
    // Use dashboard endpoint data (from /admin/dashboard?organizationId={id})
    totalUsers: Array.isArray(dashboardInvestors) ? dashboardInvestors.length : (Array.isArray(users) ? users.length : 0),
    totalProperties: Array.isArray(dashboardProperties) ? dashboardProperties.length : (Array.isArray(properties) ? properties.length : 0),
    totalTransactions: Array.isArray(dashboardTransactions) ? dashboardTransactions.length : (Array.isArray(transactions) ? transactions.length : 0),
    totalInvestments: Array.isArray(dashboardInvestments) 
      ? dashboardInvestments.reduce((sum, inv) => sum + parseFloat(inv.amountUSDT || inv.amount || inv.invested_amount || 0), 0)
      : (Array.isArray(investments) ? investments.reduce((sum, inv) => sum + parseFloat(inv.amount || inv.invested_amount || 0), 0) : 0),
    totalInvestmentCount: Array.isArray(dashboardInvestments) ? dashboardInvestments.length : (Array.isArray(investments) ? investments.length : 0),
    totalTransactionAmount: Array.isArray(dashboardTransactions) 
      ? dashboardTransactions.reduce((sum, tx) => sum + parseFloat(tx.amountUSDT || tx.amount || 0), 0)
      : (Array.isArray(transactions) ? transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0) : 0),
    activeInvestments: Array.isArray(dashboardInvestments) 
      ? dashboardInvestments.filter(inv => inv.status === 'confirmed' || inv.status === 'active').length
      : (Array.isArray(investments) ? investments.filter(inv => inv.status === 'active' || inv.status === 'approved').length : 0),
    pendingInvestments: Array.isArray(dashboardInvestments) 
      ? dashboardInvestments.filter(inv => inv.status === 'pending').length
      : (Array.isArray(investments) ? investments.filter(inv => inv.status === 'pending').length : 0),
    totalPropertyValue: Array.isArray(dashboardProperties) 
      ? dashboardProperties.reduce((sum, prop) => sum + parseFloat(prop.totalValueUSDT || prop.price || prop.totalValue || 0), 0)
      : (Array.isArray(properties) ? properties.reduce((sum, prop) => sum + parseFloat(prop.price || prop.totalValue || 0), 0) : 0),
    liquidityData: dashboardLiquidity || liquidityData?.data?.data || liquidityData?.data || null,
    organizationDetails: dashboardOrgData
  } : {
    // Calculate from individual endpoints (fallback)
    totalUsers: Array.isArray(users) ? users.length : 0,
    totalProperties: Array.isArray(properties) ? properties.length : 0,
    totalTransactions: Array.isArray(transactions) ? transactions.length : 0,
    totalInvestments: Array.isArray(investments) 
      ? investments.reduce((sum, inv) => sum + parseFloat(inv.amount || inv.invested_amount || 0), 0)
      : 0,
    totalInvestmentCount: Array.isArray(investments) ? investments.length : 0,
    totalTransactionAmount: Array.isArray(transactions) 
      ? transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0) 
      : 0,
    activeInvestments: Array.isArray(investments) 
      ? investments.filter(inv => inv.status === 'active' || inv.status === 'approved' || inv.status === 'confirmed').length 
      : 0,
    pendingInvestments: Array.isArray(investments) 
      ? investments.filter(inv => inv.status === 'pending').length 
      : 0,
    totalPropertyValue: Array.isArray(properties) 
      ? properties.reduce((sum, prop) => sum + parseFloat(prop.totalValueUSDT || prop.price || prop.totalValue || 0), 0) 
      : 0,
    liquidityData: liquidityData?.data?.data || liquidityData?.data || null,
    organizationDetails: null
  };
  
  console.log(`📈 ${organizationName} (${organizationId}) - Final ORGANIZATION-SPECIFIC Stats (using ${dashboardStats ? 'DASHBOARD' : 'INDIVIDUAL'} endpoints):`, {
    ...stats,
    note: `⚠️ These are ONLY for ${organizationName}, NOT totals across all organizations!`,
    dataSource: dashboardStats ? 'Dashboard API' : 'Individual Organization APIs'
  });

  const dashboardLoading = orgLoading;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'investments', label: 'Investments', icon: TrendingUp }
  ];

  // Format currency
  const formatCurrency = (amount, currency = 'USDT') => {
    if (!amount) return `0 ${currency}`;
    return `${parseFloat(amount).toLocaleString()} ${currency}`;
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, color = 'blue', onClick }) => (
    <Card 
      className={`p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br from-${color}-100 to-${color}-200`}>
          <Icon className={`w-8 h-8 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );

  const handleLogout = () => {
    logout();
    navigate('/org/login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'properties':
        return <OrgPropertiesManagement organizationId={organizationId} />;
      case 'users':
        return <OrgUsersManagement organizationId={organizationId} />;
      case 'transactions':
        return <OrgTransactionsManagement organizationId={organizationId} />;
      case 'investments':
        return <OrgInvestmentsManagement organizationId={organizationId} />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Primary Stats Grid - ORGANIZATION-SPECIFIC */}
      <div className="mb-2">
        <p className="text-xs text-gray-500 font-medium flex items-center">
          <span className="mr-2">🏢</span>
          Showing data for <span className="mx-1 font-bold text-blue-600">{organizationName}</span> only (Organization ID: {organizationId})
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={`${organizationName} Users`}
          value={stats.totalUsers || 0}
          icon={Users}
          color="blue"
          onClick={() => setActiveTab('users')}
        />
        <StatCard
          title={`${organizationName} Properties`}
          value={stats.totalProperties || 0}
          icon={Building2}
          color="green"
          onClick={() => setActiveTab('properties')}
        />
        <StatCard
          title={`${organizationName} Investments`}
          value={formatCurrency(stats.totalInvestments || 0)}
          icon={TrendingUp}
          color="purple"
          onClick={() => setActiveTab('investments')}
        />
        <StatCard
          title={`${organizationName} Transactions`}
          value={stats.totalTransactions || 0}
          icon={DollarSign}
          color="orange"
          onClick={() => setActiveTab('transactions')}
        />
      </div>

      {/* Secondary Stats Grid - Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Investment Count</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalInvestmentCount || 0}
            </p>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-green-600">✓ Active: {stats.activeInvestments || 0}</span>
              <span className="text-gray-400">|</span>
              <span className="text-yellow-600">⏳ Pending: {stats.pendingInvestments || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Transaction Amount</span>
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalTransactionAmount || 0)}
            </p>
            <p className="text-xs text-gray-500">
              Total value of all transactions
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Property Value</span>
              <Building2 className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalPropertyValue || 0)}
            </p>
            <p className="text-xs text-gray-500">
              Combined value of all properties
            </p>
          </div>
        </Card>
      </div>

      {/* Organization Info Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Welcome to {organizationName} Dashboard
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your properties, users, investments, and transactions all in one place.
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="blue" className="text-xs">
                  Organization ID: {organizationId}
                </Badge>
                {organizationUser?.backendOrganizationName && (
                  <span className="text-xs text-gray-500">
                    Backend: {organizationUser.backendOrganizationName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Logged in as</div>
            <div className="text-sm font-medium text-gray-900">{organizationUser?.email}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('properties')}
            className="flex items-center justify-center space-x-2 py-4"
          >
            <Building2 className="w-5 h-5" />
            <span>View Properties</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('users')}
            className="flex items-center justify-center space-x-2 py-4"
          >
            <Users className="w-5 h-5" />
            <span>View Users</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('investments')}
            className="flex items-center justify-center space-x-2 py-4"
          >
            <TrendingUp className="w-5 h-5" />
            <span>View Investments</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('transactions')}
            className="flex items-center justify-center space-x-2 py-4"
          >
            <DollarSign className="w-5 h-5" />
            <span>View Transactions</span>
          </Button>
        </div>
      </Card>

      {/* API Status & Data Sources (Debug Info) */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center">
            <span className="mr-2">📡</span> Organization-Specific API Status
          </h3>
          <Badge variant="green" className="text-xs">
            Filtered by {organizationId}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 mb-4 font-medium">
          ⚠️ All endpoints below return data ONLY for <span className="text-blue-600 font-bold">{organizationName}</span>, not totals
        </p>
        
        {/* Primary Dashboard Endpoint */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-blue-900">📊 Dashboard API (Primary)</span>
            <span className={`text-xs ${dashboardStats ? 'text-green-600' : 'text-gray-400'}`}>
              {dashboardStats ? '✓ Active' : '○ Not Used'}
            </span>
          </div>
          <div className="text-xs text-blue-700 mt-1 font-mono">
            GET /admin/dashboard?organizationId={organizationId}
          </div>
          {dashboardStats && (
            <div className="text-xs text-blue-600 mt-2">
              Returns: Properties, Investments, Transactions, Investors, Liquidity
            </div>
          )}
        </div>
        
        {/* Individual Endpoints */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Properties</span>
              <span className={`text-xs ${stats.totalProperties > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {stats.totalProperties > 0 ? '✓' : '○'}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {stats.totalProperties} {organizationName} properties
            </div>
            <div className="text-xs text-gray-500 mt-1 font-mono truncate">
              {dashboardStats ? 'Dashboard' : 'GET /admin/users?orgId=...'}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Investors</span>
              <span className={`text-xs ${stats.totalUsers > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {stats.totalUsers > 0 ? '✓' : '○'}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {stats.totalUsers} {organizationName} investors
            </div>
            <div className="text-xs text-gray-500 mt-1 font-mono truncate">
              {dashboardStats ? 'Dashboard' : 'GET /admin/users?orgId=...'}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Investments</span>
              <span className={`text-xs ${stats.totalInvestmentCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {stats.totalInvestmentCount > 0 ? '✓' : '○'}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {stats.totalInvestmentCount} {organizationName} investments
            </div>
            <div className="text-xs text-gray-500 mt-1 font-mono truncate">
              {dashboardStats ? 'Dashboard' : 'GET /admin/inv?orgId=...'}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Transactions</span>
              <span className={`text-xs ${stats.totalTransactions > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {stats.totalTransactions > 0 ? '✓' : '○'}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {stats.totalTransactions} {organizationName} transactions
            </div>
            <div className="text-xs text-gray-500 mt-1 font-mono truncate">
              GET /orgs/{organizationId}/tx
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="text-gray-600">
              <span className="font-medium">Data Source:</span> {dashboardStats ? 'Dashboard API' : 'Individual Org APIs'}
            </span>
            <span className="text-gray-600 font-medium flex items-center">
              <span className="mr-1">🏢</span>
              <span className="font-medium">Organization:</span> <span className="ml-1 text-blue-600">{organizationId}</span>
            </span>
            <span className="text-gray-600">
              <span className="font-medium">Last Updated:</span> {new Date().toLocaleTimeString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
            ✅ All data above is filtered to show <strong>{organizationName}</strong> only - No data from other organizations is included!
          </div>
        </div>
      </Card>

      {dashboardLoading && (
        <Card className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading dashboard data...</span>
          </div>
        </Card>
      )}
    </div>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{organizationName}</h1>
                <p className="text-sm text-gray-500">Organization Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="blue" className="text-sm px-4 py-2">
                {organizationSlug.toUpperCase()}
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>{organizationUser?.email}</span>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Info Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5" />
              <div>
                <p className="text-sm font-semibold">
                  🏢 {organizationName} Organization
                </p>
                <p className="text-xs opacity-90">
                  Viewing data for {organizationName} only
                </p>
              </div>
            </div>
            <Badge className="bg-white text-blue-600 font-semibold">
              {organizationSlug.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-2 overflow-x-auto">
          <nav className="flex space-x-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default OrgDashboard;

