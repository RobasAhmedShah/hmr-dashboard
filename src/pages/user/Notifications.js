import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Bell, Search, X, Check, Trash2, Clock, DollarSign, TrendingUp, Wallet, Building2, Settings, CheckCircle } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { usersAPI } from '../../services/api';
import { useWebPush } from '../../hooks/useWebPush';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Notifications = () => {
  const { currentUser } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const context = searchParams.get('context') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('recent');
  const { isSupported, isSubscribed, permission, enableNotifications, isLoading: pushLoading } = useWebPush();

  // Fetch notifications
  const { data: notificationsData, isLoading, refetch } = useQuery(
    ['notifications', currentUser?.id],
    () => usersAPI.getNotifications(currentUser?.id),
    {
      enabled: !!currentUser?.id,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const notifications = notificationsData?.data?.notifications || 
                        notificationsData?.data || 
                        notificationsData?.notifications || 
                        [];

  // Filter notifications by context
  const contextNotifications = useMemo(() => {
    if (context === 'portfolio') {
      return notifications.filter(n => 
        n.data?.type === 'reward' || 
        n.data?.type === 'investment' ||
        n.title?.toLowerCase().includes('roi') ||
        n.title?.toLowerCase().includes('reward') ||
        n.title?.toLowerCase().includes('dividend')
      );
    } else if (context === 'wallet') {
      return notifications.filter(n => 
        n.data?.type === 'deposit' || 
        n.data?.type === 'withdrawal' ||
        n.title?.toLowerCase().includes('deposit') ||
        n.title?.toLowerCase().includes('withdrawal') ||
        n.title?.toLowerCase().includes('wallet')
      );
    }
    return notifications;
  }, [notifications, context]);

  // Process notifications
  const processedNotifications = useMemo(() => {
    let filtered = contextNotifications;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by date (newest first)
    const sorted = [...filtered].sort((a, b) => 
      new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
    );

    return {
      recent: sorted.filter(n => !n.read || n.read === false), // Unread notifications
      all: sorted, // All notifications
    };
  }, [contextNotifications, searchQuery]);

  const displayedNotifications = activeTab === 'recent' 
    ? processedNotifications.recent 
    : processedNotifications.all;

  const unreadCount = contextNotifications.filter(n => !n.read || n.read === false).length;

  // Mark notification as read mutation
  const markAsReadMutation = useMutation(
    (notificationId) => usersAPI.markNotificationAsRead(notificationId, currentUser?.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications', currentUser?.id]);
      },
    }
  );

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation(
    () => usersAPI.markAllNotificationsAsRead(currentUser?.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications', currentUser?.id]);
      },
    }
  );

  const handleMarkAsRead = (notificationId, e) => {
    e.stopPropagation();
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to property if propertyId is in data
    const propertyId = notification.data?.propertyId || notification.data?.property?.id;
    const propertyDisplayCode = notification.data?.propertyDisplayCode || notification.data?.property?.displayCode;
    
    if (propertyId || propertyDisplayCode) {
      navigate(`/properties/${propertyId || propertyDisplayCode}`);
    } else if (notification.data?.url) {
      navigate(notification.data.url);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reward':
      case 'roi':
        return DollarSign;
      case 'investment':
        return TrendingUp;
      case 'deposit':
      case 'withdrawal':
        return Wallet;
      case 'property':
        return Building2;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'reward':
      case 'roi':
        return 'text-green-600';
      case 'investment':
        return 'text-blue-600';
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now';
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString();
  };

  const formatFullDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-1">
                  {context === 'portfolio' && 'Portfolio Notifications'}
                  {context === 'wallet' && 'Wallet Notifications'}
                  {context === 'all' && 'All Notifications'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isSupported && !isSubscribed && permission !== 'denied' && (
                  <Button 
                    variant="outline" 
                    onClick={enableNotifications}
                    disabled={pushLoading}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {pushLoading ? 'Enabling...' : 'Enable Push Notifications'}
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate(-1)}>
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
            
            {/* Push Notification Status */}
            {isSupported && (
              <div className={`mb-4 p-3 rounded-lg ${
                isSubscribed 
                  ? 'bg-green-50 border border-green-200' 
                  : permission === 'denied'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${
                      isSubscribed ? 'text-green-600' : 'text-yellow-600'
                    }`} />
                    <span className="text-sm font-medium">
                      {isSubscribed 
                        ? 'Push notifications enabled' 
                        : permission === 'denied'
                        ? 'Push notifications blocked. Please enable in browser settings.'
                        : 'Push notifications not enabled. Click "Enable Push Notifications" to receive real-time updates.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-gray-200 mb-6">
            <div className="flex">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'recent'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('recent')}
              >
                Recent ({processedNotifications.recent.length})
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('all')}
              >
                All ({processedNotifications.all.length})
              </button>
            </div>
            {activeTab === 'recent' && processedNotifications.recent.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {markAllAsReadMutation.isLoading ? 'Marking...' : 'Mark All as Read'}
              </Button>
            )}
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeTab === 'recent' ? 'No recent notifications' : 'No notifications found'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'recent'
                  ? 'You have no unread notifications'
                  : searchQuery
                  ? 'No notifications match your search'
                  : 'No notifications yet'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {displayedNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.data?.type || 'default');
                const isRead = notification.read || notification.read === true;
                const type = notification.data?.type || 'default';

                return (
                  <Card
                    key={notification.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${isRead ? 'bg-gray-100' : 'bg-blue-100'}`}>
                        <Icon className={`w-5 h-5 ${getNotificationColor(type)}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className={`font-semibold ${isRead ? 'text-gray-900' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          {!isRead && (
                            <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt || notification.created_at)}
                          </p>
                          <div className="flex items-center gap-2">
                            {!isRead && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                disabled={markAsReadMutation.isLoading}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Mark as Read
                              </Button>
                            )}
                            {(notification.data?.propertyId || notification.data?.propertyDisplayCode) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const propertyId = notification.data?.propertyId || notification.data?.propertyDisplayCode;
                                  navigate(`/properties/${propertyId}`);
                                }}
                              >
                                View Property
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;

