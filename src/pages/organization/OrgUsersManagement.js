import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { 
  Search, 
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Users as UsersIcon,
  DollarSign,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { organizationsAPI, adminAPI } from '../../services/api';
import { useOrganizationAuth } from '../../components/organization/OrganizationAuth';

const OrgUsersManagement = ({ organizationId }) => {
  const { isAuthenticated, organizationName } = useOrganizationAuth();
  
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch investors via Investment Analytics API
  const { data: investmentAnalytics, isLoading, error } = useQuery(
    ['org-investors', organizationId],
    async () => {
      console.log(`👥 Fetching investors who invested in ${organizationId} properties via Investment Analytics API`);
      // Use Investment Analytics API to get all investments with user data
      const response = await organizationsAPI.getInvestmentAnalytics(organizationId);
      console.log('✅ Investment Analytics Response:', response);
      return response;
    },
    {
      enabled: isAuthenticated && !!organizationId
    }
  );

  // Extract unique investors from investments data
  const investments = investmentAnalytics?.data?.investments || [];
  const analytics = investmentAnalytics?.data?.analytics || {};
  
  const allInvestors = useMemo(() => {
    const investorMap = new Map();
    
    console.log(`📊 Processing ${investments.length} investments to extract unique investors...`);
    
    investments.forEach(investment => {
      const user = investment.user;
      if (!user) return;
      
      const userId = user.id || user.userId;
      if (!investorMap.has(userId)) {
        investorMap.set(userId, {
          ...user,
          displayCode: user.displayCode || `USR-${userId.slice(0, 6)}`,
          fullName: user.fullName || user.name || 'Unknown User',
          email: user.email || 'N/A',
          phone: user.phone || 'N/A',
          role: user.role || 'user',
          isActive: user.isActive !== undefined ? user.isActive : true,
          createdAt: user.createdAt || investment.createdAt,
          // Investment statistics
          totalInvested: 0,
          investmentCount: 0,
          activeInvestments: 0,
          properties: []
        });
      }
      
      const investor = investorMap.get(userId);
      investor.totalInvested += parseFloat(investment.amountUSDT || investment.amount || 0);
      investor.investmentCount += 1;
      if (investment.status === 'active' || investment.status === 'confirmed') {
        investor.activeInvestments += 1;
      }
      if (investment.property?.title) {
        investor.properties.push(investment.property.title);
      }
    });
    
    const investors = Array.from(investorMap.values());
    console.log(`✅ Found ${investors.length} unique investors:`, investors);
    return investors;
  }, [investments]);

  // Frontend filtering
  const users = useMemo(() => {
    let filtered = [...allInvestors];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        (user.fullName || '').toLowerCase().includes(searchLower) ||
        (user.email || '').toLowerCase().includes(searchLower) ||
        (user.phone || '').toLowerCase().includes(searchLower) ||
        (user.displayCode || '').toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.status) {
      filtered = filtered.filter(user => {
        const isActive = user.isActive !== undefined ? user.isActive : true;
        return filters.status === 'active' ? isActive : !isActive;
      });
    }
    
    return filtered;
  }, [allInvestors, filters]);

  const pagination = {
    totalPages: Math.ceil(users.length / 10),
    currentPage: currentPage,
    totalUsers: users.length
  };
  
  // Paginate users
  const paginatedUsers = useMemo(() => {
    const startIdx = (currentPage - 1) * 10;
    const endIdx = startIdx + 10;
    return users.slice(startIdx, endIdx);
  }, [users, currentPage]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge variant="green" className="flex items-center">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="gray" className="flex items-center">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading users...</p>
        </div>
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
          <h2 className="text-2xl font-bold text-card-foreground">Investors Management</h2>
          <p className="text-muted-foreground">
            Users who invested in {organizationName} properties
            <span className="ml-2 text-primary font-medium">
              ({pagination.totalUsers} {pagination.totalUsers === 1 ? 'investor' : 'investors'})
            </span>
          </p>
        </div>
      </div>

      {/* Investment Analytics Summary */}
      {analytics && Object.keys(analytics).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-blue-100 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary font-medium">Total Investment Value</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  ${parseFloat(analytics.totalAmountUSDT || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Investments</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {analytics.totalInvestments || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Active Investments</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {analytics.activeInvestments || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Avg. Investment</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  ${parseFloat(analytics.averageInvestmentAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
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
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Investors Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Investor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Invested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Investments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-card-foreground mb-2">No investors found</h3>
                    <p className="text-muted-foreground">
                      {users.length === 0 
                        ? `No investors have invested in ${organizationName} properties yet` 
                        : 'No investors match your current filters'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-background">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-primary/80 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {(user.fullName || user.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-card-foreground">
                            {user.fullName || user.name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {user.id?.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-card-foreground">
                          <Mail className="w-3 h-3 mr-2 text-gray-400" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="w-3 h-3 mr-2 text-gray-400" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        ${user.totalInvested?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.activeInvestments || 0} active
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-card-foreground">
                        {user.investmentCount || 0} {user.investmentCount === 1 ? 'investment' : 'investments'}
                      </div>
                      {user.properties && user.properties.length > 0 && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs" title={user.properties.join(', ')}>
                          {user.properties.slice(0, 2).join(', ')}
                          {user.properties.length > 2 && ` +${user.properties.length - 2} more`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-2 text-gray-400" />
                        {formatDate(user.createdAt || user.created_at)}
                      </div>
                    </td>
                  </tr>
                ))
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
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </p>
              </div>
              <div className="flex space-x-2">
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
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrgUsersManagement;

