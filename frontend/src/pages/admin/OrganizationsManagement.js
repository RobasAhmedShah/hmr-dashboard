import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
  AlertTriangle,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { adminAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';

const OrganizationsManagement = () => {
  const { isAuthenticated } = useAdminAuth();
  
  const [filters, setFilters] = useState({
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const queryClient = useQueryClient();

  // Fetch ALL organizations
  const { data: orgsData, isLoading, error } = useQuery(
    ['admin-organizations'],
    () => adminAPI.getOrganizations({ limit: 1000 }),
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated
    }
  );

  // Fetch dashboard stats for accurate totals
  const { data: dashboardData } = useQuery(
    ['admin-dashboard'],
    () => adminAPI.getDashboard(),
    {
      retry: 1,
      enabled: isAuthenticated
    }
  );

  // Fetch ALL properties to count per organization
  const { data: propertiesData } = useQuery(
    ['admin-properties-for-orgs'],
    () => adminAPI.getProperties({ limit: 1000 }),
    {
      retry: 1,
      enabled: isAuthenticated
    }
  );

  // Parse organizations data
  const allOrganizations = orgsData?.data?.data?.organizations || 
                          orgsData?.data?.organizations || 
                          orgsData?.data || 
                          (Array.isArray(orgsData) ? orgsData : []);

  // Parse properties data
  const allProperties = propertiesData?.data?.data?.properties || 
                       propertiesData?.data?.properties || 
                       propertiesData?.data || 
                       (Array.isArray(propertiesData) ? propertiesData : []);

  // Create a map of organization ID/displayCode to property count
  const orgPropertyCounts = useMemo(() => {
    const counts = {};
    
    console.log('📊 Counting properties for organizations...');
    console.log('Total properties:', allProperties.length);
    
    if (allProperties.length > 0) {
      console.log('📊 Sample property structure:', allProperties[0]);
    }
    
    allProperties.forEach((property, index) => {
      // Properties can have organizationId (UUID) or organization_id or displayCode
      const orgId = property.organizationId || property.organization_id;
      const orgDisplayCode = property.organization?.displayCode || property.organizationDisplayCode;
      
      if (index < 3) {
        console.log(`📊 Property ${index}:`, {
          title: property.title || property.name,
          orgId,
          orgDisplayCode,
          allKeys: Object.keys(property)
        });
      }
      
      if (orgId) {
        counts[orgId] = (counts[orgId] || 0) + 1;
      }
      
      if (orgDisplayCode && orgDisplayCode !== orgId) {
        counts[orgDisplayCode] = (counts[orgDisplayCode] || 0) + 1;
      }
    });
    
    console.log('📊 Property counts by organization:', counts);
    
    return counts;
  }, [allProperties]);

  // Enrich organizations with property count
  const enrichedOrganizations = useMemo(() => {
    return allOrganizations.map(org => ({
      ...org,
      propertyCount: orgPropertyCounts[org.id] || 
                    orgPropertyCounts[org.displayCode] || 
                    org.propertyCount || 
                    0
    }));
  }, [allOrganizations, orgPropertyCounts]);

  // Frontend filtering and sorting
  const filteredOrganizations = useMemo(() => {
    let filtered = [...enrichedOrganizations];
    
    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(org => {
        const name = (org.name || '').toLowerCase();
        const displayCode = (org.displayCode || '').toLowerCase();
        const description = (org.description || '').toLowerCase();
        
        return name.includes(searchLower) ||
               displayCode.includes(searchLower) ||
               description.includes(searchLower);
      });
    }
    
    // Sorting
    if (filters.sort_by) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (filters.sort_by) {
          case 'name':
            aValue = (a.name || '').toLowerCase();
            bValue = (b.name || '').toLowerCase();
            break;
          case 'created_at':
          default:
            aValue = new Date(a.createdAt || a.created_at || 0);
            bValue = new Date(b.createdAt || b.created_at || 0);
            break;
        }
        
        if (filters.sort_order === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }
    
    return filtered;
  }, [enrichedOrganizations, filters]);

  const organizations = filteredOrganizations;

  // Calculate summary stats using dashboard data
  const summary = useMemo(() => {
    // Get stats from dashboard API (more accurate)
    const dashboardOverview = dashboardData?.data?.overview || {};
    
    console.log('📊 Dashboard overview data:', dashboardOverview);
    
    return {
      totalOrganizations: parseInt(dashboardOverview.totalOrganizations || allOrganizations.length),
      activeOrganizations: allOrganizations.filter(org => org.isActive !== false).length,
      totalProperties: parseInt(dashboardOverview.totalProperties || 0),
      totalUsers: parseInt(dashboardOverview.totalUsers || 0)
    };
  }, [allOrganizations, dashboardData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = (org) => {
    setSelectedOrg(org);
    setShowDetailsModal(true);
  };

  const handleViewProperty = (property) => {
    console.log('🔍 Viewing property from Organizations:', property);
    console.log('🔍 Property fields:', Object.keys(property));
    
    // Map property fields to match the expected structure in the modal
    const mappedProperty = {
      id: property.id,
      displayCode: property.displayCode || property.display_code || property.id?.slice(0, 8),
      title: property.title || property.name || 'Unnamed Property',
      location_city: property.location_city || property.locationCity || property.city || 'Unknown City',
      property_type: property.property_type || property.propertyType || property.type || 'N/A',
      status: property.status || 'N/A',
      
      // Pricing fields - check multiple variations (matching PropertiesManagement)
      pricing_total_value: property.purchasePriceUSDT || 
                          property.totalValueUSDT || 
                          property.pricing_total_value || 
                          property.pricingTotalValue ||
                          property.pricing?.total_value ||
                          property.pricing?.totalValue ||
                          property.totalValue || 
                          property.total_value || 
                          property.price ||
                          property.listingPrice ||
                          property.listing_price || 0,
      
      pricing_expected_roi: property.expectedROI || 
                           property.pricing_expected_roi || 
                           property.roi ||
                           property.pricingExpectedRoi ||
                           property.pricing?.expected_roi ||
                           property.pricing?.expectedROI ||
                           property.expected_roi || 0,
      
      pricing_min_investment: property.minInvestmentUSDT ||
                             property.pricing_min_investment || 
                             property.pricingMinInvestment ||
                             property.pricing?.min_investment ||
                             property.pricing?.minInvestment ||
                             property.minInvestment || 
                             property.min_investment || 0,
      
      // Tokenization fields - check multiple variations (matching PropertiesManagement)
      tokenization_total_tokens: property.totalTokens || 
                                property.tokenization_total_tokens || 
                                property.tokens ||
                                property.tokenizationTotalTokens ||
                                property.tokenization?.total_tokens ||
                                property.tokenization?.totalTokens || 0,
      
      tokenization_available_tokens: property.availableTokens || 
                                    property.tokenization_available_tokens || 
                                    property.totalTokens || 
                                    property.tokens ||
                                    property.tokenizationAvailableTokens ||
                                    property.tokenization?.available_tokens ||
                                    property.tokenization?.availableTokens || 0,
      
      tokenization_price_per_token: property.tokenPriceUSDT ||
                                   property.pricePerToken ||
                                   property.tokenization_price_per_token || 
                                   property.tokenizationPricePerToken ||
                                   property.tokenization?.price_per_token ||
                                   property.tokenization?.pricePerToken ||
                                   property.price_per_token || 0,
      
      // Location fields
      description: property.description || '',
      short_description: property.short_description || property.shortDescription || '',
      location_address: property.location_address || property.locationAddress || property.address || '',
      location_state: property.location_state || property.locationState || property.state || '',
      location_country: property.location_country || property.locationCountry || property.country || 'Pakistan',
      
      // Media and features
      images: property.images || {},
      features: property.features || [],
      amenities: property.amenities || [],
      
      // Investment stats - check multiple variations
      investment_stats: property.investment_stats || property.investmentStats || {},
      totalInvestment: property.investment_stats?.totalInvestment || 
                      property.investmentStats?.totalInvestment ||
                      property.totalInvestment || 
                      property.total_investment || 0,
      totalInvestors: property.investment_stats?.totalInvestors || 
                     property.investmentStats?.totalInvestors ||
                     property.totalInvestors || 
                     property.total_investors || 0
    };
    
    console.log('🔍 Mapped property for modal:', {
      title: mappedProperty.title,
      totalValue: mappedProperty.pricing_total_value,
      totalInvestment: mappedProperty.totalInvestment,
      pricePerToken: mappedProperty.tokenization_price_per_token,
      minInvestment: mappedProperty.pricing_min_investment
    });
    
    setSelectedProperty(mappedProperty);
    setShowPropertyModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to view organizations.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading organizations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load organizations</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Organizations Management</h2>
          <p className="text-gray-600">
            Manage all organizations
            {allOrganizations.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({allOrganizations.length} {allOrganizations.length === 1 ? 'organization' : 'organizations'})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Organizations</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.totalOrganizations}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Organizations</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.activeOrganizations}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.totalProperties}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.totalUsers}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at">Date Created</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={filters.sort_order}
              onChange={(e) => handleFilterChange('sort_order', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Descending ↓</option>
              <option value="asc">Ascending ↑</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Organizations Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Properties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No organizations found
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => handleViewDetails(org)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {org.name || 'Unknown Organization'}
                          </button>
                          {org.displayCode && (
                            <p className="text-sm text-gray-500">{org.displayCode}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {org.propertyCount || 0} properties
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={org.isActive !== false ? 'success' : 'danger'}>
                        {org.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-2 text-gray-400" />
                        {formatDate(org.createdAt || org.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(org)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Organization Details Modal */}
      {showDetailsModal && selectedOrg && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-3xl shadow-lg rounded-md bg-white my-10">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedOrg(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedOrg.name}</h2>
                  {selectedOrg.displayCode && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {selectedOrg.displayCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Organization Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Name</label>
                  <p className="text-base text-gray-900">{selectedOrg.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Display Code</label>
                  <p className="text-base text-gray-900">{selectedOrg.displayCode || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <Badge variant={selectedOrg.isActive !== false ? 'success' : 'danger'}>
                    {selectedOrg.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Properties</label>
                  <p className="text-base text-gray-900">{selectedOrg.propertyCount || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Created Date</label>
                  <p className="text-base text-gray-900">{formatDate(selectedOrg.createdAt || selectedOrg.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Organization ID</label>
                  <p className="text-base text-gray-900 font-mono text-xs">{selectedOrg.id}</p>
                </div>
                {selectedOrg.description && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600">Description</label>
                    <p className="text-base text-gray-900">{selectedOrg.description}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Organization Properties */}
            {selectedOrg.propertyCount > 0 && (
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Properties ({selectedOrg.propertyCount})
                </h3>
                <div className="space-y-3">
                  {allProperties
                    .filter(property => 
                      property.organizationId === selectedOrg.id || 
                      property.organization_id === selectedOrg.id ||
                      property.displayCode === selectedOrg.displayCode ||
                      property.organization?.displayCode === selectedOrg.displayCode
                    )
                    .map((property) => (
                      <div 
                        key={property.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-300 border border-transparent transition-all cursor-pointer"
                        onClick={() => handleViewProperty(property)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <button 
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProperty(property);
                              }}
                            >
                              {property.title || property.name || 'Unnamed Property'}
                            </button>
                            <p className="text-xs text-gray-500">
                              {property.displayCode || property.id?.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {property.location_city || property.city || 'Unknown City'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {property.property_type || property.type || 'N/A'}
                            </p>
                          </div>
                          <Badge variant={
                            property.status === 'active' ? 'success' : 
                            property.status === 'coming-soon' ? 'warning' : 
                            'default'
                          }>
                            {property.status || 'N/A'}
                          </Badge>
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrg(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {showPropertyModal && selectedProperty && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white my-10">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowPropertyModal(false);
                setSelectedProperty(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProperty.title}</h2>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                    {selectedProperty.displayCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            {(() => {
              // Calculate values (matching PropertiesManagement logic)
              const totalTokens = parseFloat(selectedProperty.tokenization_total_tokens || 0);
              const availableTokens = parseFloat(selectedProperty.tokenization_available_tokens || 0);
              const soldTokens = totalTokens - availableTokens;
              const pricePerToken = parseFloat(selectedProperty.tokenization_price_per_token || 0);
              const totalInvestment = soldTokens * pricePerToken;
              const totalBuyers = selectedProperty.totalInvestors || 0;
              const roi = selectedProperty.pricing_expected_roi || 0;
              const fundingPercentage = totalTokens > 0 ? ((soldTokens / totalTokens) * 100).toFixed(1) : 0;
              
              const formatPrice = (amount) => {
                if (!amount || amount === 0) return 'PKR 0';
                const num = parseFloat(amount);
                if (num >= 1000000) {
                  return `PKR ${(num / 1000000).toFixed(1)}M`;
                } else if (num >= 1000) {
                  return `PKR ${(num / 1000).toFixed(0)}K`;
                }
                return `PKR ${num.toLocaleString()}`;
              };
              
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600">Total Investment</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(totalInvestment)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Total Buyers</p>
                        <p className="text-lg font-bold text-gray-900">
                          {totalBuyers}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-600">Tokens Left</p>
                        <p className="text-lg font-bold text-gray-900">
                          {availableTokens.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-xs text-gray-600">ROI</p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(roi).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Price Per Token</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(pricePerToken)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Total Tokens</p>
                        <p className="text-lg font-bold text-gray-900">
                          {totalTokens.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600">Funding Progress</p>
                        <p className="text-lg font-bold text-gray-900">
                          {fundingPercentage}%
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })()}

            {/* Property Information */}
            {(() => {
              const formatPrice = (amount) => {
                if (!amount || amount === 0) return 'PKR 0';
                const num = parseFloat(amount);
                if (num >= 1000000) {
                  return `PKR ${(num / 1000000).toFixed(1)}M`;
                } else if (num >= 1000) {
                  return `PKR ${(num / 1000).toFixed(0)}K`;
                }
                return `PKR ${num.toLocaleString()}`;
              };
              
              return (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Property Name</label>
                      <p className="text-base text-gray-900">{selectedProperty.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Type</label>
                      <p className="text-base text-gray-900 capitalize">
                        {selectedProperty.property_type || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Status</label>
                      <Badge variant={
                        selectedProperty.status === 'active' ? 'success' : 
                        selectedProperty.status === 'coming-soon' ? 'warning' : 
                        'default'
                      }>
                        {selectedProperty.status || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Location</label>
                      <p className="text-base text-gray-900">
                        {selectedProperty.location_city}, {selectedProperty.location_state || ''} {selectedProperty.location_country}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Total Value</label>
                      <p className="text-base text-gray-900">
                        {formatPrice(selectedProperty.pricing_total_value)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Min Investment</label>
                      <p className="text-base text-gray-900">
                        {formatPrice(selectedProperty.pricing_min_investment)}
                      </p>
                    </div>
                    {selectedProperty.description && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600">Description</label>
                        <p className="text-base text-gray-900">{selectedProperty.description}</p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPropertyModal(false);
                  setSelectedProperty(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsManagement;

