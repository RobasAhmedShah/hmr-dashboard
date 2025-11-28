import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Bell, 
  Send, 
  Users, 
  Building2, 
  Wallet, 
  TrendingUp, 
  MessageSquare,
  X,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { adminAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';
import toast from 'react-hot-toast';

const NotificationsManagement = () => {
  const { isAuthenticated } = useAdminAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    userIds: [],
    title: '',
    message: '',
    category: 'notifications',
    propertyId: '',
    customUrl: '',
  });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Fetch all users
  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['admin-users-for-notifications'],
    () => adminAPI.getUsers({ limit: 1000 }),
    {
      enabled: isAuthenticated,
      retry: 1,
    }
  );

  // Fetch all properties (for property-detail category)
  const { data: propertiesData } = useQuery(
    ['admin-properties-for-notifications'],
    () => adminAPI.getProperties({ limit: 1000 }),
    {
      enabled: isAuthenticated && formData.category === 'property-detail',
      retry: 1,
    }
  );

  const users = usersData?.data?.users || usersData?.data?.data?.users || usersData?.data || [];
  const properties = propertiesData?.data?.properties || propertiesData?.data?.data?.properties || propertiesData?.data || [];

  // Filter users based on search query
  const filteredUsers = React.useMemo(() => {
    if (!userSearchQuery.trim()) {
      return users;
    }
    const query = userSearchQuery.toLowerCase().trim();
    return users.filter(user => {
      const name = (user.fullName || user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [users, userSearchQuery]);

  // Send notification mutation
  const sendNotificationMutation = useMutation(
    (data) => adminAPI.sendNotification(data),
    {
      onSuccess: (response) => {
        const result = response?.data || response;
        if (result.success) {
          toast.success(`Notification sent successfully! Sent: ${result.sent}, Failed: ${result.failed}`);
          // Reset form
          setFormData({
            userIds: [],
            title: '',
            message: '',
            category: 'notifications',
            propertyId: '',
            customUrl: '',
          });
          setSelectedUsers([]);
        } else {
          toast.error(`Some notifications failed. Sent: ${result.sent}, Failed: ${result.failed}`);
          if (result.errors && result.errors.length > 0) {
            console.error('Notification errors:', result.errors);
          }
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send notification');
        console.error('Send notification error:', error);
      },
    }
  );

  const handleUserToggle = (user) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
      setFormData({
        ...formData,
        userIds: formData.userIds.filter(id => id !== user.id),
      });
    } else {
      setSelectedUsers([...selectedUsers, user]);
      setFormData({
        ...formData,
        userIds: [...formData.userIds, user.id],
      });
    }
  };

  const handleSelectAll = () => {
    // Use filteredUsers for select all
    const usersToSelect = filteredUsers.length > 0 ? filteredUsers : users;
    const allFilteredSelected = usersToSelect.every(user => 
      selectedUsers.some(selected => selected.id === user.id)
    );

    if (allFilteredSelected && usersToSelect.length > 0) {
      // Deselect all filtered users
      const remainingSelected = selectedUsers.filter(selected => 
        !usersToSelect.some(user => user.id === selected.id)
      );
      setSelectedUsers(remainingSelected);
      setFormData({ ...formData, userIds: remainingSelected.map(u => u.id) });
    } else {
      // Select all filtered users (merge with existing)
      const newSelected = [...selectedUsers];
      usersToSelect.forEach(user => {
        if (!newSelected.some(selected => selected.id === user.id)) {
          newSelected.push(user);
        }
      });
      setSelectedUsers(newSelected);
      setFormData({ ...formData, userIds: newSelected.map(u => u.id) });
    }
  };

  const handleCategoryChange = (category) => {
    setFormData({
      ...formData,
      category,
      propertyId: category !== 'property-detail' ? '' : formData.propertyId,
      customUrl: category !== 'custom' ? '' : formData.customUrl,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.userIds || formData.userIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (formData.category === 'property-detail' && !formData.propertyId) {
      toast.error('Please select a property');
      return;
    }

    if (formData.category === 'custom' && !formData.customUrl) {
      toast.error('Please enter a custom URL');
      return;
    }

    // Ensure userIds is an array
    const userIdsArray = Array.isArray(formData.userIds) 
      ? formData.userIds 
      : (formData.userIds ? [formData.userIds] : []);

    if (userIdsArray.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    const payload = {
      userIds: userIdsArray,
      title: formData.title.trim(),
      message: formData.message.trim(),
      category: formData.category,
      ...(formData.category === 'property-detail' && { propertyId: formData.propertyId }),
      ...(formData.category === 'custom' && { customUrl: formData.customUrl }),
    };

    console.log('Sending notification payload:', payload);
    sendNotificationMutation.mutate(payload);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'properties':
        return Building2;
      case 'property-detail':
        return Building2;
      case 'portfolio':
        return TrendingUp;
      case 'wallet':
        return Wallet;
      case 'notifications':
        return Bell;
      case 'custom':
        return MessageSquare;
      default:
        return Bell;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'properties':
        return 'Properties List';
      case 'property-detail':
        return 'Property Detail';
      case 'portfolio':
        return 'Portfolio';
      case 'wallet':
        return 'Wallet';
      case 'notifications':
        return 'Notifications';
      case 'custom':
        return 'Custom URL';
      default:
        return category;
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
        <p className="text-gray-600">Please log in to access this page.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Send Notifications</h1>
          <p className="text-gray-600 mt-1">Send custom notifications to users</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Users <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUserSelector(!showUserSelector)}
                className="w-full justify-between"
              >
                <span>
                  {selectedUsers.length === 0
                    ? 'Select users...'
                    : `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected`}
                </span>
                <Users className="w-4 h-4" />
              </Button>

              {showUserSelector && (
                <Card className="absolute z-10 w-full mt-2 max-h-96 overflow-y-auto">
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b">
                      <span className="text-sm font-medium">Select Users</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {filteredUsers.every(user => selectedUsers.some(u => u.id === user.id)) && filteredUsers.length > 0 ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    
                    {/* Search Input */}
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {userSearchQuery && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserSearchQuery('');
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {userSearchQuery && (
                        <p className="text-xs text-gray-500 mt-1">
                          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                        </p>
                      )}
                    </div>

                    {usersLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {userSearchQuery ? 'No users found matching your search' : 'No users found'}
                      </p>
                    ) : (
                      filteredUsers.map((user) => {
                        const isSelected = selectedUsers.some(u => u.id === user.id);
                        return (
                          <div
                            key={user.id}
                            onClick={() => handleUserToggle(user)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                              isSelected ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                            }`}>
                              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{user.fullName || user.name || user.email}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              )}
            </div>
            {selectedUsers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="default"
                    className="flex items-center gap-1"
                  >
                    {user.fullName || user.name || user.email}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => handleUserToggle(user)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter notification title"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter notification message"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category (Redirect Route) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['properties', 'property-detail', 'portfolio', 'wallet', 'notifications', 'custom'].map((category) => {
                const Icon = getCategoryIcon(category);
                const isSelected = formData.category === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryChange(category)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                      {getCategoryLabel(category)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Property Selector (if property-detail category) */}
          {formData.category === 'property-detail' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Property <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a property...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id || property.displayCode}>
                    {property.title || property.name || property.displayCode}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom URL (if custom category) */}
          {formData.category === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom URL <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.customUrl}
                onChange={(e) => setFormData({ ...formData, customUrl: e.target.value })}
                placeholder="/custom-route or /properties/123"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter a route path (e.g., /properties, /portfolio, /wallet)</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  userIds: [],
                  title: '',
                  message: '',
                  category: 'notifications',
                  propertyId: '',
                  customUrl: '',
                });
                setSelectedUsers([]);
              }}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={sendNotificationMutation.isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              {sendNotificationMutation.isLoading ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NotificationsManagement;

