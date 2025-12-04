import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { 
  Search, 
  TrendingUp,
  Building2,
  User,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { organizationsAPI, adminAPI } from '../../services/api';
import { useOrganizationAuth } from '../../components/organization/OrganizationAuth';

const OrgInvestmentsManagement = ({ organizationId }) => {
  const { isAuthenticated, organizationName } = useOrganizationAuth();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    sortBy: 'latest' // 'latest' or 'earliest'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch investments using organization API (with fallback)
  const { data: investmentsData, isLoading, error } = useQuery(
    ['org-investments', organizationId],
    async () => {
      try {
        console.log('🔄 Fetching investments for organization:', organizationId);
        // Try organization-specific endpoint first
        const response = await organizationsAPI.getInvestments(organizationId);
        console.log('✅ Investments API Response (org endpoint):', response);
        return response;
      } catch (error) {
        console.log('ℹ️ Organization investments endpoint not available, using fallback with filter');
        // Fallback to filtered admin endpoint
        const response = await adminAPI.getInvestments({
          limit: 1000,
          organizationId: organizationId
        });
        console.log('✅ Investments API Response (admin endpoint):', response);
        return response;
      }
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated && !!organizationId
    }
  );

  // ALSO fetch Investment Analytics for accurate totals
  const { data: analyticsData } = useQuery(
    ['org-investment-analytics', organizationId],
    async () => {
      try {
        console.log('📊 Fetching investment analytics for organization:', organizationId);
        const response = await organizationsAPI.getInvestmentAnalytics(organizationId);
        console.log('✅ Investment Analytics Response:', response);
        return response;
      } catch (error) {
        console.error('❌ Investment Analytics fetch error:', error);
        return null;
      }
    },
    {
      retry: 1,
      enabled: isAuthenticated && !!organizationId
    }
  );

  const investments = investmentsData?.data?.data?.investments || 
                     investmentsData?.data?.investments || 
                     investmentsData?.data || 
                     (Array.isArray(investmentsData) ? investmentsData : []);

  const analytics = analyticsData?.data?.analytics || analyticsData?.data?.data?.analytics || {};
  
  // Debug: Log first investment structure
  React.useEffect(() => {
    if (investments.length > 0) {
      console.log('📊 First Investment Structure:', investments[0]);
      console.log('💰 Investment Analytics:', analytics);
    }
  }, [investments, analytics]);

  // Helper functions for field extraction
  const getInvestmentAmount = (inv) => {
    return parseFloat(
      inv.amountUSDT || 
      inv.amount_usdt || 
      inv.amount || 
      inv.invested_amount || 
      inv.investmentAmount || 
      0
    );
  };

  const getTokenCount = (inv) => {
    return parseFloat(
      inv.tokensPurchased ||
      inv.tokens_purchased ||
      inv.tokensToBuy || 
      inv.tokens_bought || 
      inv.tokens || 
      inv.tokensBought ||
      0
    );
  };

  const getInvestorName = (inv) => {
    // Try nested user object first
    if (inv.user && (inv.user.fullName || inv.user.name)) {
      return inv.user.fullName || inv.user.name;
    }
    // Fallback to flat fields
    return inv.user_name || inv.investor_name || inv.fullName || 'Unknown';
  };

  const getPropertyName = (inv) => {
    // Try nested property object first
    if (inv.property && inv.property.title) {
      return inv.property.title;
    }
    // Fallback to flat fields
    return inv.property_name || inv.propertyName || inv.property?.name || 'N/A';
  };

  // Frontend filtering and sorting
  const filteredInvestments = useMemo(() => {
    let filtered = [...investments];
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(inv => {
        const propertyName = getPropertyName(inv).toLowerCase();
        const investorName = getInvestorName(inv).toLowerCase();
        const displayCode = (inv.displayCode || inv.id || '').toLowerCase();
        
        return propertyName.includes(searchLower) ||
               investorName.includes(searchLower) ||
               displayCode.includes(searchLower);
      });
    }
    
    // Status filter
    if (filters.status) {
      filtered = filtered.filter(inv =>
        (inv.status || '').toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    // Date range filter
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.created_at || inv.createdAt || 0);
        if (!invDate || isNaN(invDate.getTime())) return false;
        
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;
        
        // Set time to start/end of day for proper comparison
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
        }
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        
        invDate.setHours(0, 0, 0, 0);
        
        if (startDate && endDate) {
          return invDate >= startDate && invDate <= endDate;
        } else if (startDate) {
          return invDate >= startDate;
        } else if (endDate) {
          return invDate <= endDate;
        }
        return true;
      });
    }
    
    // Sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      
      if (filters.sortBy === 'latest') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });
    
    return filtered;
  }, [investments, filters]);
  
  // Pagination
  const totalPages = Math.ceil(filteredInvestments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvestments = filteredInvestments.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status, filters.startDate, filters.endDate]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'USD 0';
    return `USD ${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'active':
        return (
          <Badge variant="green" className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="yellow" className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="blue" className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="red" className="flex items-center">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="gray">{status || 'Unknown'}</Badge>;
    }
  };

  // Calculate summary statistics
  // PRIORITY: Use Analytics API totals > Manual calculation
  const summary = useMemo(() => {
    // Use Analytics API if available (more accurate, backend-calculated)
    const totalInvestment = analytics.totalAmountUSDT 
      ? parseFloat(analytics.totalAmountUSDT)
      : filteredInvestments.reduce((sum, inv) => sum + getInvestmentAmount(inv), 0);
    
    const totalTokens = analytics.totalTokensPurchased
      ? parseFloat(analytics.totalTokensPurchased)
      : filteredInvestments.reduce((sum, inv) => sum + getTokenCount(inv), 0);
    
    const activeInvestments = analytics.activeInvestments 
      ? analytics.activeInvestments
      : filteredInvestments.filter(inv => 
          (inv.status || '').toLowerCase() === 'active' || 
          (inv.status || '').toLowerCase() === 'confirmed'
        ).length;

    const pendingInvestments = analytics.pendingInvestments
      ? analytics.pendingInvestments
      : filteredInvestments.filter(inv => 
          (inv.status || '').toLowerCase() === 'pending'
        ).length;

    const averageInvestment = analytics.averageInvestmentAmount
      ? parseFloat(analytics.averageInvestmentAmount)
      : (filteredInvestments.length > 0 ? totalInvestment / filteredInvestments.length : 0);
    
    console.log(`💰 ${organizationName} Investment Summary (using ${analytics.totalAmountUSDT ? 'ANALYTICS API' : 'MANUAL CALC'}):`, {
      totalInvestment,
      totalTokens,
      activeInvestments,
      pendingInvestments,
      averageInvestment,
      totalCount: filteredInvestments.length,
      dataSource: analytics.totalAmountUSDT ? 'Investment Analytics API' : 'Manual Calculation'
    });
    
    return { 
      totalInvestment, 
      totalTokens, 
      activeInvestments, 
      pendingInvestments,
      averageInvestment 
    };
  }, [filteredInvestments, analytics, organizationName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading investments...</p>
        </div>
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
          <p className="text-muted-foreground">
            Monitor all property investments
            <span className="ml-2 text-primary font-medium">
              ({filteredInvestments.length} {filteredInvestments.length === 1 ? 'investment' : 'investments'})
            </span>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-2 border-blue-400 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Investment Value</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatCurrency(summary.totalInvestment)}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-green-500 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Investments</p>
              <p className="text-2xl font-bold text-card-foreground">
                {filteredInvestments.length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-purple-500 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Investments</p>
              <p className="text-2xl font-bold text-card-foreground">
                {summary.activeInvestments}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-orange-500 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg. Investment</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatCurrency(summary.averageInvestment)}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search investments..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentPage(1);
                  }
                }}
                className="w-full pl-10 pr-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={filters.startDate}
                className="w-full pl-10 pr-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              >
                <option value="latest">Latest First</option>
                <option value="earliest">Earliest First</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(filters.startDate || filters.endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFilterChange('startDate', '');
                  handleFilterChange('endDate', '');
                }}
                className="text-xs"
              >
                Clear Date Filter
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                // Trigger filter application by resetting page
                setCurrentPage(1);
              }}
              className="text-xs flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Investments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
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
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {paginatedInvestments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-card-foreground mb-2">No investments found</h3>
                    <p className="text-muted-foreground">No investments match your current filters</p>
                  </td>
                </tr>
              ) : (
                paginatedInvestments.map((investment) => {
                  const amount = getInvestmentAmount(investment);
                  const tokens = getTokenCount(investment);
                  const investorName = getInvestorName(investment);
                  const propertyName = getPropertyName(investment);
                  
                  return (
                    <tr key={investment.id || investment.displayCode} className="hover:bg-background">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-card-foreground">
                              {investorName}
                            </div>
                            {investment.user?.email && (
                              <div className="text-xs text-muted-foreground">
                                {investment.user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-card-foreground">
                              {propertyName}
                            </div>
                            {investment.property?.displayCode && (
                              <div className="text-xs text-muted-foreground">
                                {investment.property.displayCode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(amount)}
                        </div>
                        {investment.displayCode && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {investment.displayCode}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-purple-600">
                          {tokens.toLocaleString()} tokens
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(investment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-2 text-gray-400" />
                          {formatDate(investment.created_at || investment.createdAt)}
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
        {totalPages > 1 && (
          <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-foreground">
                  Showing{' '}
                  <span className="font-medium">
                    {filteredInvestments.length === 0 ? 0 : startIndex + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(endIndex, filteredInvestments.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{filteredInvestments.length}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-r-none"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-input text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-l-none"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrgInvestmentsManagement;

