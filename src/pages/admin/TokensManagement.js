import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { 
  Coins, 
  Search, 
  Building2,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { adminAPI, organizationsAPI, investmentsAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';

const TokensManagement = () => {
  const { isAuthenticated } = useAdminAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'totalTokens', 'boughtTokens'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  // Fetch all organizations
  const { data: organizationsData, isLoading: isLoadingOrgs, error: orgsError } = useQuery(
    ['admin-organizations'],
    () => adminAPI.getOrganizations({ limit: 1000 }),
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated
    }
  );

  // Fetch all investments
  const { data: investmentsData, isLoading: isLoadingInvestments } = useQuery(
    ['all-investments-for-tokens'],
    () => investmentsAPI.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated
    }
  );

  // Fetch all properties
  const { data: propertiesData } = useQuery(
    ['all-properties-for-tokens'],
    () => adminAPI.getProperties({ limit: 1000 }),
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated
    }
  );

  // Calculate token statistics for each organization
  const tokensData = useMemo(() => {
    if (!organizationsData?.data || !propertiesData?.data || !investmentsData?.data) {
      return [];
    }

    const organizations = Array.isArray(organizationsData.data)
      ? organizationsData.data
      : organizationsData.data?.data?.organizations || organizationsData.data?.organizations || [];

    const properties = Array.isArray(propertiesData.data)
      ? propertiesData.data
      : propertiesData.data?.data?.properties || propertiesData.data?.properties || [];

    const investments = Array.isArray(investmentsData.data)
      ? investmentsData.data
      : investmentsData.data?.data || investmentsData.data || [];

    return organizations.map(org => {
      const orgId = org.id || org.displayCode;
      
      // Get all properties for this organization
      const orgProperties = properties.filter(prop => 
        prop.organizationId === orgId || 
        prop.organization?.id === orgId || 
        prop.organization?.displayCode === orgId
      );

      // Calculate total tokens from all properties
      const totalTokens = orgProperties.reduce((sum, prop) => {
        const tokens = parseFloat(prop.totalTokens || prop.tokenization_total_tokens || 0);
        return sum + tokens;
      }, 0);

      // Calculate bought tokens (tokens purchased from investments in this org's properties)
      const boughtTokens = investments
        .filter(inv => {
          const invPropertyId = inv.propertyId || inv.property?.id || inv.property?.displayCode;
          return orgProperties.some(prop => 
            (prop.id === invPropertyId || prop.displayCode === invPropertyId) &&
            (inv.status === 'confirmed' || inv.status === 'active')
          );
        })
        .reduce((sum, inv) => {
          const tokens = parseFloat(inv.tokensPurchased || 0);
          return sum + tokens;
        }, 0);

      // Calculate available tokens
      const availableTokens = totalTokens - boughtTokens;

      // Calculate total investment (USD) from investments in this org's properties
      const totalInvestment = investments
        .filter(inv => {
          const invPropertyId = inv.propertyId || inv.property?.id || inv.property?.displayCode;
          return orgProperties.some(prop => 
            (prop.id === invPropertyId || prop.displayCode === invPropertyId) &&
            (inv.status === 'confirmed' || inv.status === 'active')
          );
        })
        .reduce((sum, inv) => {
          const amount = parseFloat(inv.amountUSDT || inv.amount || 0);
          return sum + amount;
        }, 0);

      // Calculate funding percentage
      const fundingPercentage = totalTokens > 0 ? (boughtTokens / totalTokens) * 100 : 0;

      return {
        id: org.id,
        displayCode: org.displayCode,
        name: org.name || 'Unknown Organization',
        totalTokens: totalTokens,
        boughtTokens: boughtTokens,
        availableTokens: availableTokens,
        totalInvestment: totalInvestment,
        fundingPercentage: fundingPercentage,
        propertyCount: orgProperties.length,
        logoUrl: org.logoUrl || null
      };
    });
  }, [organizationsData, propertiesData, investmentsData]);

  // Filter and sort tokens
  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokensData.filter(token => 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (token.displayCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'totalTokens':
          aValue = a.totalTokens;
          bValue = b.totalTokens;
          break;
        case 'boughtTokens':
          aValue = a.boughtTokens;
          bValue = b.boughtTokens;
          break;
        case 'name':
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [tokensData, searchTerm, sortBy, sortOrder]);

  const formatNumber = (num) => {
    if (num === 0) return '0';
    if (num < 1) return num.toFixed(6);
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view tokens.</p>
      </div>
    );
  }

  if (isLoadingOrgs || isLoadingInvestments) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-muted-foreground">Loading tokens...</span>
      </div>
    );
  }

  if (orgsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load tokens: {orgsError.message}</p>
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
          <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            <Coins className="w-6 h-6" />
            Tokens
          </h2>
          <p className="text-muted-foreground">
            View organization tokens and their market statistics
            {filteredAndSortedTokens.length > 0 && (
              <span className="ml-2 text-blue-600 font-semibold">
                ({filteredAndSortedTokens.length} {filteredAndSortedTokens.length === 1 ? 'token' : 'tokens'} found)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg bg-card text-card-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-card text-card-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="name">Token Name</option>
              <option value="totalTokens">Total Tokens</option>
              <option value="boughtTokens">Bought Tokens</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-card text-card-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="asc">Ascending ↑</option>
              <option value="desc">Descending ↓</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tokens Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Token Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Bought Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Available Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Funding Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Properties
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredAndSortedTokens.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No tokens found</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedTokens.map((token) => (
                  <tr key={token.id} className="hover:bg-accent transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {token.logoUrl ? (
                          <img 
                            src={token.logoUrl} 
                            alt={token.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-card-foreground">
                            {token.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {token.displayCode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-card-foreground">
                        <Coins className="w-4 h-4 mr-1 text-blue-600" />
                        <span className="font-semibold">{formatNumber(token.totalTokens)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-card-foreground">
                        <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                        <span className="font-semibold text-green-600">{formatNumber(token.boughtTokens)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-card-foreground">
                        <Coins className="w-4 h-4 mr-1 text-orange-600" />
                        <span className="font-semibold">{formatNumber(token.availableTokens)} tokens</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-card-foreground">
                        <DollarSign className="w-4 h-4 mr-1 text-purple-600" />
                        <span className="font-semibold text-purple-600">${formatNumber(token.totalInvestment)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-muted rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              token.fundingPercentage >= 50 ? 'bg-green-600' : 
                              token.fundingPercentage >= 25 ? 'bg-yellow-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(token.fundingPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-card-foreground">
                          {token.fundingPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="info">
                        {token.propertyCount} {token.propertyCount === 1 ? 'property' : 'properties'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Statistics */}
      {filteredAndSortedTokens.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Tokens</p>
                <p className="text-lg font-bold text-card-foreground">
                  {formatNumber(filteredAndSortedTokens.reduce((sum, t) => sum + t.totalTokens, 0))}
                </p>
              </div>
              <Coins className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bought Tokens</p>
                <p className="text-lg font-bold text-green-600">
                  {formatNumber(filteredAndSortedTokens.reduce((sum, t) => sum + t.boughtTokens, 0))}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Available Tokens</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatNumber(filteredAndSortedTokens.reduce((sum, t) => sum + t.availableTokens, 0))}
                </p>
              </div>
              <Coins className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Investment</p>
                <p className="text-lg font-bold text-purple-600">
                  ${formatNumber(filteredAndSortedTokens.reduce((sum, t) => sum + t.totalInvestment, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Organizations</p>
                <p className="text-lg font-bold text-card-foreground">
                  {filteredAndSortedTokens.length}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TokensManagement;

