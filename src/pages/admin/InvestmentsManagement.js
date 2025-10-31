import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { 
  Search, 
  Eye, 
  TrendingUp,
  Building2,
  User,
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { adminAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';

const InvestmentsManagement = () => {
  const { isAuthenticated } = useAdminAuth();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    property: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch investments
  const { data: investmentsData, isLoading, error } = useQuery(
    ['admin-investments'],
    async () => {
      const response = await adminAPI.getInvestments({
        limit: 1000 // Get all investments
      });
      console.log('Investments API Response:', response);
      return response;
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated
    }
  );

  // Fetch dashboard stats for accurate investment totals
  const { data: dashboardData } = useQuery(
    ['admin-dashboard'],
    () => adminAPI.getDashboard(),
    {
      retry: 1,
      enabled: isAuthenticated
    }
  );

  // Handle different response formats from backend
  const investments = investmentsData?.data?.data?.investments || 
                     investmentsData?.data?.investments || 
                     investmentsData?.data || 
                     (Array.isArray(investmentsData) ? investmentsData : []);

  // Get unique user IDs from investments (unused - commented out)
  // const uniqueUserIds = useMemo(() => {
  //   const userIds = new Set();
  //   investments.forEach((inv) => {
  //     const userId = inv.user_id || inv.userId || inv.user?.id;
  //     if (userId) userIds.add(userId);
  //   });
  //   return Array.from(userIds);
  // }, [investments]);

  // Note: Portfolio API is returning 404 errors, so we'll use investment data directly
  // const allUserPortfolios = null; // Disabled - Portfolio API not working
  
  const pagination = investmentsData?.data?.data?.pagination || 
                     investmentsData?.data?.pagination || 
                     {
                       totalPages: 1,
                       currentPage: 1,
                       totalInvestments: investments.length,
                       hasPrev: false,
                       hasNext: false
                     };

  // Calculate summary statistics using dashboard data for accurate totals
  const summary = useMemo(() => {
    // Get investment stats from dashboard API (more accurate)
    const dashboardInvestments = dashboardData?.data?.investments || {};
    
    const stats = {
      totalInvestments: parseFloat(dashboardInvestments.totalValue || 0),
      activeInvestments: 0,
      pendingInvestments: 0,
      totalInvestors: 0,
      investmentCount: parseInt(dashboardInvestments.count || 0),
      averageInvestment: parseFloat(dashboardInvestments.averageInvestment || 0)
    };
    
    const uniqueInvestors = new Set();
    
    console.log('📊 Dashboard investments data:', dashboardInvestments);
    console.log('📊 Calculating counts from investments:', investments.length);
    
    // Calculate counts and investors from investment list
    investments.forEach((inv) => {
      const status = (inv.status || '').toLowerCase();
      const userId = inv.user_id || inv.userId;
      
      // Count by status
      if (status === 'active' || status === 'confirmed' || status === 'completed') {
        stats.activeInvestments++;
      } else if (status === 'pending') {
        stats.pendingInvestments++;
      }
      
      // Count unique investors
      if (userId) {
        uniqueInvestors.add(userId);
      }
    });
    
    stats.totalInvestors = uniqueInvestors.size;
    
    console.log('📊 Summary calculated:', stats);
    
    return stats;
  }, [investments, dashboardData]);

  // Debug logging
  console.log('Investments Data:', {
    raw: investmentsData,
    investments: investments,
    pagination: pagination,
    count: investments.length,
    summary: summary
  });
  
  // Debug: Log sample investment to see available fields
  if (investments.length > 0) {
    console.log('📊 Investment Data Sample (first investment):', {
      investment: investments[0],
      availableTokenFields: {
        tokensToBuy: investments[0].tokensToBuy,
        tokens_bought: investments[0].tokens_bought,
        tokens: investments[0].tokens,
        tokensBought: investments[0].tokensBought,
        tokensPurchased: investments[0].tokensPurchased
      }
    });
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { variant: 'success', text: 'Active', icon: CheckCircle },
      'pending': { variant: 'warning', text: 'Pending', icon: Clock },
      'completed': { variant: 'success', text: 'Completed', icon: CheckCircle },
      'cancelled': { variant: 'danger', text: 'Cancelled', icon: XCircle },
      'failed': { variant: 'danger', text: 'Failed', icon: XCircle }
    };
    return statusMap[status] || { variant: 'default', text: status, icon: Clock };
  };

  const formatPrice = (amount, currency = 'USD') => {
    const num = parseFloat(amount);
    if (num >= 1000000000) {
      return `${currency} ${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `${currency} ${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${currency} ${(num / 1000).toFixed(0)}K`;
    }
    return `${currency} ${num.toFixed(0)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view investments.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-muted-foreground">Loading investments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load investments</p>
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
          <h2 className="text-2xl font-bold text-card-foreground">Investments Management</h2>
          <p className="text-muted-foreground">Monitor all property investments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Investments</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatPrice(summary.totalInvestments)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Active Investments</p>
              <p className="text-2xl font-bold text-card-foreground">
                {summary.activeInvestments}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-card-foreground">
                {summary.pendingInvestments}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Investors</p>
              <p className="text-2xl font-bold text-card-foreground">
                {summary.totalInvestors}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search investments..."
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
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Property</label>
            <select
              value={filters.property}
              onChange={(e) => handleFilterChange('property', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="">All Properties</option>
              <option value="hmr-waterfront-towers">HMR Waterfront Towers</option>
              <option value="creek-vista-residences">Creek Vista Residences</option>
              <option value="techno">Techno</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sort By</label>
            <select
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="created_at">Date</option>
              <option value="investment_amount">Amount</option>
              <option value="status">Status</option>
              <option value="property_title">Property</option>
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
      </Card>

      {/* Investments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Investor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {investments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No investments found</p>
                      <p className="text-sm">Investments will appear here once users start investing in properties</p>
                    </div>
                  </td>
                </tr>
              ) : (
                investments.map((investment) => {
                  // Extract tokens directly from investment data
                  // Portfolio API is not working (returning 404), so use investment object directly
                  let tokens_bought = parseFloat(
                    investment.tokensToBuy || 
                    investment.tokens_bought || 
                    investment.tokens || 
                    investment.tokensBought ||
                    investment.tokensPurchased ||
                    0
                  );
                  
                  // Debug log for first 3 investments
                  if (investments.indexOf(investment) < 3) {
                    console.log(`🔍 Token Extraction #${investments.indexOf(investment) + 1}:`, {
                      investmentId: investment.id || investment.displayCode,
                      rawInvestmentData: {
                        tokensToBuy: investment.tokensToBuy,
                        tokens_bought: investment.tokens_bought,
                        tokens: investment.tokens,
                        tokensBought: investment.tokensBought,
                        tokensPurchased: investment.tokensPurchased
                      },
                      extractedTokens: tokens_bought
                    });
                  }
                  
                  // Map backend field names to frontend
                  const mappedInvestment = {
                    ...investment,
                    status: investment.status || 'active',
                    tokens_bought: tokens_bought,
                    amount_invested: investment.amountUSDT || investment.amount_invested || investment.amount || 0,
                    created_at: investment.createdAt || investment.created_at,
                    property_title: investment.property?.title || investment.property_title || 'Unknown Property',
                    user_name: investment.user?.fullName || investment.user_name || 'Unknown User',
                    user_email: investment.user?.email || investment.user_email || '',
                  };

                  const statusInfo = getStatusBadge(mappedInvestment.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={investment.id} className="hover:bg-accent">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-card-foreground">
                            {investment.displayCode || investment.id?.slice(0, 8) + '...'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Investment
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-card-foreground">
                            {mappedInvestment.user_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {mappedInvestment.user_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium text-card-foreground">
                            {mappedInvestment.property_title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {investment.property?.displayCode || investment.property?.slug || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {formatPrice(mappedInvestment.amount_invested, 'USDT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      <div className="flex items-center">
                        <span className="font-medium">
                          {parseFloat(mappedInvestment.tokens_bought || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                          })}
                        </span>
                        {mappedInvestment.tokens_bought > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">tokens</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusInfo.variant} className="flex items-center">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.text}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-2 text-muted-foreground" />
                        {formatDate(mappedInvestment.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
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
                    {Math.min(currentPage * 10, pagination.totalInvestments)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalInvestments}</span>{' '}
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
    </div>
  );
};

export default InvestmentsManagement;
