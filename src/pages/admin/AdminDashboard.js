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
// import InvestmentChart from '../../components/admin/InvestmentChart';
import { adminAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';
import PropertiesManagement from './PropertiesManagement';
import UsersManagement from './UsersManagement';
import TransactionsManagement from './TransactionsManagement';
import InvestmentsManagement from './InvestmentsManagement';
import OrganizationsManagement from './OrganizationsManagement';
import AdminSettings from './AdminSettings';

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

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your real estate investment platform</p>
        </div>

        {/* Metric Cards */}
        <MetricCards 
          stats={{
            totalInvestmentVolume: aggregated?.investments?.totalValue || stats?.totalInvestmentVolume,
            totalUsers: aggregated?.users?.total || stats?.totalUsers,
            totalProperties: stats?.totalProperties,
            averageROI: stats?.averageROI,
            userGrowth: changePercentage?.users ? `${changePercentage.users >= 0 ? '+' : ''}${changePercentage.users.toFixed(1)}%` : '+8%',
          }}
        />

        {/* Investment Chart - Temporarily disabled until recharts is installed */}
        {/* <InvestmentChart 
          data={timeSeries?.investments} 
          stats={stats}
        /> */}
        <Card className="p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Investment chart temporarily disabled</p>
            <p className="text-sm text-muted-foreground mt-2">
              Install recharts: <code className="bg-accent px-2 py-1 rounded">npm install recharts</code>
            </p>
          </div>
        </Card>

        {/* Peak Performance Cards */}
        {aggregated?.users?.peak || aggregated?.investments?.peak || aggregated?.transactions?.peak ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aggregated?.users?.peak && (
              <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-card-foreground">Peak User Growth</h3>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-card-foreground">{aggregated.users.peak.count} users</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(aggregated.users.peak.date)}</p>
              </Card>
            )}
            
            {aggregated?.investments?.peak && (
              <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-card-foreground">Peak Investment Day</h3>
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-card-foreground">{formatCurrency(aggregated.investments.peak.volume)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {aggregated.investments.peak.count} investments on {formatDate(aggregated.investments.peak.date)}
                </p>
              </Card>
            )}
            
            {aggregated?.transactions?.peak && (
              <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-card-foreground">Peak Transaction Volume</h3>
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-card-foreground">{formatCurrency(aggregated.transactions.peak.volume)}</p>
                <p className="text-xs text-muted-foreground mt-1">
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
            <h3 className="text-lg font-semibold text-card-foreground mb-6">Period Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Users</span>
                  <Badge variant={changePercentage?.users >= 0 ? 'success' : 'destructive'}>
                    {changePercentage?.users >= 0 ? '+' : ''}{changePercentage?.users?.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Previous:</span>
                  <span className="font-semibold text-card-foreground">{comparison.previousPeriod.users?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-semibold text-blue-500">{aggregated?.users?.total || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Investments</span>
                  <Badge variant={changePercentage?.investments >= 0 ? 'success' : 'destructive'}>
                    {changePercentage?.investments >= 0 ? '+' : ''}{changePercentage?.investments?.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Previous:</span>
                  <span className="font-semibold text-card-foreground">{comparison.previousPeriod.investments?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-semibold text-green-500">{aggregated?.investments?.total || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rewards</span>
                  <Badge variant={changePercentage?.rewards >= 0 ? 'success' : 'destructive'}>
                    {changePercentage?.rewards >= 0 ? '+' : ''}{changePercentage?.rewards?.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Previous:</span>
                  <span className="font-semibold text-card-foreground">{comparison.previousPeriod.rewards?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-semibold text-purple-500">{aggregated?.rewards?.total || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transactions</span>
                  <Badge variant={changePercentage?.transactions >= 0 ? 'success' : 'destructive'}>
                    {changePercentage?.transactions >= 0 ? '+' : ''}{changePercentage?.transactions?.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Previous:</span>
                  <span className="font-semibold text-card-foreground">{comparison.previousPeriod.transactions?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-semibold text-yellow-500">{aggregated?.transactions?.total || 0}</span>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </Card>
        )}

        {analyticsError && !analytics?.aggregated && (
          <Card className="p-12 bg-yellow-500/10 border-yellow-500/20">
            <div className="text-center">
              <Activity className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Analytics Data Unavailable</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The analytics endpoint is not yet available. Using fallback data.
              </p>
              <p className="text-xs text-muted-foreground">
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
                  Welcome, <span className="font-medium text-primary">{fallbackAdminUser?.name || adminUser?.name || 'Admin'}</span>
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
