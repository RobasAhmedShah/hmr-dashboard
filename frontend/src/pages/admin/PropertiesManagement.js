import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  Building2,
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  X
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PropertyForm from '../../components/admin/PropertyForm';
import { adminAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';

const PropertiesManagement = () => {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    property_type: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  const queryClient = useQueryClient();

  // Fetch properties
  const { data: propertiesData, isLoading, error } = useQuery(
    ['admin-properties'],
    () => adminAPI.getProperties({
      limit: 1000 // Get all properties for frontend filtering
    }),
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated
    }
  );

  // Update property status mutation - PATCH only the status field
  const updateStatusMutation = useMutation(
    ({ id, status }) => {
      console.log('🔄 Sending PATCH request to update status:', { id, status });
      return adminAPI.updatePropertyStatus(id, { status });
    },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['admin-properties']);
        setShowModal(false);
        setSelectedProperty(null);
        console.log('✅ Property status updated successfully:', response);
        alert(`✅ Property status updated to "${selectedProperty.status}" successfully!`);
      },
      onError: (error) => {
        console.error('❌ Failed to update property status:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          endpoint: error.config?.url,
          method: error.config?.method
        });
        
        let errorMessage = '❌ Failed to update property status\n\n';
        
        if (error.response?.status === 404) {
          errorMessage += '⚠️ Endpoint Not Found (404)\n\n';
          errorMessage += `The backend endpoint PATCH /properties/:id is not implemented yet.\n\n`;
          errorMessage += '📋 Backend Team To-Do:\n';
          errorMessage += '1. Implement PATCH /properties/:id endpoint\n';
          errorMessage += '2. Accept partial updates like: { status: "active" }\n';
          errorMessage += '3. Return updated property data\n\n';
          errorMessage += '💡 Note: Frontend is sending PATCH with only { status: "..." }';
        } else if (error.message === 'Network Error') {
          errorMessage += '⚠️ CORS or Network Error\n\n';
          errorMessage += 'Possible causes:\n';
          errorMessage += '1. Backend CORS not allowing PATCH method\n';
          errorMessage += '2. Backend endpoint not implemented\n';
          errorMessage += '3. Network connectivity issue\n\n';
          errorMessage += '💡 Check browser console for CORS errors';
        } else {
          errorMessage += error.response?.data?.message || error.message;
        }
        
        alert(errorMessage);
      }
    }
  );

  // Create property mutation - POST /properties
  const createPropertyMutation = useMutation(
    (propertyData) => {
      console.log('📤 Creating new property:', {
        endpoint: 'POST /properties',
        data: propertyData
      });
      return adminAPI.createProperty(propertyData);
    },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['admin-properties']);
        setShowPropertyForm(false);
        setEditingProperty(null);
        console.log('✅ Property created successfully:', response);
        
        const newProperty = response?.data?.data || response?.data;
        const displayCode = newProperty?.displayCode || 'New Property';
        
        alert(`✅ Property "${displayCode}" created successfully!`);
      },
      onError: (error) => {
        console.error('❌ Failed to create property:', error);
        console.error('Full error response:', error.response);
        console.error('Error details:', {
          message: error.message,
          responseData: error.response?.data,
          status: error.response?.status,
          endpoint: error.config?.url,
          method: error.config?.method,
          sentData: error.config?.data
        });
        
        let errorMessage = '❌ Failed to create property\n\n';
        
        if (error.response?.status === 400) {
          errorMessage += '⚠️ Validation Error\n\n';
          const responseData = error.response?.data;
          const validationErrors = responseData?.message || responseData?.errors || responseData;
          
          console.log('Validation errors:', validationErrors);
          console.log('Validation errors type:', typeof validationErrors);
          console.log('Is array?', Array.isArray(validationErrors));
          
          if (Array.isArray(validationErrors)) {
            errorMessage += 'Please fix the following:\n';
            validationErrors.forEach((err, index) => {
              console.log(`Error ${index}:`, err);
              if (typeof err === 'string') {
                errorMessage += `${index + 1}. ${err}\n`;
              } else {
                errorMessage += `${index + 1}. ${JSON.stringify(err)}\n`;
              }
            });
          } else if (typeof validationErrors === 'object' && validationErrors !== null) {
            errorMessage += 'Please fix the following:\n';
            Object.entries(validationErrors).forEach(([field, msg]) => {
              errorMessage += `• ${field}: ${JSON.stringify(msg)}\n`;
            });
          } else {
            errorMessage += validationErrors || 'Please check all required fields.';
          }
          
          errorMessage += '\n\n📋 Check console for full error details.';
        } else if (error.response?.status === 404) {
          errorMessage += '⚠️ Endpoint Not Found (404)\n\n';
          errorMessage += 'The backend endpoint POST /properties is not available.\n\n';
          errorMessage += '📋 Backend Team To-Do:\n';
          errorMessage += '1. Implement POST /properties endpoint\n';
          errorMessage += '2. Accept property data in request body\n';
          errorMessage += '3. Create property in database\n';
          errorMessage += '4. Return created property with displayCode';
        } else if (error.message === 'Network Error') {
          errorMessage += '⚠️ Network/CORS Error\n\n';
          errorMessage += 'Possible causes:\n';
          errorMessage += '1. Backend server is down\n';
          errorMessage += '2. CORS not allowing POST method\n';
          errorMessage += '3. Network connectivity issue';
        } else {
          errorMessage += error.response?.data?.message || error.message;
        }
        
        alert(errorMessage);
      }
    }
  );

  // Update property mutation
  const updatePropertyMutation = useMutation(
    ({ id, data }) => adminAPI.updateProperty(id, data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['admin-properties']);
        setShowPropertyForm(false);
        setEditingProperty(null);
        console.log('Property updated successfully:', response);
        alert('✅ Property updated successfully!');
      },
      onError: (error) => {
        console.error('Failed to update property:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          endpoint: error.config?.url,
          method: error.config?.method
        });
        
        let errorMessage = '❌ Failed to update property\n\n';
        
        if (error.response?.status === 404) {
          errorMessage += '⚠️ Endpoint Not Found (404)\n\n';
          errorMessage += `The backend endpoint PATCH /properties/:id is not implemented yet.\n\n`;
          errorMessage += '📋 Backend Team To-Do:\n';
          errorMessage += '1. Implement PATCH /properties/:id endpoint\n';
          errorMessage += '2. Accept partial property data in request body\n';
          errorMessage += '3. Update property fields in database\n';
          errorMessage += '4. Return updated property data\n\n';
          errorMessage += '💡 Current Status: Frontend is ready, waiting for backend implementation.';
        } else if (error.response?.status === 400) {
          errorMessage += '⚠️ Validation Error\n\n';
          errorMessage += error.response?.data?.message || 'Please check all required fields.';
        } else {
          errorMessage += error.response?.data?.message || error.message;
        }
        
        alert(errorMessage);
      }
    }
  );

  // Delete property mutation
  const deletePropertyMutation = useMutation(
    (id) => adminAPI.deleteProperty(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-properties']);
        setShowDeleteModal(false);
        setPropertyToDelete(null);
        console.log('Property deleted successfully');
        alert('✅ Property deleted successfully!');
      },
      onError: (error) => {
        console.error('Failed to delete property:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          endpoint: error.config?.url
        });
        
        let errorMessage = '❌ Failed to delete property\n\n';
        
        if (error.response?.status === 404) {
          errorMessage += '⚠️ Endpoint Not Found (404)\n\n';
          errorMessage += `The backend endpoint DELETE /properties/:id is not implemented yet.\n\n`;
          errorMessage += '📋 Backend Team To-Do:\n';
          errorMessage += '1. Implement DELETE /properties/:id endpoint\n';
          errorMessage += '2. Check if property has active investments\n';
          errorMessage += '3. Prevent deletion if funded\n';
          errorMessage += '4. Delete property from database\n';
          errorMessage += '5. Return success confirmation\n\n';
          errorMessage += '💡 Current Status: Frontend is ready with delete protection, waiting for backend implementation.';
        } else if (error.response?.status === 400) {
          errorMessage += '⚠️ Cannot Delete\n\n';
          errorMessage += error.response?.data?.message || 'This property cannot be deleted.';
        } else {
          errorMessage += error.response?.data?.message || error.message;
        }
        
        alert(errorMessage);
        setShowDeleteModal(false);
        setPropertyToDelete(null);
      }
    }
  );

  // Parse response - handle different backend formats
  // Get all properties from API response
  const allProperties = propertiesData?.data?.data?.properties || 
                        propertiesData?.data?.properties || 
                        propertiesData?.data || 
                        (Array.isArray(propertiesData) ? propertiesData : []);
  
  // Frontend filtering logic
  const filteredProperties = useMemo(() => {
    let filtered = [...allProperties];
    
    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(property => {
        const title = (property.title || '').toLowerCase();
        const description = (property.description || '').toLowerCase();
        const location = (property.location_city || '').toLowerCase();
        const displayCode = (property.displayCode || '').toLowerCase();
        
        return title.includes(searchLower) ||
               description.includes(searchLower) ||
               location.includes(searchLower) ||
               displayCode.includes(searchLower);
      });
    }
    
    // Status filter
    if (filters.status && filters.status.trim()) {
      filtered = filtered.filter(property => {
        const propertyStatus = (property.status || '').toLowerCase();
        const filterStatus = filters.status.toLowerCase();
        return propertyStatus === filterStatus;
      });
    }
    
    // Property type filter
    if (filters.property_type && filters.property_type.trim()) {
      filtered = filtered.filter(property => {
        const propertyType = (property.property_type || property.propertyType || property.type || '').toLowerCase();
        const filterType = filters.property_type.toLowerCase();
        return propertyType === filterType;
      });
    }
    
    // Sorting
    if (filters.sort_by) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (filters.sort_by) {
          case 'title':
            aValue = (a.title || '').toLowerCase();
            bValue = (b.title || '').toLowerCase();
            break;
          case 'pricing_total_value':
            aValue = parseFloat(a.pricing_total_value || a.totalValueUSDT || 0);
            bValue = parseFloat(b.pricing_total_value || b.totalValueUSDT || 0);
            break;
          case 'pricing_expected_roi':
            aValue = parseFloat(a.pricing_expected_roi || a.expectedROI || 0);
            bValue = parseFloat(b.pricing_expected_roi || b.expectedROI || 0);
            break;
          case 'created_at':
          default:
            aValue = new Date(a.created_at || a.createdAt || 0);
            bValue = new Date(b.created_at || b.createdAt || 0);
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
  }, [allProperties, filters]);
  
  // Use filtered properties instead of raw properties
  const properties = filteredProperties;
  
  const pagination = propertiesData?.data?.data?.pagination || 
                     propertiesData?.data?.pagination || 
                     {
                       totalPages: 1,
                       currentPage: 1,
                       totalProperties: properties.length,
                       hasPrev: false,
                       hasNext: false
                     };

  // Debug logging
  console.log('📦 Properties API Response:', {
    raw: propertiesData,
    parsed: properties,
    pagination: pagination,
    count: properties.length,
    isArray: Array.isArray(properties)
  });
  
  // Log each property for detailed inspection
  if (properties.length > 0) {
    console.log(`✅ Found ${properties.length} properties`);
    properties.forEach((property, index) => {
      console.log(`🏢 Property ${index + 1}:`, {
        id: property.id,
        displayCode: property.displayCode,
        title: property.title,
        status: property.status,
        type: property.propertyType || property.property_type || property.type,
        totalValue: property.purchasePriceUSDT || property.totalValueUSDT || property.pricing_total_value,
        rawProperty: property
      });
    });
  } else {
    console.warn('⚠️ No properties found in response');
    console.log('Check if backend has properties:', 'https://hmr-backend.vercel.app/properties');
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // No need to reset currentPage since we're using frontend filtering
  };

  const handleStatusUpdate = (property) => {
    setSelectedProperty(property);
    setShowModal(true);
  };

  const handleViewProperty = (property) => {
    setSelectedProperty(property);
    setShowModal(true);
  };

  const confirmStatusUpdate = () => {
    if (selectedProperty) {
      console.log('📤 Updating property status:', {
        displayCode: selectedProperty.displayCode,
        propertyTitle: selectedProperty.title,
        newStatus: selectedProperty.status,
        endpoint: `PATCH /properties/${selectedProperty.displayCode}`,
        body: { status: selectedProperty.status }
      });
      
      // Using displayCode (PROP-000006) as identifier
      updateStatusMutation.mutate({
        id: selectedProperty.displayCode,
        status: selectedProperty.status
      });
    }
  };

  const handleCreateProperty = () => {
    setEditingProperty(null);
    setShowPropertyForm(true);
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setShowPropertyForm(true);
  };

  const handleSaveProperty = (propertyData) => {
    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data: propertyData });
    } else {
      createPropertyMutation.mutate(propertyData);
    }
  };

  const handleDeleteProperty = (property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const confirmDeleteProperty = () => {
    if (propertyToDelete) {
      deletePropertyMutation.mutate(propertyToDelete.id);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'coming-soon': { variant: 'warning', text: 'Coming Soon' },
      'active': { variant: 'success', text: 'Active' },
      'construction': { variant: 'info', text: 'Under Construction' },
      'on-hold': { variant: 'secondary', text: 'On Hold' },
      'sold-out': { variant: 'danger', text: 'Sold Out' },
      'completed': { variant: 'primary', text: 'Completed' }
    };
    return statusMap[status] || { variant: 'default', text: status };
  };

  const getPropertyTypeColor = (type) => {
    const typeMap = {
      'residential': 'bg-blue-100 text-blue-800',
      'commercial': 'bg-green-100 text-green-800',
      'mixed-use': 'bg-purple-100 text-purple-800'
    };
    return typeMap[type] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    if (num >= 1000000000) {
      return `PKR ${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `PKR ${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `PKR ${(num / 1000).toFixed(0)}K`;
    }
    return `PKR ${num.toFixed(0)}`;
  };

  const calculateFundingPercentage = (total, available) => {
    // Convert to numbers to handle string inputs
    const totalNum = parseFloat(total) || 0;
    const availableNum = parseFloat(available) || 0;
    
    if (totalNum === 0) return 0;
    
    const percentage = ((totalNum - availableNum) / totalNum) * 100;
    console.log(`Funding calculation: total=${totalNum}, available=${availableNum}, percentage=${percentage}`);
    return percentage;
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to view properties.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading properties...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load properties: {error.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }


  // Count active filters
  const activeFiltersCount = [
    filters.search,
    filters.status,
    filters.property_type
  ].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      search: '',
      status: '',
      property_type: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    });
    // Filters are applied on frontend, no need to reset page
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Properties Management</h2>
          <p className="text-gray-600">
            Manage all properties in your platform
            {properties.length > 0 && (
              <span className="ml-2 text-blue-600 font-semibold">
                ({properties.length} {properties.length === 1 ? 'property' : 'properties'} found)
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleCreateProperty} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="info" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear All Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
              {filters.search && <span className="ml-1 text-blue-600">*</span>}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  filters.search ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
              {filters.status && <span className="ml-1 text-blue-600">*</span>}
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                filters.status ? 'border-blue-500 bg-blue-50 font-semibold' : 'border-gray-300'
              }`}
            >
              <option value="">All Status</option>
              <option value="coming-soon">Coming Soon</option>
              <option value="active">Active</option>
              <option value="construction">Under Construction</option>
              <option value="on-hold">On Hold</option>
              <option value="sold-out">Sold Out</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type
              {filters.property_type && <span className="ml-1 text-blue-600">*</span>}
            </label>
            <select
              value={filters.property_type}
              onChange={(e) => handleFilterChange('property_type', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                filters.property_type ? 'border-blue-500 bg-blue-50 font-semibold' : 'border-gray-300'
              }`}
            >
              <option value="">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed-use">Mixed Use</option>
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
              <option value="title">Title</option>
              <option value="pricing_total_value">Total Value</option>
              <option value="pricing_expected_roi">Expected ROI</option>
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

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              
              {filters.search && (
                <Badge variant="info" className="flex items-center space-x-1">
                  <span>Search: "{filters.search}"</span>
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              {filters.status && (
                <Badge variant="info" className="flex items-center space-x-1">
                  <span>Status: {filters.status}</span>
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              {filters.property_type && (
                <Badge variant="info" className="flex items-center space-x-1">
                  <span>Type: {filters.property_type}</span>
                  <button
                    onClick={() => handleFilterChange('property_type', '')}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              <Badge variant="secondary" className="ml-auto">
                Sorted by: {filters.sort_by === 'created_at' ? 'Date Created' : 
                          filters.sort_by === 'title' ? 'Title' :
                          filters.sort_by === 'pricing_total_value' ? 'Total Value' : 'Expected ROI'} 
                {filters.sort_order === 'desc' ? ' ↓' : ' ↑'}
              </Badge>
            </div>
          </div>
        )}
      </Card>


      {/* Properties Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funding
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Building2 className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No properties found</p>
                      <p className="text-sm">Try adjusting your filters or add a new property</p>
                    </div>
                  </td>
                </tr>
              ) : (
                properties.map((property) => {
                // Map backend fields to expected frontend fields
                const mappedProperty = {
                  ...property,
                  title: property.title,
                  location_city: property.city || property.location_city || 'Unknown City',
                  property_type: property.propertyType || property.property_type || property.type || 'residential',
                  status: property.status || 'active',
                  pricing_total_value: property.purchasePriceUSDT || 
                                      property.totalValueUSDT || 
                                      property.pricing_total_value || 
                                      property.totalValue ||
                                      property.price ||
                                      0,
                  pricing_expected_roi: property.expectedROI || 
                                       property.pricing_expected_roi || 
                                       property.roi ||
                                       0,
                  tokenization_total_tokens: property.totalTokens || 
                                            property.tokenization_total_tokens || 
                                            property.tokens ||
                                            0,
                  tokenization_available_tokens: property.availableTokens || 
                                                property.tokenization_available_tokens || 
                                                property.totalTokens || 
                                                property.tokens ||
                                                0,
                };

                const fundingPercentage = calculateFundingPercentage(
                  mappedProperty.tokenization_total_tokens,
                  mappedProperty.tokenization_available_tokens
                );
                
                // Explicit check for delete button - consider very small funding as "no funding"
                const canDelete = fundingPercentage < 0.0001; // Less than 0.01%
                const isDisabled = fundingPercentage >= 0.0001; // 0.01% or more
                
                // Debug logging for all properties
                console.log(`🏢 ${mappedProperty.title}:`, {
                  '📦 RAW BACKEND DATA': property,
                  '🔄 MAPPED DATA': mappedProperty,
                  '💰 Price Fields Found': {
                    purchasePriceUSDT: property.purchasePriceUSDT,
                    totalValueUSDT: property.totalValueUSDT,
                    pricing_total_value: property.pricing_total_value,
                    totalValue: property.totalValue,
                    price: property.price,
                    '✅ USING': mappedProperty.pricing_total_value
                  },
                  '📊 ROI Fields Found': {
                    expectedROI: property.expectedROI,
                    roi: property.roi,
                    '✅ USING': mappedProperty.pricing_expected_roi
                  },
                  '🎫 Token Fields Found': {
                    totalTokens: property.totalTokens,
                    availableTokens: property.availableTokens,
                    '✅ USING Total': mappedProperty.tokenization_total_tokens,
                    '✅ USING Available': mappedProperty.tokenization_available_tokens
                  },
                  '📈 Funding': fundingPercentage + '%'
                });
                const statusInfo = getStatusBadge(mappedProperty.status);

                return (
                  <tr key={mappedProperty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <button
                              onClick={() => handleViewProperty(mappedProperty)}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                            >
                              {mappedProperty.title}
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {mappedProperty.location_city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getPropertyTypeColor(mappedProperty.property_type)}>
                        {mappedProperty.property_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={statusInfo.variant}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setSelectedProperty(mappedProperty);
                          setShowModal(true);
                        }}
                        title="Click to change status"
                      >
                        {statusInfo.text}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(mappedProperty.pricing_total_value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${isDisabled ? 'bg-green-600' : 'bg-gray-400'}`}
                            style={{ width: `${Math.max(fundingPercentage, 0.1)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm ${isDisabled ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                          {fundingPercentage < 0.01 ? fundingPercentage.toFixed(5) : Math.round(fundingPercentage)}%
                        </span>
                        {isDisabled && (
                          <span className="ml-2 text-xs text-red-500">🔒</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mappedProperty.pricing_expected_roi}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProperty(mappedProperty)}
                          title="Edit Property"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewProperty(mappedProperty)}
                          title="View Property Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`${isDisabled ? 'text-gray-400 cursor-not-allowed opacity-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                          onClick={() => {
                            console.log(`Delete clicked for ${mappedProperty.title}:`, {
                              fundingPercentage,
                              canDelete: canDelete,
                              isDisabled: isDisabled,
                              total: mappedProperty.tokenization_total_tokens,
                              available: mappedProperty.tokenization_available_tokens
                            });
                            if (isDisabled) {
                              console.log(`Cannot delete ${mappedProperty.title} - funding: ${fundingPercentage}%`);
                              alert(`⚠️ Cannot delete property with ${fundingPercentage.toFixed(2)}% funding.\n\nProperties can only be deleted if they have zero funding.`);
                              return;
                            }
                            handleDeleteProperty(mappedProperty);
                          }}
                          disabled={isDisabled}
                          title={isDisabled ? `Cannot delete property with ${fundingPercentage.toFixed(5)}% funding` : 'Delete Property'}
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                  Showing{' '}
                  <span className="font-medium">
                    {((currentPage - 1) * 10) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, pagination.totalProperties)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalProperties}</span>{' '}
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
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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

      {/* Property Details Modal */}
      {showModal && selectedProperty && (() => {
        const totalTokens = parseFloat(selectedProperty.tokenization_total_tokens || 0);
        const availableTokens = parseFloat(selectedProperty.tokenization_available_tokens || 0);
        const soldTokens = totalTokens - availableTokens;
        const fundingProgress = totalTokens > 0 ? ((soldTokens / totalTokens) * 100) : 0;
        const totalValue = parseFloat(selectedProperty.pricing_total_value || selectedProperty.totalValueUSDT || 0);
        const pricePerToken = totalTokens > 0 ? (totalValue / totalTokens) : 0;
        const totalInvestment = soldTokens * pricePerToken;
        const totalBuyers = selectedProperty.investment_stats?.totalInvestors || 0;
        const roi = selectedProperty.pricing_expected_roi || selectedProperty.expectedROI || 0;
        
        return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white my-10">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedProperty(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProperty.title}</h2>
                <p className="text-gray-600 flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {selectedProperty.location_city || 'Unknown City'}
                </p>
                </div>

              {/* Investment Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                  <p className="text-xs text-gray-600 mb-1">Total Investment</p>
                  <p className="text-lg font-bold text-gray-900">{formatPrice(totalInvestment)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-600 mb-1">Total Buyers</p>
                  <p className="text-lg font-bold text-gray-900">{totalBuyers}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-600 mb-1">Tokens Left</p>
                  <p className="text-lg font-bold text-gray-900">{availableTokens.toLocaleString()}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-600 mb-1">ROI</p>
                  <p className="text-lg font-bold text-green-600">{roi}%</p>
                </Card>
                </div>

              {/* Second Row Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                  <p className="text-xs text-gray-600 mb-1">Price Per Token</p>
                  <p className="text-lg font-bold text-gray-900">{formatPrice(pricePerToken)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-600 mb-1">Total Tokens</p>
                  <p className="text-lg font-bold text-gray-900">{totalTokens.toLocaleString()}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-600 mb-1">Funding Progress</p>
                  <p className="text-lg font-bold text-blue-600">{fundingProgress.toFixed(2)}%</p>
                </Card>
                </div>

              {/* Property Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600">Property Name</label>
                    <p className="text-base text-gray-900">{selectedProperty.title}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600">Type</label>
                    <p className="text-base text-gray-900 capitalize">{selectedProperty.property_type || selectedProperty.type}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <Badge variant={getStatusBadge(selectedProperty.status).variant}>
                      {getStatusBadge(selectedProperty.status).text}
                    </Badge>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600">Location</label>
                    <p className="text-base text-gray-900">{selectedProperty.location_city || 'Unknown City'}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600">Total Value</label>
                    <p className="text-base text-gray-900">{formatPrice(totalValue)}</p>
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Min Investment</label>
                    <p className="text-base text-gray-900">{formatPrice(selectedProperty.pricing_min_investment || 0)}</p>
                  </div>
                  </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedProperty(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    handleEditProperty(selectedProperty);
                  }}
                  className="flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Property
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Property Form Modal */}
      {showPropertyForm && (
        <PropertyForm
          property={editingProperty}
          onSave={handleSaveProperty}
          onCancel={() => {
            setShowPropertyForm(false);
            setEditingProperty(null);
          }}
          isLoading={createPropertyMutation.isLoading || updatePropertyMutation.isLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && propertyToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Delete Property</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              {/* Property Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-2">{propertyToDelete.title}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Type: {propertyToDelete.property_type}</p>
                  <p>Status: {propertyToDelete.status}</p>
                  <p>Location: {propertyToDelete.location_city}</p>
                  <p>Total Value: {formatPrice(propertyToDelete.pricing_total_value)}</p>
                  <p>Funding: {calculateFundingPercentage(
                    propertyToDelete.tokenization_total_tokens,
                    propertyToDelete.tokenization_available_tokens
                  ).toFixed(5)}%</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-6">
                Are you sure you want to delete this property? 
                This will deactivate the property listing and remove it from the platform.
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPropertyToDelete(null);
                  }}
                  disabled={deletePropertyMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteProperty}
                  disabled={deletePropertyMutation.isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deletePropertyMutation.isLoading ? 'Deleting...' : 'Delete Property'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesManagement;
