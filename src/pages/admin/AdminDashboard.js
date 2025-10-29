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
import { adminAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';
import PropertiesManagement from './PropertiesManagement';
import UsersManagement from './UsersManagement';
import TransactionsManagement from './TransactionsManagement';
import InvestmentsManagement from './InvestmentsManagement';
import OrganizationsManagement from './OrganizationsManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsFilter, setAnalyticsFilter] = useState({
    period: '30d',
    from: null,
    to: null
  });
  const { adminUser, isAuthenticated, logout } = useAdminAuth();
  const navigate = useNavigate();
  
  // Fallback admin user from localStorage
  const fallbackAdminUser = React.useMemo(() => {
    if (adminUser) return adminUser;
    const adminUserData = localStorage.getItem('adminUser');
    if (adminUserData) {
      try {
        return JSON.parse(adminUserData);
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        return null;
      }
    }
    return null;
  }, [adminUser]);

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

  // Parse analytics data
  const analytics = analyticsData?.data?.data || analyticsData?.data || {};
  const stats = dashboardData?.data?.data || dashboardData?.data || {};

  console.log('📊 Analytics Data:', {
    raw: analyticsData,
    parsed: analytics,
    filter: analyticsFilter
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'organizations', label: 'Organizations', icon: Building2 }
  ];

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
  }) => (
    <Card 
      className={`p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {change !== undefined && change !== null && (
            <div className={`flex items-center mt-2 text-sm font-medium ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
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
        <div className={`p-4 rounded-2xl bg-gradient-to-br from-${color}-100 to-${color}-200`}>
          <Icon className={`w-8 h-8 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );

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
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No data available</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => parseFloat(d[valueKey] || 0)));
    const maxVolume = showVolume ? Math.max(...data.map(d => parseFloat(d.volume || 0))) : 0;

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
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
                    className={`w-2 bg-${color}-200 rounded-t`}
                    style={{ height: `${volumeHeight}px` }}
                  />
                )}
                <div
                  className={`w-3 bg-${color}-500 rounded-t transition-all hover:bg-${color}-600`}
                  style={{ height: `${height}px` }}
                  title={`${formatDate(item.date)}: ${value}${showVolume ? ` / ${formatCurrency(volume)}` : ''}`}
                />
                {index % Math.ceil(data.length / 5) === 0 && (
                  <span className="text-xs text-gray-500 mt-1">{formatDate(item.date)}</span>
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

    return (
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Analytics Overview</h2>
            <p className="text-sm text-gray-600">
              {analytics?.period?.from && analytics?.period?.to ? (
                `${new Date(analytics.period.from).toLocaleDateString()} - ${new Date(analytics.period.to).toLocaleDateString()}`
              ) : (
                'Select a time period to view analytics'
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={analyticsFilter.period}
              onChange={(e) => setAnalyticsFilter({ ...analyticsFilter, period: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={aggregated?.users?.total || stats?.totalUsers || 0}
            subtitle={`Avg: ${aggregated?.users?.average?.toFixed(1) || 0}/day`}
            icon={Users}
            color="blue"
            change={changePercentage?.users}
            changeType={changePercentage?.users >= 0 ? 'positive' : 'negative'}
            onClick={() => setActiveTab('users')}
          />
          <StatCard
            title="Total Investments"
            value={aggregated?.investments?.total || stats?.totalInvestments || 0}
            subtitle={formatCurrency(aggregated?.investments?.totalValue || 0)}
            icon={TrendingUp}
            color="green"
            change={changePercentage?.investments}
            changeType={changePercentage?.investments >= 0 ? 'positive' : 'negative'}
            onClick={() => setActiveTab('investments')}
          />
          <StatCard
            title="Total Rewards"
            value={aggregated?.rewards?.total || 0}
            subtitle={formatCurrency(aggregated?.rewards?.totalAmount || 0)}
            icon={Award}
            color="purple"
            change={changePercentage?.rewards}
            changeType={changePercentage?.rewards >= 0 ? 'positive' : 'negative'}
          />
          <StatCard
            title="Total Transactions"
            value={aggregated?.transactions?.total || stats?.totalTransactions || 0}
            subtitle={formatCurrency(aggregated?.transactions?.totalVolume || 0)}
            icon={DollarSign}
            color="yellow"
            change={changePercentage?.transactions}
            changeType={changePercentage?.transactions >= 0 ? 'positive' : 'negative'}
            onClick={() => setActiveTab('transactions')}
          />
        </div>

        {/* Peak Performance Cards */}
        {aggregated?.users?.peak || aggregated?.investments?.peak || aggregated?.transactions?.peak ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aggregated?.users?.peak && (
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-900">Peak User Growth</h3>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900">{aggregated.users.peak.count} users</p>
                <p className="text-xs text-blue-700 mt-1">{formatDate(aggregated.users.peak.date)}</p>
              </Card>
            )}
            
            {aggregated?.investments?.peak && (
              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-green-900">Peak Investment Day</h3>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(aggregated.investments.peak.volume)}</p>
                <p className="text-xs text-green-700 mt-1">
                  {aggregated.investments.peak.count} investments on {formatDate(aggregated.investments.peak.date)}
                </p>
              </Card>
            )}
            
            {aggregated?.transactions?.peak && (
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-purple-900">Peak Transaction Volume</h3>
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(aggregated.transactions.peak.volume)}</p>
                <p className="text-xs text-purple-700 mt-1">
                  {aggregated.transactions.peak.count} transactions on {formatDate(aggregated.transactions.peak.date)}
                </p>
              </Card>
            )}
          </div>
        ) : null}

        {/* Time Series Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <TimeSeriesChart
              data={timeSeries?.users}
              title="User Growth Trend"
              color="blue"
              valueKey="count"
            />
          </Card>

          <Card className="p-6">
            <TimeSeriesChart
              data={timeSeries?.investments}
              title="Investment Activity"
              color="green"
              valueKey="count"
              showVolume={true}
            />
          </Card>

          <Card className="p-6">
            <TimeSeriesChart
              data={timeSeries?.rewards}
              title="ROI Distribution"
              color="purple"
              valueKey="count"
              showVolume={true}
            />
          </Card>

          <Card className="p-6">
            <TimeSeriesChart
              data={timeSeries?.transactions}
              title="Transaction Volume"
              color="yellow"
              valueKey="count"
              showVolume={true}
            />
          </Card>
        </div>

        {/* Comparison with Previous Period */}
        {comparison?.previousPeriod && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Period Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Users</span>
                  <Badge variant={changePercentage?.users >= 0 ? 'success' : 'destructive'}>
                    {changePercentage?.users >= 0 ? '+' : ''}{changePercentage?.users?.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Previous:</span>
                  <span className="font-semibold">{comparison.previousPeriod.users?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current:</span>
                  <span className="font-semibold text-blue-600">{aggregated?.users?.total || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Investments</span>
                  <Badge variant={changePercentage?.investments >= 0 ? 'success' : 'destructive'}>
                    {changePercentage?.investments >= 0 ? '+' : ''}{changePercentage?.investments?.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Previous:</span>
                  <span className="font-semibold">{comparison.previousPeriod.investments?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current:</span>
                  <span className="font-semibold text-green-600">{aggregated?.investments?.total || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rewards</span>
                  <Badge variant={changePercentage?.rewards >= 0 ? 'success' : 'destructive'}>
                    {changePercentage?.rewards >= 0 ? '+' : ''}{changePercentage?.rewards?.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Previous:</span>
                  <span className="font-semibold">{comparison.previousPeriod.rewards?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current:</span>
                  <span className="font-semibold text-purple-600">{aggregated?.rewards?.total || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Transactions</span>
                  <Badge variant={changePercentage?.transactions >= 0 ? 'success' : 'destructive'}>
                    {changePercentage?.transactions >= 0 ? '+' : ''}{changePercentage?.transactions?.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Previous:</span>
                  <span className="font-semibold">{comparison.previousPeriod.transactions?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current:</span>
                  <span className="font-semibold text-yellow-600">{aggregated?.transactions?.total || 0}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* KYC Verifications Trend */}
        {timeSeries?.kycVerifications && (
          <Card className="p-6">
            <TimeSeriesChart
              data={timeSeries.kycVerifications}
              title="KYC Verification Trend"
              color="blue"
              valueKey="count"
            />
          </Card>
        )}

        {/* Loading/Error States */}
        {analyticsLoading && (
          <Card className="p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </Card>
        )}

        {analyticsError && !analytics?.aggregated && (
          <Card className="p-12 bg-yellow-50 border-yellow-200">
            <div className="text-center">
              <Activity className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Analytics Data Unavailable</h3>
              <p className="text-sm text-yellow-700 mb-4">
                The analytics endpoint is not yet available. Using fallback data.
              </p>
              <p className="text-xs text-yellow-600">
                Error: {analyticsError?.response?.data?.message || analyticsError?.message}
              </p>
            </div>
          </Card>
        )}
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
      default:
        return renderOverview();
    }
  };

  if (dashboardLoading && !dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your real estate platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium text-blue-600">{fallbackAdminUser?.name || adminUser?.name || 'Admin'}</span>
              </div>
              <Button variant="outline" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={logout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
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
                      ? 'bg-blue-600 text-white shadow-md'
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

export default AdminDashboard;
