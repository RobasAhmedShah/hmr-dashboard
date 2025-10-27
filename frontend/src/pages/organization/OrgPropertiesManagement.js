import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  Building2,
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { organizationsAPI, adminAPI } from '../../services/api';
import { useOrganizationAuth } from '../../components/organization/OrganizationAuth';

const OrgPropertiesManagement = ({ organizationId }) => {
  const { isAuthenticated } = useOrganizationAuth();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    property_type: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch properties using organization API (with fallback)
  const { data: propertiesData, isLoading, error } = useQuery(
    ['org-properties', organizationId],
    async () => {
      try {
        console.log('🔄 Fetching properties for organization:', organizationId);
        // Try organization-specific endpoint first
        const response = await organizationsAPI.getProperties(organizationId);
        console.log('✅ Properties API Response (org endpoint):', response);
        return response;
      } catch (error) {
        console.log('ℹ️ Organization properties endpoint not available, using fallback with filter');
        // Fallback to filtered admin endpoint
        const response = await adminAPI.getProperties({
          limit: 1000,
          organizationId: organizationId
        });
        console.log('✅ Properties API Response (admin endpoint):', response);
        return response;
      }
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated && !!organizationId
    }
  );

  const allProperties = propertiesData?.data?.data?.properties || 
                       propertiesData?.data?.properties || 
                       propertiesData?.data || 
                       (Array.isArray(propertiesData) ? propertiesData : []);

  // Frontend filtering
  const filteredProperties = useMemo(() => {
    let filtered = [...allProperties];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(property =>
        (property.name || '').toLowerCase().includes(searchLower) ||
        (property.location || '').toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.status) {
      filtered = filtered.filter(property =>
        (property.status || '').toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    if (filters.property_type) {
      filtered = filtered.filter(property =>
        (property.propertyType || property.property_type || '').toLowerCase() === filters.property_type.toLowerCase()
      );
    }
    
    return filtered;
  }, [allProperties, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'USD 0';
    return `USD ${parseFloat(amount).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'available':
        return <Badge variant="green">Available</Badge>;
      case 'sold':
        return <Badge variant="gray">Sold</Badge>;
      case 'pending':
        return <Badge variant="yellow">Pending</Badge>;
      default:
        return <Badge variant="gray">{status || 'Unknown'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load properties</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Properties Management</h2>
          <p className="text-gray-600">
            Manage your organization's properties
            <span className="ml-2 text-blue-600 font-medium">
              ({filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'})
            </span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties..."
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
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select
              value={filters.property_type}
              onChange={(e) => handleFilterChange('property_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="plot">Plot</option>
            </select>
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
              <option value="price">Price</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-500">
            {filters.search || filters.status || filters.property_type
              ? 'Try adjusting your filters'
              : 'No properties have been added yet'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {property.name || 'Unnamed Property'}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.location || 'No location'}
                    </div>
                  </div>
                  {getStatusBadge(property.status)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price per Token</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(property.pricePerToken || property.price_per_token)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Tokens</span>
                    <span className="font-semibold text-gray-900">
                      {(property.totalTokens || property.total_tokens || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Available Tokens</span>
                    <span className="font-semibold text-green-600">
                      {(property.availableTokens || property.available_tokens || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Type</span>
                      <Badge variant="blue">
                        {property.propertyType || property.property_type || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full flex items-center justify-center space-x-2"
                    onClick={() => navigate(`/admin/property/${property.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrgPropertiesManagement;

