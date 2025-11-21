import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Building2,
  MapPin,
  AlertTriangle,
  X,
  DollarSign,
  Coins,
  Users
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import PropertyForm from '../../components/admin/PropertyForm';
import { adminAPI, rewardsAPI, investmentsAPI, blocksBackendAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';

const PropertiesManagement = () => {
  const { isAuthenticated } = useAdminAuth();
  
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
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [propertyForReward, setPropertyForReward] = useState(null);
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardDistributionResult, setRewardDistributionResult] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(null); // Track which property's status modal is open (stores property object)

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
        setStatusModalOpen(null);
        console.log('✅ Property status updated successfully:', response);
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
      // Explicitly verify images and documents are included
      console.log('📤 Creating new property:', {
        endpoint: 'POST /properties',
        hasImages: 'images' in propertyData,
        imagesCount: propertyData?.images?.length || 0,
        images: propertyData?.images,
        hasDocuments: 'documents' in propertyData,
        documentsCount: propertyData?.documents?.length || 0,
        documents: propertyData?.documents
      });
      
      // Ensure images field is present (even if empty)
      if (!propertyData.images) {
        console.warn('⚠️ Images field missing! Adding empty array.');
        propertyData.images = [];
      }
      
      // Verify images format
      if (propertyData.images && propertyData.images.length > 0) {
        const allValid = propertyData.images.every(img => 
          typeof img === 'string' && img.length > 0
        );
        if (!allValid) {
          console.error('❌ Some images have invalid format!', propertyData.images);
        } else {
          console.log('✅ All images are valid and will be sent to backend');
        }
      }
      
      // Ensure documents field is present (even if empty)
      if (!propertyData.documents) {
        console.warn('⚠️ Documents field missing! Adding empty array.');
        propertyData.documents = [];
      }
      
      // Verify documents format
      if (propertyData.documents && propertyData.documents.length > 0) {
        const allValid = propertyData.documents.every(doc => 
          doc && typeof doc === 'object' && doc.url && doc.name && doc.type
        );
        if (!allValid) {
          console.error('❌ Some documents have invalid format!', propertyData.documents);
        } else {
          console.log('✅ All documents are valid and will be sent to backend');
        }
      }
      
      return adminAPI.createProperty(propertyData);
    },
    {
      onSuccess: async (response, variables) => {
        queryClient.invalidateQueries(['admin-properties']);
        setShowPropertyForm(false);
        setEditingProperty(null);
        console.log('✅ Property created successfully:', response);
        
        const newProperty = response?.data?.data || response?.data;
        const propertyId = newProperty?.id || newProperty?.displayCode;
        const displayCode = newProperty?.displayCode || 'New Property';
        
        // Post documents to blocks backend if property was created and has documents
        // variables contains the propertyData that was passed to the mutation
        const propertyData = variables;
        // Check if documents exist (object structure: { brochure, floorPlan, compliance })
        const hasDocuments = propertyData?.documents && (
          propertyData.documents.brochure || 
          propertyData.documents.floorPlan || 
          (Array.isArray(propertyData.documents.compliance) && propertyData.documents.compliance.length > 0)
        );
        
        if (propertyId && hasDocuments) {
          try {
            console.log('📤 PATCH posting documents to blocks backend for property:', propertyId, propertyData.documents);
            await blocksBackendAPI.postPropertyDocuments(propertyId, propertyData.documents);
            console.log('✅ Documents posted to blocks backend successfully');
          } catch (docError) {
            console.error('⚠️ Failed to post documents to blocks backend:', docError);
            // Don't fail the whole operation if documents posting fails
            console.warn('⚠️ Property created but documents not saved to blocks backend');
          }
        }
        
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
    ({ id, data }) => {
      // Explicitly verify images and documents are included
      console.log('📤 Updating property:', {
        endpoint: `PATCH /properties/${id}`,
        hasImages: 'images' in data,
        imagesCount: data?.images?.length || 0,
        images: data?.images,
        hasDocuments: 'documents' in data,
        documentsCount: data?.documents?.length || 0,
        documents: data?.documents
      });
      
      // Ensure images field is present (even if empty)
      if (!data.images) {
        console.warn('⚠️ Images field missing in update! Adding empty array.');
        data.images = [];
      }
      
      // Verify images format
      if (data.images && data.images.length > 0) {
        const allValid = data.images.every(img => 
          typeof img === 'string' && img.length > 0
        );
        if (!allValid) {
          console.error('❌ Some images have invalid format!', data.images);
        } else {
          console.log('✅ All images are valid and will be sent to backend');
        }
      }
      
      // Ensure documents field is present (even if empty)
      if (!data.documents) {
        console.warn('⚠️ Documents field missing in update! Adding empty array.');
        data.documents = [];
      }
      
      // Verify documents format
      if (data.documents && data.documents.length > 0) {
        const allValid = data.documents.every(doc => 
          doc && typeof doc === 'object' && doc.url && doc.name && doc.type
        );
        if (!allValid) {
          console.error('❌ Some documents have invalid format!', data.documents);
        } else {
          console.log('✅ All documents are valid and will be sent to backend');
        }
      }
      
      return adminAPI.updateProperty(id, data);
    },
    {
      onSuccess: async (response, variables) => {
        queryClient.invalidateQueries(['admin-properties']);
        setShowPropertyForm(false);
        setEditingProperty(null);
        console.log('Property updated successfully:', response);
        
        // Update documents in blocks backend if property has documents
        // variables contains { id, data } that was passed to the mutation
        const { id, data } = variables;
        // Check if documents exist (object structure: { brochure, floorPlan, compliance })
        const hasDocuments = data?.documents && (
          data.documents.brochure || 
          data.documents.floorPlan || 
          (Array.isArray(data.documents.compliance) && data.documents.compliance.length > 0)
        );
        
        if (id && hasDocuments) {
          try {
            console.log('📤 PATCH updating documents in blocks backend for property:', id, data.documents);
            await blocksBackendAPI.updatePropertyDocuments(id, data.documents);
            console.log('✅ Documents updated in blocks backend successfully');
          } catch (docError) {
            console.error('⚠️ Failed to update documents in blocks backend:', docError);
            // Don't fail the whole operation if documents update fails
            console.warn('⚠️ Property updated but documents not saved to blocks backend');
          }
        }
        
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

  // Fetch all investments to filter by property (backend doesn't support propertyId filter)
  const { data: allInvestmentsData, isLoading: isLoadingInvestments } = useQuery(
    ['all-investments'],
    () => investmentsAPI.getAll(),
    {
      enabled: !!propertyForReward && showRewardModal,
      retry: 1,
    }
  );

  // Calculate total tokens in market from confirmed investments for this property
  const totalTokensInMarket = useMemo(() => {
    if (!propertyForReward || !allInvestmentsData?.data) {
      // Fallback: calculate from property tokens (total - available)
      if (propertyForReward) {
        const total = parseFloat(propertyForReward.tokenization_total_tokens || propertyForReward.totalTokens || 0);
        const available = parseFloat(propertyForReward.tokenization_available_tokens || propertyForReward.availableTokens || 0);
        return Math.max(0, total - available);
      }
      return 0;
    }
    
    const investments = Array.isArray(allInvestmentsData.data) 
      ? allInvestmentsData.data 
      : allInvestmentsData.data.data || [];
    
    const propertyId = propertyForReward.id || propertyForReward.displayCode;
    const propertyInvestments = investments.filter(inv => 
      (inv.propertyId === propertyId || 
       inv.property?.id === propertyId || 
       inv.property?.displayCode === propertyId) &&
      (inv.status === 'confirmed' || inv.status === 'active')
    );
    
    return propertyInvestments.reduce((sum, inv) => {
      const tokens = parseFloat(inv.tokensPurchased) || 0;
      return sum + tokens;
    }, 0);
  }, [allInvestmentsData, propertyForReward]);

  // Count investors for this property
  const investorCount = useMemo(() => {
    if (!propertyForReward || !allInvestmentsData?.data) return 0;
    
    const investments = Array.isArray(allInvestmentsData.data) 
      ? allInvestmentsData.data 
      : allInvestmentsData.data.data || [];
    
    const propertyId = propertyForReward.id || propertyForReward.displayCode;
    const propertyInvestments = investments.filter(inv => 
      (inv.propertyId === propertyId || 
       inv.property?.id === propertyId || 
       inv.property?.displayCode === propertyId) &&
      (inv.status === 'confirmed' || inv.status === 'active')
    );
    
    // Count unique users
    const uniqueUsers = new Set(propertyInvestments.map(inv => inv.userId || inv.user?.id));
    return uniqueUsers.size;
  }, [allInvestmentsData, propertyForReward]);

  // Distribute reward mutation
  const distributeRewardMutation = useMutation(
    (data) => rewardsAPI.distributeRoi(data),
    {
      onSuccess: (response) => {
        console.log('✅ Reward distributed successfully:', response);
        const result = response?.data || response;
        setRewardDistributionResult(result);
        queryClient.invalidateQueries(['admin-properties']);
        queryClient.invalidateQueries(['all-investments']);
        // Show success message
        const message = result.message || `Successfully distributed ${rewardAmount} USDT`;
        alert(`✅ ${message}`);
      },
      onError: (error) => {
        console.error('❌ Failed to distribute reward:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        alert(`❌ Failed to distribute reward: ${errorMsg}`);
      }
    }
  );

  // Handle reward distribution
  const handleDistributeReward = (property) => {
    setPropertyForReward(property);
    setRewardAmount('');
    setRewardDistributionResult(null);
    setShowRewardModal(true);
  };

  // Confirm reward distribution
  const confirmDistributeReward = () => {
    if (!propertyForReward) return;
    if (!rewardAmount || parseFloat(rewardAmount) <= 0) {
      alert('Please enter a valid reward amount (greater than 0)');
      return;
    }

    const propertyId = propertyForReward.displayCode || propertyForReward.id;
    distributeRewardMutation.mutate({
      propertyId: propertyId,
      totalRoiUSDT: parseFloat(rewardAmount)
    });
  };

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

  const handleEditProperty = async (property) => {
    // Fetch full property data from backend to ensure all fields are loaded
    const propertyId = property.id || property.displayCode;
    if (propertyId) {
      try {
        console.log('📥 Fetching full property data for editing:', propertyId);
        const response = await adminAPI.getProperty(propertyId);
        const fullProperty = response?.data?.data || response?.data || property;
        console.log('✅ Fetched full property data from backend:', fullProperty);
        setEditingProperty(fullProperty);
        setShowPropertyForm(true);
      } catch (error) {
        console.error('❌ Failed to fetch property data, using existing data:', error);
        // Fallback to existing property data if fetch fails
        setEditingProperty(property);
        setShowPropertyForm(true);
      }
    } else {
      // No ID, just use the property as-is
      setEditingProperty(property);
      setShowPropertyForm(true);
    }
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
      'completed': { variant: 'primary', text: 'Completed' },
      'generating-income': { variant: 'success', text: 'Generating Income' },
      'funding': { variant: 'info', text: 'Funding' },
      'pending': { variant: 'warning', text: 'Pending' }
    };
    return statusMap[status] || { variant: 'default', text: status };
  };

  // Available status options for 3x3 grid modal
  const statusOptions = [
    { value: 'coming-soon', label: 'Coming Soon' },
    { value: 'active', label: 'Active' },
    { value: 'construction', label: 'Under Construction' },
    { value: 'funding', label: 'Funding' },
    { value: 'generating-income', label: 'Generating Income' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'sold-out', label: 'Sold Out' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' }
  ];

  // Handle status change from modal
  const handleStatusChange = (property, newStatus) => {
    updateStatusMutation.mutate({
      id: property.displayCode || property.id,
      status: newStatus
    });
    setStatusModalOpen(null); // Close modal
  };

  const getPropertyTypeColor = (type) => {
    const typeMap = {
      'residential': 'bg-blue-100 text-blue-800',
      'commercial': 'bg-green-100 text-green-800',
      'mixed-use': 'bg-purple-100 text-purple-800'
    };
    return typeMap[type] || 'bg-muted text-muted-foreground';
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toFixed(0)}`;
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
        <p className="text-muted-foreground">Please log in to view properties.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-muted-foreground">Loading properties...</span>
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
          <h2 className="text-2xl font-bold text-card-foreground">Properties Management</h2>
          <p className="text-muted-foreground">
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
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-card-foreground">Filters</h3>
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
            <label className="block text-sm font-medium text-foreground mb-1">
              Search
              {filters.search && <span className="ml-1 text-blue-600">*</span>}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search properties..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-card text-card-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring ${
                  filters.search ? 'border-primary bg-accent' : 'border-input'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Status
              {filters.status && <span className="ml-1 text-blue-600">*</span>}
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-card text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring ${
                filters.status ? 'border-primary bg-accent font-semibold' : 'border-input'
              }`}
            >
              <option value="">All Status</option>
              <option value="coming-soon">Coming Soon</option>
              <option value="active">Active</option>
              <option value="construction">Under Construction</option>
              <option value="funding">Funding</option>
              <option value="generating-income">Generating Income</option>
              <option value="on-hold">On Hold</option>
              <option value="sold-out">Sold Out</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Property Type
              {filters.property_type && <span className="ml-1 text-blue-600">*</span>}
            </label>
            <select
              value={filters.property_type}
              onChange={(e) => handleFilterChange('property_type', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-card text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring ${
                filters.property_type ? 'border-primary bg-accent font-semibold' : 'border-input'
              }`}
            >
              <option value="">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed-use">Mixed Use</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sort By</label>
            <select
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-card text-card-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="created_at">Date Created</option>
              <option value="title">Title</option>
              <option value="pricing_total_value">Total Value</option>
              <option value="pricing_expected_roi">Expected ROI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Order</label>
            <select
              value={filters.sort_order}
              onChange={(e) => handleFilterChange('sort_order', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-card text-card-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="desc">Descending ↓</option>
              <option value="asc">Ascending ↑</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">Active Filters:</span>
              
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
          <table className="w-full table-auto">
            <thead className="bg-accent">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[20%]">
                  Property
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[10%]">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[10%]">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[12%]">
                  Total Value
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[12%]">
                  Funding
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[8%]">
                  ROI
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[18%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
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
                  <tr key={mappedProperty.id} className="hover:bg-accent">
                    <td className="px-3 py-2">
                      <div className="flex items-center min-w-0">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="ml-2 min-w-0 flex-1">
                          <div className="text-xs font-medium text-card-foreground truncate">
                            <button
                              onClick={() => {
                                const propertyId = mappedProperty.id || mappedProperty.displayCode;
                                if (propertyId) {
                                  window.location.href = `/admin/property/${propertyId}`;
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left truncate max-w-full"
                            >
                              {mappedProperty.title}
                            </button>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center truncate">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{mappedProperty.location_city}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge className={`${getPropertyTypeColor(mappedProperty.property_type)} text-xs`}>
                        {mappedProperty.property_type}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge 
                        variant={statusInfo.variant}
                        className="cursor-pointer hover:opacity-80 transition-opacity text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatusModalOpen(mappedProperty);
                        }}
                        title="Click to change status"
                      >
                        {statusInfo.text}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-card-foreground">
                      {formatPrice(mappedProperty.pricing_total_value)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 bg-muted rounded-full h-1.5 mr-1.5 flex-shrink-0">
                          <div
                            className={`h-1.5 rounded-full ${isDisabled ? 'bg-green-600' : 'bg-gray-400'}`}
                            style={{ width: `${Math.max(fundingPercentage, 0.1)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs ${isDisabled ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                          {fundingPercentage < 0.01 ? fundingPercentage.toFixed(2) : Math.round(fundingPercentage)}%
                        </span>
                        {isDisabled && (
                          <span className="ml-1 text-xs text-red-500">🔒</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-card-foreground">
                      {mappedProperty.pricing_expected_roi}%
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-start space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDistributeReward(mappedProperty)}
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Distribute Reward"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProperty(mappedProperty)}
                          className="h-7 w-7 p-0"
                          title="Edit Property"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewProperty(mappedProperty)}
                          className="h-7 w-7 p-0"
                          title="View Property Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`h-7 w-7 p-0 ${isDisabled ? 'text-muted-foreground cursor-not-allowed opacity-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
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
                          <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="relative my-4 mx-auto border w-full max-w-4xl shadow-lg rounded-md bg-card max-h-[95vh] flex flex-col">
              {/* Sticky Header with Close Button */}
              <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex justify-between items-center rounded-t-md shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground">{selectedProperty.title}</h2>
                  <p className="text-muted-foreground flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedProperty.location_city || 'Unknown City'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedProperty(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 px-6 py-6">

                {/* Investment Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Investment</p>
                  <p className="text-lg font-bold text-card-foreground">{formatPrice(totalInvestment)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Buyers</p>
                  <p className="text-lg font-bold text-card-foreground">{totalBuyers}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Tokens Left</p>
                  <p className="text-lg font-bold text-card-foreground">{availableTokens.toLocaleString()}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">ROI</p>
                  <p className="text-lg font-bold text-green-600">{roi}%</p>
                </Card>
                </div>

                {/* Second Row Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Price Per Token</p>
                  <p className="text-lg font-bold text-card-foreground">{formatPrice(pricePerToken)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Tokens</p>
                  <p className="text-lg font-bold text-card-foreground">{totalTokens.toLocaleString()}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Funding Progress</p>
                  <p className="text-lg font-bold text-blue-600">{fundingProgress.toFixed(2)}%</p>
                </Card>
                </div>

                {/* Property Information */}
                <Card className="p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Property Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Property Name</label>
                    <p className="text-base text-card-foreground">{selectedProperty.title}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Type</label>
                    <p className="text-base text-card-foreground capitalize">{selectedProperty.property_type || selectedProperty.type}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Status</label>
                    <Badge variant={getStatusBadge(selectedProperty.status).variant}>
                      {getStatusBadge(selectedProperty.status).text}
                    </Badge>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Location</label>
                    <p className="text-base text-card-foreground">{selectedProperty.location_city || 'Unknown City'}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Total Value</label>
                    <p className="text-base text-card-foreground">{formatPrice(totalValue)}</p>
                </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Min Investment</label>
                    <p className="text-base text-card-foreground">{formatPrice(selectedProperty.pricing_min_investment || 0)}</p>
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
                      handleDistributeReward(selectedProperty);
                    }}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white border-green-600"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Distribute Reward
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-card">
            <div className="mt-3">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-card-foreground">Delete Property</h3>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              
              {/* Property Info */}
              <div className="bg-accent p-4 rounded-lg mb-4">
                <h4 className="font-medium text-card-foreground mb-2">{propertyToDelete.title}</h4>
                <div className="text-sm text-muted-foreground space-y-1">
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

              <p className="text-sm text-foreground mb-6">
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

      {/* Reward Distribution Modal */}
      {showRewardModal && propertyForReward && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-card">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-card-foreground">Distribute Reward</h3>
                    <p className="text-sm text-muted-foreground">Distribute ROI to all investors</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowRewardModal(false);
                    setPropertyForReward(null);
                    setRewardAmount('');
                    setRewardDistributionResult(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Property Info */}
              <Card className="p-4 mb-4">
                <h4 className="font-medium text-card-foreground mb-3">{propertyForReward.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Display Code:</span>
                    <p className="font-medium text-card-foreground">{propertyForReward.displayCode || propertyForReward.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium text-card-foreground">{propertyForReward.location_city || propertyForReward.city || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Tokens:</span>
                    <p className="font-medium text-card-foreground">
                      {propertyForReward.tokenization_total_tokens || propertyForReward.totalTokens || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Available Tokens:</span>
                    <p className="font-medium text-card-foreground">
                      {propertyForReward.tokenization_available_tokens || propertyForReward.availableTokens || 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Token Market Info */}
              {isLoadingInvestments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading investment data...</p>
                </div>
              ) : (
                <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Coins className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-card-foreground">Tokens in Market</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Total Tokens Purchased:</span>
                      <p className="text-lg font-semibold text-blue-600">
                        {totalTokensInMarket.toLocaleString(undefined, { maximumFractionDigits: 6 })} tokens
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Investors:</span>
                      <p className="text-lg font-semibold text-blue-600">
                        {investorCount} user{investorCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Rewards will be distributed proportionally based on token ownership
                  </p>
                </Card>
              )}

              {/* Reward Distribution Form */}
              {!rewardDistributionResult ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                      Total ROI Amount (USDT) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter amount in USDT (e.g., 10000)"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                      className="w-full text-lg font-semibold"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 This amount will be distributed proportionally to all investors based on their token ownership
                    </p>
                  </div>

                  {rewardAmount && parseFloat(rewardAmount) > 0 && totalTokensInMarket > 0 && (
                    <Card className="p-4 bg-green-50 border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium text-card-foreground">Distribution Preview</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total ROI:</span>
                          <span className="font-semibold text-green-600">{parseFloat(rewardAmount).toLocaleString()} USDT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Tokens in Market:</span>
                          <span className="font-semibold">{totalTokensInMarket.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ROI per Token:</span>
                          <span className="font-semibold">
                            {(parseFloat(rewardAmount) / totalTokensInMarket).toFixed(6)} USDT
                          </span>
                        </div>
                        <div className="pt-2 border-t border-green-200">
                          <p className="text-xs text-muted-foreground">
                            Each investor will receive rewards proportional to their token ownership
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="flex justify-end space-x-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRewardModal(false);
                        setPropertyForReward(null);
                        setRewardAmount('');
                        setRewardDistributionResult(null);
                      }}
                      disabled={distributeRewardMutation.isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmDistributeReward}
                      disabled={distributeRewardMutation.isLoading || !rewardAmount || parseFloat(rewardAmount) <= 0}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      {distributeRewardMutation.isLoading ? 'Sending...' : 'Send Reward'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Card className="p-4 bg-green-50 border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <h4 className="font-medium text-green-800">Reward Distribution Successful!</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-green-700 font-medium">
                        {rewardDistributionResult.message || `Successfully distributed ${rewardAmount} USDT`}
                      </p>
                      {rewardDistributionResult.count && (
                        <p className="text-muted-foreground">
                          Rewards distributed to {rewardDistributionResult.count} user(s)
                        </p>
                      )}
                      {rewardDistributionResult.totalDistributed && (
                        <p className="text-muted-foreground">
                          Total distributed: {parseFloat(rewardDistributionResult.totalDistributed).toLocaleString()} USDT
                        </p>
                      )}
                    </div>
                  </Card>

                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={() => {
                        setShowRewardModal(false);
                        setPropertyForReward(null);
                        setRewardAmount('');
                        setRewardDistributionResult(null);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal with 3x3 Grid */}
      {statusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground">Change Property Status</h2>
                  <p className="text-sm text-muted-foreground mt-1">{statusModalOpen.title}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusModalOpen(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* 3x3 Grid of Status Options */}
              <div className="grid grid-cols-3 gap-3">
                {statusOptions.map((option) => {
                  const optionStatusInfo = getStatusBadge(option.value);
                  const isSelected = statusModalOpen.status === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(statusModalOpen, option.value)}
                      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border hover:border-primary/50 hover:bg-accent'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Badge 
                          variant={optionStatusInfo.variant}
                          className="text-xs"
                        >
                          {optionStatusInfo.text}
                        </Badge>
                        {isSelected && (
                          <div className="text-primary font-semibold text-xs">Current</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cancel Button */}
              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStatusModalOpen(null)}
                >
                  Cancel
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
