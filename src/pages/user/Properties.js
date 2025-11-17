import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Grid, List, Building2 } from 'lucide-react';
import { propertiesAPI } from '../../services/api';
import Layout from '../../components/Layout/Layout';
import PropertyCard from '../../components/PropertyCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

const Properties = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    property_type: '',
    city: '',
    featured: false,
  });
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const handleInvest = (property, action = 'invest') => {
    if (action === 'details') {
      // Navigate to dedicated property detail page
      const propertyId = property.id || property.displayCode || property.slug;
      navigate(`/properties/${propertyId}`);
    } else if (action === 'invest') {
      navigate(`/wallet?buyTokens=1&propertyId=${property.id || property.displayCode}`);
    }
  };

  // Build query params - only include non-empty values
  const buildQueryParams = () => {
    const params = {
      page: currentPage,
      limit: 12,
    };
    
    // Only add filters if they have values
    if (filters.search && filters.search.trim()) {
      params.search = filters.search.trim();
    }
    
    if (filters.status && filters.status.trim()) {
      params.status = filters.status;
    }
    
    if (filters.property_type && filters.property_type.trim()) {
      params.property_type = filters.property_type;
    }
    
    if (filters.city && filters.city.trim()) {
      params.city = filters.city;
    }
    
    // Featured filter - send as boolean or string depending on API
    if (filters.featured) {
      params.featured = true;
    }
    
    return params;
  };

  const { data, isLoading, error, refetch } = useQuery(
    ['properties', filters, currentPage],
    () => propertiesAPI.getAll(buildQueryParams()),
    {
      keepPreviousData: true,
      onSuccess: (response) => {
        console.log('Properties API Response:', response);
        console.log('Properties Data:', response?.data);
        console.log('Applied Filters:', filters);
      },
      onError: (error) => {
        console.error('Properties API Error:', error);
        console.error('Error Response:', error.response?.data);
      },
    }
  );

  // Fetch filter options from database
  const { data: filterOptionsData } = useQuery(
    'property-filter-options',
    () => propertiesAPI.getFilterOptions(),
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: false, // Don't retry on 404
      onError: (error) => {
        // If filter options endpoint doesn't exist, that's okay - we have fallback options
        console.warn('Filter options endpoint not available, using fallback options');
      },
    }
  );

  // Handle both old and new API response formats
  // Try multiple response formats to handle different backend structures
  const properties = data?.data?.data?.properties || 
                     data?.data?.properties || 
                     data?.properties || 
                     data?.data?.data || 
                     (Array.isArray(data?.data) ? data.data : []) ||
                     [];
  const pagination = data?.data?.data?.pagination || 
                     data?.data?.pagination || 
                     data?.pagination || 
                     {};
  
  // Debug logging
  console.log('Parsed properties:', properties);
  console.log('Properties count:', properties.length);
  console.log('Pagination:', pagination);

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value,
      };
      console.log('Filter changed:', key, value, 'New filters:', newFilters);
      return newFilters;
    });
    setCurrentPage(1);
    // Filters will automatically trigger refetch via useQuery dependency
  };

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  const clearFilters = () => {
    console.log('Clearing all filters');
    setFilters({
      search: '',
      status: '',
      property_type: '',
      city: '',
      featured: false,
    });
    setCurrentPage(1);
    // Filters will automatically trigger refetch via useQuery dependency
  };

  // Get filter options from database or use fallbacks
  const filterOptions = filterOptionsData?.data?.data || {};
  const statusOptions = filterOptions.statuses || [
    { value: '', label: 'All Status' },
    { value: 'planning', label: 'Planning' },
    { value: 'coming-soon', label: 'Coming Soon' },
    { value: 'construction', label: 'Under Construction' },
    { value: 'active', label: 'Active' },
    { value: 'sold-out', label: 'Sold Out' },
    { value: 'completed', label: 'Completed' },
  ];

  const propertyTypeOptions = filterOptions.propertyTypes || [
    { value: '', label: 'All Types' },
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'mixed-use', label: 'Mixed Use' },
  ];

  const cityOptions = filterOptions.cities || [
    { value: '', label: 'All Cities' },
    { value: 'Karachi', label: 'Karachi' },
    { value: 'Lahore', label: 'Lahore' },
    { value: 'Islamabad', label: 'Islamabad' },
    { value: 'Rawalpindi', label: 'Rawalpindi' },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Properties</h1>
        <p className="text-gray-600">Discover investment opportunities in premium real estate</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search properties by name, location, or description..."
                value={filters.search}
                onChange={(e) => {
                  handleFilterChange('search', e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    refetch();
                  }
                }}
                className="pl-10"
              />
            </div>
          </form>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {(showFilters || window.innerWidth >= 1024) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    handleFilterChange('status', e.target.value);
                  }}
                  className="input"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select
                  value={filters.property_type}
                  onChange={(e) => {
                    handleFilterChange('property_type', e.target.value);
                  }}
                  className="input"
                >
                  {propertyTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select
                  value={filters.city}
                  onChange={(e) => {
                    handleFilterChange('city', e.target.value);
                  }}
                  className="input"
                >
                  {cityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={filters.featured}
                onChange={(e) => {
                  handleFilterChange('featured', e.target.checked);
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                Show only featured properties
              </label>
            </div>
          </div>
        )}
      </Card>

      {/* Active Filters Indicator */}
      {(filters.status || filters.property_type || filters.city || filters.featured || filters.search) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.status && (
            <Badge variant="default" className="text-xs">
              Status: {statusOptions.find(opt => opt.value === filters.status)?.label || filters.status}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="ml-2 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.property_type && (
            <Badge variant="default" className="text-xs">
              Type: {propertyTypeOptions.find(opt => opt.value === filters.property_type)?.label || filters.property_type}
              <button
                onClick={() => handleFilterChange('property_type', '')}
                className="ml-2 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.city && (
            <Badge variant="default" className="text-xs">
              City: {cityOptions.find(opt => opt.value === filters.city)?.label || filters.city}
              <button
                onClick={() => handleFilterChange('city', '')}
                className="ml-2 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.featured && (
            <Badge variant="default" className="text-xs">
              Featured Only
              <button
                onClick={() => handleFilterChange('featured', false)}
                className="ml-2 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.search && (
            <Badge variant="default" className="text-xs">
              Search: "{filters.search}"
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-2 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600">
            {isLoading ? 'Loading...' : `${pagination.totalProperties || properties.length || 0} properties found`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select className="text-sm border border-gray-300 rounded px-2 py-1">
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="roi">Highest ROI</option>
          </select>
        </div>
      </div>

      {/* Properties Grid/List */}
      {isLoading ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="h-48 bg-muted rounded-lg mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded mb-4"></div>
              <div className="h-8 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Building2 className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Properties</h3>
          <p className="text-gray-600 mb-4">There was an error loading the properties. Please try again.</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </Card>
      ) : properties.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Building2 className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Found</h3>
          <p className="text-gray-600 mb-4">
            {error ? 'Unable to load properties from the server.' : 'Try adjusting your search criteria or filters.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => refetch()}>Retry</Button>
            <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
          </div>
        </Card>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} onInvest={handleInvest} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPrevPage}
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Properties;
