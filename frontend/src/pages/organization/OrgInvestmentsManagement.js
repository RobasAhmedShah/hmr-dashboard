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
  const { isAuthenticated } = useOrganizationAuth();
  
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

  const investments = investmentsData?.data?.data?.investments || 
                     investmentsData?.data?.investments || 
                     investmentsData?.data || 
                     (Array.isArray(investmentsData) ? investmentsData : []);

  // Frontend filtering
  const filteredInvestments = useMemo(() => {
    let filtered = [...investments];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(inv =>
        (inv.property_name || '').toLowerCase().includes(searchLower) ||
        (inv.user_name || inv.investor_name || '').toLowerCase().includes(searchLower)
      );
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
  const summary = useMemo(() => {
    const totalInvestment = filteredInvestments.reduce((sum, inv) => 
      sum + parseFloat(inv.amount || inv.invested_amount || 0), 0
    );
    const totalTokens = filteredInvestments.reduce((sum, inv) => 
      sum + parseFloat(inv.tokensToBuy || inv.tokens_bought || inv.tokens || 0), 0
    );
    const activeInvestments = filteredInvestments.filter(inv => 
      (inv.status || '').toLowerCase() === 'active'
    ).length;
    
    return { totalInvestment, totalTokens, activeInvestments };
  }, [filteredInvestments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading investments...</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Investments Management</h2>
          <p className="text-gray-600">
            Monitor all property investments
            <span className="ml-2 text-blue-600 font-medium">
              ({filteredInvestments.length} {filteredInvestments.length === 1 ? 'investment' : 'investments'})
            </span>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Investments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary.totalInvestment)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tokens</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalTokens.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Investments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.activeInvestments}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
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
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No investments found</h3>
                    <p className="text-gray-500">No investments match your current filters</p>
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((investment) => {
                  const tokens = parseFloat(
                    investment.tokensToBuy || 
                    investment.tokens_bought || 
                    investment.tokens || 
                    investment.tokensBought ||
                    investment.tokensPurchased ||
                    0
                  );
                  
                  return (
                    <tr key={investment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {investment.user_name || investment.investor_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {investment.property_name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(investment.amount || investment.invested_amount)}
                        </span>
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
                        <div className="flex items-center text-sm text-gray-500">
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

