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
    status: ''
  });

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

  // Frontend filtering
  const filteredInvestments = useMemo(() => {
    let filtered = [...investments];
    
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
    
    if (filters.status) {
      filtered = filtered.filter(inv =>
        (inv.status || '').toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    return filtered;
  }, [investments, filters]);

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
        <Card className="p-6 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Investments</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">
                {formatCurrency(summary.totalInvestment)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredInvestments.length} investments
              </p>
            </div>
            <div className="p-3 bg-primary/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tokens</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">
                {summary.totalTokens.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {(filteredInvestments.length > 0 ? summary.totalTokens / filteredInvestments.length : 0).toFixed(2)} per investment
              </p>
            </div>
            <div className="p-3 bg-primary/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Investments</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">
                {summary.activeInvestments}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.pendingInvestments} pending
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Investment</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">
                {formatCurrency(summary.averageInvestment)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                per investor
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search investments..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
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
              {filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-card-foreground mb-2">No investments found</h3>
                    <p className="text-muted-foreground">No investments match your current filters</p>
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((investment) => {
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
      </Card>
    </div>
  );
};

export default OrgInvestmentsManagement;

