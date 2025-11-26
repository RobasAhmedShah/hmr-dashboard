import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Settings,
  BarChart3,
  Shield,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Award
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ThemeToggle from '../../components/ThemeToggle';
import AdminSidebar from '../../components/admin/AdminSidebar';
import MetricCards from '../../components/admin/MetricCards';
import InvestmentChart from '../../components/admin/InvestmentChart';
import { adminAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';
import PropertiesManagement from './PropertiesManagement';
import UsersManagement from './UsersManagement';
import TransactionsManagement from './TransactionsManagement';
import InvestmentsManagement from './InvestmentsManagement';
import OrganizationsManagement from './OrganizationsManagement';
import AdminSettings from './AdminSettings';
import TokensManagement from './TokensManagement';
import ReportsManagement from './ReportsManagement';
import KYCManagement from './KYCManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsFilter, setAnalyticsFilter] = useState({
    period: '30d',
    from: null,
    to: null
  });
  const { adminUser, isAuthenticated, logout } = useAdminAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch dashboard statistics
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery(
    'admin-dashboard',
    () => adminAPI.getDashboard(),
    { 
      refetchInterval: 30000,
      enabled: isAuthenticated,
      retry: 1,
      onError: (error) => {
        console.log('Dashboard API not yet implemented:', error.message);
      }
    }
  );

  // Fetch analytics data with filters
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery(
    ['admin-analytics', analyticsFilter],
    () => adminAPI.getAnalytics(analyticsFilter),
    { 
      refetchInterval: 60000,
      enabled: isAuthenticated && activeTab === 'overview',
      retry: 1,
      onError: (error) => {
        console.log('Analytics API Error:', error.message);
      }
    }
  );

  // Fetch all investments to calculate total investment value
  const { data: investmentsData } = useQuery(
    ['admin-all-investments'],
    () => adminAPI.getInvestments({ limit: 10000 }),
    {
      enabled: isAuthenticated && activeTab === 'overview',
      retry: 1,
      onError: (error) => {
        console.log('Investments fetch error:', error.message);
      }
    }
  );

  // Fetch all properties to get accurate count
  const { data: propertiesData } = useQuery(
    ['admin-all-properties'],
    () => adminAPI.getProperties({ limit: 10000 }),
    {
      enabled: isAuthenticated && activeTab === 'overview',
      retry: 1,
      onError: (error) => {
        console.log('Properties fetch error:', error.message);
      }
    }
  );

  // Fetch all users to get accurate count (active users)
  const { data: usersData } = useQuery(
    ['admin-all-users'],
    () => adminAPI.getUsers({ limit: 10000, include_inactive: false }),
    {
      enabled: isAuthenticated && activeTab === 'overview',
      retry: 1,
      onError: (error) => {
        console.log('Users fetch error:', error.message);
      }
    }
  );

  // Fetch all transactions to get accurate count
  const { data: transactionsData } = useQuery(
    ['admin-all-transactions'],
    () => adminAPI.getTransactions({ limit: 10000 }),
    {
      enabled: isAuthenticated && activeTab === 'overview',
      retry: 1,
      onError: (error) => {
        console.log('Transactions fetch error:', error.message);
      }
    }
  );

  // Fetch all organizations to get accurate count
  const { data: organizationsData } = useQuery(
    ['admin-all-organizations'],
    () => adminAPI.getOrganizations({ limit: 10000 }),
    {
      enabled: isAuthenticated && activeTab === 'overview',
      retry: 1,
      onError: (error) => {
        console.log('Organizations fetch error:', error.message);
      }
    }
  );

  // Fetch all KYC data to calculate approved/unapproved counts
  const { data: kycData } = useQuery(
    ['admin-all-kyc'],
    () => adminAPI.getAllKYC({ limit: 10000 }),
    {
      enabled: isAuthenticated && activeTab === 'overview',
      retry: 1,
      onError: (error) => {
        console.log('KYC fetch error:', error.message);
      }
    }
  );

  // Parse analytics data
  const analytics = analyticsData?.data?.data || analyticsData?.data || {};
  const stats = dashboardData?.data?.data || dashboardData?.data || {};
  
  // Extract arrays from API responses
  const investments = investmentsData?.data?.data?.investments || 
                     investmentsData?.data?.investments || 
                     investmentsData?.data || 
                     (Array.isArray(investmentsData) ? investmentsData : []);
  
  const properties = propertiesData?.data?.data?.properties || 
                    propertiesData?.data?.properties || 
                    propertiesData?.data || 
                    (Array.isArray(propertiesData) ? propertiesData : []);
  
  const users = usersData?.data?.data?.users || 
               usersData?.data?.users || 
               usersData?.data || 
               (Array.isArray(usersData) ? usersData : []);
  
  const transactions = transactionsData?.data?.data?.transactions || 
                      transactionsData?.data?.transactions || 
                      transactionsData?.data || 
                      (Array.isArray(transactionsData) ? transactionsData : []);
  
  const organizations = organizationsData?.data?.data?.organizations || 
                       organizationsData?.data?.organizations || 
                       organizationsData?.data || 
                       (Array.isArray(organizationsData) ? organizationsData : []);
  
  const kycList = kycData?.data?.data || 
                  kycData?.data || 
                  (Array.isArray(kycData) ? kycData : []);

  console.log('📊 Analytics Data:', {
    raw: analyticsData,
    parsed: analytics,
    filter: analyticsFilter
  });

  // Removed tabs - using sidebar navigation now

  const periodOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  // Format currency
  const formatCurrency = (amount, currency = 'USDT') => {
    if (!amount) return `0 ${currency}`;
    return `${parseFloat(amount).toLocaleString()} ${currency}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Stat Card Component
  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue', 
    change, 
    changeType = 'positive', 
    onClick,
    subtitle 
  }) => {
    const colorClasses = {
      blue: 'from-blue-500/20 to-blue-600/20',
      green: 'from-green-500/20 to-green-600/20',
      purple: 'from-purple-500/20 to-purple-600/20',
      yellow: 'from-yellow-500/20 to-yellow-600/20',
    };

    const iconColorClasses = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      purple: 'text-purple-500',
      yellow: 'text-yellow-500',
    };

    return (
      <Card 
        className={`p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-card-foreground mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {change !== undefined && change !== null && (
              <div className={`flex items-center mt-2 text-sm font-semibold ${
                changeType === 'positive' ? 'text-green-400' : 
                changeType === 'negative' ? 'text-red-400' : 'text-muted-foreground'
              }`}>
                {changeType === 'positive' ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : changeType === 'negative' ? (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                ) : null}
                <span>{Math.abs(change).toFixed(1)}% vs previous period</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color] || colorClasses.blue}`}>
            <Icon className={`w-8 h-8 ${iconColorClasses[color] || iconColorClasses.blue}`} />
          </div>
        </div>
      </Card>
    );
  };

  // Mini Line Chart Component (unused - commented out)
  // const MiniLineChart = ({ data, color = 'blue' }) => {
  //   if (!data || data.length === 0) return null;
  //   const max = Math.max(...data.map(d => parseFloat(d.count || d.volume || 0)));
  //   const points = data.map((d, i) => {
  //     const x = (i / (data.length - 1)) * 100;
  //     const y = 100 - ((parseFloat(d.count || d.volume || 0) / max) * 100);
  //     return `${x},${y}`;
  //   }).join(' ');
  //   return (
  //     <svg className="w-full h-16" viewBox="0 0 100 100" preserveAspectRatio="none">
  //       <polyline
  //         fill="none"
  //         stroke={color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : color === 'purple' ? '#8B5CF6' : '#F59E0B'}
  //         strokeWidth="2"
  //         points={points}
  //       />
  //     </svg>
  //   );
  // };

  // Time Series Chart Component
  const TimeSeriesChart = ({ data, title, color = 'blue', valueKey = 'count', showVolume = false }) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No data available</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => parseFloat(d[valueKey] || 0)));
    const maxVolume = showVolume ? Math.max(...data.map(d => parseFloat(d.volume || 0))) : 0;

    const barColors = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      yellow: 'bg-yellow-500 hover:bg-yellow-600',
    };

    const barLightColors = {
      blue: 'bg-blue-400/30',
      green: 'bg-green-400/30',
      purple: 'bg-purple-400/30',
      yellow: 'bg-yellow-400/30',
    };

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-card-foreground">{title}</h4>
        <div className="relative h-48">
          {data.map((item, index) => {
            const value = parseFloat(item[valueKey] || 0);
            const volume = parseFloat(item.volume || 0);
            const height = (value / maxValue) * 100;
            const volumeHeight = showVolume ? (volume / maxVolume) * 100 : 0;

            return (
              <div
                key={index}
                className="absolute bottom-0 flex flex-col items-center"
                style={{ 
                  left: `${(index / (data.length - 1)) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {showVolume && (
                  <div
                    className={`w-2 rounded-t ${barLightColors[color] || barLightColors.blue}`}
                    style={{ height: `${volumeHeight}px` }}
                  />
                )}
                <div
                  className={`w-3 rounded-t transition-all ${barColors[color] || barColors.blue}`}
                  style={{ height: `${height}px` }}
                  title={`${formatDate(item.date)}: ${value}${showVolume ? ` / ${formatCurrency(volume)}` : ''}`}
                />
                {index % Math.ceil(data.length / 5) === 0 && (
                  <span className="text-xs text-muted-foreground mt-1">{formatDate(item.date)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Overview Tab
  const renderOverview = () => {
    const aggregated = analytics?.aggregated || {};
    const timeSeries = analytics?.timeSeries || {};
    const comparison = analytics?.comparison || {};
    const changePercentage = comparison?.changePercentage || {};

    // Calculate total investment value from investments table
    let totalInvestmentValue = 0;
    if (investments.length > 0) {
      totalInvestmentValue = investments.reduce((sum, inv) => {
        const amount = parseFloat(
          inv.amountUSDT || 
          inv.amount_usdt || 
          inv.amount || 
          inv.invested_amount || 
          inv.investmentAmount || 
          0
        );
        return sum + amount;
      }, 0);
    } else {
      // Fallback to aggregated data if investments array is empty
      totalInvestmentValue = parseFloat(aggregated?.investments?.totalValue || stats?.totalInvestmentVolume || 0);
    }
    // Use actual counts from fetched data, fallback to stats if not available
    const totalProperties = properties.length > 0 ? properties.length : parseInt(stats?.totalProperties || 0);
    const totalUsers = users.length > 0 ? users.length : parseInt(stats?.totalUsers || aggregated?.users?.total || 0);
    const totalTransactions = transactions.length > 0 ? transactions.length : parseInt(aggregated?.transactions?.total || 0);
    const totalOrganizations = organizations.length > 0 ? organizations.length : parseInt(stats?.totalOrganizations || 0);
    const totalInvestments = parseInt(aggregated?.investments?.count || 0);
    
    // Prepare chart data - use real investment trends
    const investmentTrendData = timeSeries?.investments || [];
    
    // Calculate property type breakdown from properties data
    const propertyTypeCounts = {
      residential: 0,
      commercial: 0,
      'mixed-use': 0,
      other: 0
    };
    
    properties.forEach(property => {
      const propertyType = (property.type || property.property_type || property.propertyType || '').toLowerCase();
      if (propertyType === 'residential') {
        propertyTypeCounts.residential++;
      } else if (propertyType === 'commercial') {
        propertyTypeCounts.commercial++;
      } else if (propertyType === 'mixed-use' || propertyType === 'mixed_use' || propertyType === 'mixeduse') {
        propertyTypeCounts['mixed-use']++;
      } else if (propertyType) {
        propertyTypeCounts.other++;
      }
    });
    
    const residentialCount = propertyTypeCounts.residential;
    const commercialCount = propertyTypeCounts.commercial;
    const mixedUseCount = propertyTypeCounts['mixed-use'];
    const totalPropertyTypes = residentialCount + commercialCount + mixedUseCount;
    
    // Calculate total available tokens from all properties
    const totalAvailableTokens = properties.reduce((sum, property) => {
      const availableTokens = parseFloat(
        property.availableTokens || 
        property.available_tokens || 
        property.tokenization_available_tokens || 
        0
      );
      return sum + availableTokens;
    }, 0);
    
    // Calculate available tokens per property for bar chart (show top properties or distribute)
    const tokensPerProperty = properties
      .map(property => {
        return parseFloat(
          property.availableTokens || 
          property.available_tokens || 
          property.tokenization_available_tokens || 
          0
        );
      })
      .filter(tokens => tokens > 0)
      .sort((a, b) => b - a)
      .slice(0, 7); // Take top 7 for the 7 months display
    
    // If we have less than 7 properties, fill with zeros or distribute total
    const tokensChartData = tokensPerProperty.length > 0 
      ? tokensPerProperty.length < 7
        ? [...tokensPerProperty, ...Array(7 - tokensPerProperty.length).fill(0)]
        : tokensPerProperty
      : [0, 0, 0, 0, 0, 0, 0];
    
    // Calculate KYC approved and unapproved counts
    const kycApproved = kycList.filter(kyc => 
      (kyc.status || '').toLowerCase() === 'verified' || 
      (kyc.status || '').toLowerCase() === 'approved'
    ).length;
    
    const kycUnapproved = kycList.filter(kyc => {
      const status = (kyc.status || '').toLowerCase();
      return status === 'pending' || 
             status === 'rejected' || 
             status === 'unapproved' ||
             (!status || status === '');
    }).length;
    
    // Format date for header
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    return (
      <div className="h-[calc(100vh-140px)] flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-blue-950/30 dark:to-purple-950/20">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-1">{currentDate}</p>
          </div>
        </div>

        {/* Top Row: Large Blue Card + 4 Small Cards */}
        <div className="grid grid-cols-12 gap-3 mb-3 flex-shrink-0" style={{ minHeight: '140px', maxHeight: '180px' }}>
          {/* Total Investment - Large Blue Card */}
          <div 
            onClick={() => setActiveTab('investments')}
            className="col-span-4 bg-gradient-to-br from-blue-600/80 to-blue-700/80 dark:from-blue-700/80 dark:to-blue-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 rounded-3xl shadow-lg text-white flex flex-col min-h-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-start gap-2 mb-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="px-2 py-0.5 bg-green-500 rounded-full text-[10px] font-bold">
                +{changePercentage?.investments?.toFixed(1) || '100.0'}%
              </div>
            </div>
            <div className="text-xs opacity-90">Total Investment</div>
            <div className="text-3xl font-extrabold mt-1">
              ${totalInvestmentValue.toFixed(6)}
            </div>
            <div className="text-[10px] opacity-75 mt-1">Investments vs last month</div>
          </div>

          {/* Total Properties */}
          <div 
            onClick={() => setActiveTab('properties')}
            className="col-span-2 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10 p-3 rounded-3xl shadow-lg flex flex-col justify-between min-h-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-[10px] font-bold">
                +0.5%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Total Properties</div>
              <div className="text-xl font-extrabold text-card-foreground mt-0.5">
                {totalProperties}
              </div>
              <div className="text-[9px] text-muted-foreground">Properties vs last month</div>
            </div>
          </div>

          {/* Total Users */}
          <div 
            onClick={() => setActiveTab('users')}
            className="col-span-2 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10 p-3 rounded-3xl shadow-lg flex flex-col justify-between min-h-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="p-1.5 bg-green-500/10 rounded-lg">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div className="px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-[10px] font-bold">
                +0.5%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Total Users</div>
              <div className="text-xl font-extrabold text-card-foreground mt-0.5">
                {totalUsers}
              </div>
              <div className="text-[9px] text-muted-foreground">Active users vs last month</div>
            </div>
          </div>

          {/* Total Organizations */}
          <div 
            onClick={() => setActiveTab('organizations')}
            className="col-span-2 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10 p-3 rounded-3xl shadow-lg flex flex-col justify-between min-h-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="p-1.5 bg-red-500/10 rounded-lg">
                <Building2 className="w-4 h-4 text-red-600" />
              </div>
              <div className="px-1.5 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-[10px] font-bold">
                -2.03%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Total Organizations</div>
              <div className="text-xl font-extrabold text-card-foreground mt-0.5">
                {totalOrganizations}
              </div>
              <div className="text-[9px] text-muted-foreground">Organizations vs last month</div>
            </div>
          </div>

          {/* Total Transactions */}
          <div 
            onClick={() => setActiveTab('transactions')}
            className="col-span-2 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10 p-3 rounded-3xl shadow-lg flex flex-col justify-between min-h-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="p-1.5 bg-green-500/10 rounded-lg">
                <Activity className="w-4 h-4 text-green-600" />
              </div>
              <div className="px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-[10px] font-bold">
                +0.5%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Total Transactions</div>
              <div className="text-xl font-extrabold text-card-foreground mt-0.5">
                {totalTransactions}
              </div>
              <div className="text-[9px] text-muted-foreground">Transactions vs last month</div>
            </div>
          </div>
        </div>

        {/* Bottom Row - 3 Cards */}
        <div className="grid grid-cols-3 gap-3 flex-1 min-h-0 overflow-hidden">
          {/* Customer Habits - Bar Chart (Total Available Tokens) */}
          <div 
            onClick={() => setActiveTab('tokens')}
            className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10 p-4 rounded-3xl shadow-lg flex flex-col min-h-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-card-foreground">Total Available Tokens</h3>
              <div className="text-[10px] text-muted-foreground">This year</div>
            </div>
            
            <div className="flex gap-1.5 items-end flex-1 min-h-0">
              {tokensChartData.map((tokens, i) => {
                const maxValue = Math.max(...tokensChartData, 1);
                const height = maxValue > 0 ? Math.max(5, Math.min(100, (tokens / maxValue) * 100)) : 0;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-end relative group h-full">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-t-lg transition-all duration-500"
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-900 dark:bg-gray-700 text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none transition-opacity whitespace-nowrap">
                        {tokens > 0 ? tokens.toLocaleString() : '0'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-muted-foreground">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
            </div>
          </div>

          {/* Investment Statistic - Donut Chart */}
          <div 
            onClick={() => setActiveTab('investments')}
            className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10 p-4 rounded-3xl shadow-lg flex flex-col min-h-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-card-foreground">Investment Statistic</h3>
              <div className="text-[10px] text-muted-foreground">Today</div>
            </div>
            
            <div className="flex items-center gap-3 flex-1">
              {/* Donut Chart */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                  {/* Background */}
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" className="dark:stroke-gray-700" strokeWidth="3.8" />
                  {/* Blue segment - Residential */}
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="url(#blueGrad)" strokeWidth="3.8" 
                    strokeDasharray={`${totalPropertyTypes > 0 ? (residentialCount / totalPropertyTypes * 100) : 0} ${totalPropertyTypes > 0 ? (100 - residentialCount / totalPropertyTypes * 100) : 100}`} 
                    strokeLinecap="round" />
                  {/* Green segment - Commercial */}
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="url(#greenGrad)" strokeWidth="3.8" 
                    strokeDasharray={`${totalPropertyTypes > 0 ? (commercialCount / totalPropertyTypes * 100) : 0} ${totalPropertyTypes > 0 ? (100 - commercialCount / totalPropertyTypes * 100) : 100}`} 
                    strokeDashoffset={`-${totalPropertyTypes > 0 ? (residentialCount / totalPropertyTypes * 100) : 0}`}
                    strokeLinecap="round" />
                  {/* Gray segment - Mixed-Use */}
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#9ca3af" className="dark:stroke-gray-500" strokeWidth="3.8" 
                    strokeDasharray={`${totalPropertyTypes > 0 ? (mixedUseCount / totalPropertyTypes * 100) : 0} ${totalPropertyTypes > 0 ? (100 - mixedUseCount / totalPropertyTypes * 100) : 100}`} 
                    strokeDashoffset={`-${totalPropertyTypes > 0 ? ((residentialCount + commercialCount) / totalPropertyTypes * 100) : 0}`}
                    strokeLinecap="round" />
                </svg>
              </div>
              
              <div className="flex-1">
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      Residential
                    </span>
                    <span className="font-bold text-card-foreground">{residentialCount}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Commercial
                    </span>
                    <span className="font-bold text-card-foreground">{commercialCount}</span>
                  </div>
                  {mixedUseCount > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                        Mixed-Use
                      </span>
                      <span className="font-bold text-card-foreground">{mixedUseCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Growth - KYC Status */}
          <div 
            onClick={() => setActiveTab('kyc')}
            className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10 p-4 rounded-3xl shadow-lg flex flex-col min-h-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-card-foreground">KYC Status</h3>
              <div className="text-[10px] text-muted-foreground">Today</div>
            </div>
            
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-card-foreground text-sm">{kycApproved}</span>
                </div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-card-foreground text-sm">{kycUnapproved}</span>
                </div>
                <div className="text-xs text-muted-foreground">Unapproved</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    console.log('🔄 Active Tab:', activeTab);
    
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'properties':
        console.log('📦 Rendering PropertiesManagement');
        return <PropertiesManagement />;
      case 'users':
        return <UsersManagement />;
      case 'transactions':
        return <TransactionsManagement />;
      case 'investments':
        return <InvestmentsManagement />;
      case 'organizations':
        return <OrganizationsManagement />;
      case 'tokens':
        return <TokensManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'kyc':
        return <KYCManagement />;
      case 'settings':
        return <AdminSettings />;
      default:
        return renderOverview();
    }
  };

  if (dashboardLoading && !dashboardError) {
    return (
      <div className="flex h-screen bg-background">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-card shadow-sm border-b border-border sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
                  <p className="text-sm text-muted-foreground">Real Estate Management</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  Welcome, <span className="font-medium text-primary">{adminUser?.name || 'Admin'}</span>
                </div>
                <ThemeToggle />
                <Button 
                  variant="outline" 
                  onClick={logout}
                  className="flex items-center space-x-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
