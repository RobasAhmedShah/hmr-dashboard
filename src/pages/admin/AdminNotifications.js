import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, X, CheckCircle, Clock } from 'lucide-react';
import { useAdminAuth } from '../../components/admin/AdminAuth';
import { adminAPI } from '../../services/api';
import { API_BASE_URL } from '../../config/api';
import { useWebPush } from '../../hooks/useWebPush';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AdminSidebar from '../../components/admin/AdminSidebar';

const AdminNotifications = () => {
  const { adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [blocksAdminUserId, setBlocksAdminUserId] = useState(null);
  const { isSupported, isSubscribed, enableNotifications, isLoading: pushLoading } = useWebPush();

  // Get Blocks admin user ID on mount
  useEffect(() => {
    const fetchBlocksAdminId = async () => {
      try {
        const usersResponse = await adminAPI.getUsers({ limit: 1, role: 'admin' });
        const blocksAdminUser = usersResponse?.data?.users?.[0] || usersResponse?.data?.data?.users?.[0];
        if (blocksAdminUser?.id) {
          setBlocksAdminUserId(blocksAdminUser.id);
        }
      } catch (error) {
        console.error('Failed to fetch Blocks admin user ID:', error);
      }
    };
    if (adminUser) {
      fetchBlocksAdminId();
    }
  }, [adminUser]);

  // Fetch Blocks admin notifications
  const { data: notificationsData, isLoading, refetch, error } = useQuery(
    ['admin-notifications'],
    async () => {
      try {
        // Use the admin endpoint to get Blocks admin notifications
        const response = await adminAPI.getBlocksAdminNotifications();
        console.log('🔔 AdminNotifications: Raw API response:', response);
        // Backend returns: { success: true, notifications: [...] }
        // Axios wraps it in response.data, so we need to check both
        const data = response?.data || response;
        console.log('🔔 AdminNotifications: Parsed data:', data);
        console.log('🔔 AdminNotifications: Notifications array:', data?.notifications);
        return data;
      } catch (error) {
        console.error('❌ Error fetching Blocks admin notifications:', error);
        return { notifications: [] };
      }
    },
    {
      enabled: !!adminUser,
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('✅ AdminNotifications: Query success, data:', data);
        console.log('✅ AdminNotifications: Notifications count:', data?.notifications?.length || 0);
      },
      onError: (err) => {
        console.error('❌ Failed to fetch Blocks admin notifications:', err);
      },
    }
  );

  // Ensure notifications is always an array
  // Backend returns: { success: true, notifications: [...] }
  // Axios wraps it in response.data, so we get: { data: { success: true, notifications: [...] } }
  const notifications = useMemo(() => {
    console.log('🔔 AdminNotifications: Raw notificationsData:', notificationsData);
    
    // Try multiple paths to find notifications array
    let data = null;
    if (notificationsData?.notifications) {
      data = notificationsData.notifications;
    } else if (notificationsData?.data?.notifications) {
      data = notificationsData.data.notifications;
    } else if (notificationsData?.data && Array.isArray(notificationsData.data)) {
      // If data is directly an array
      data = notificationsData.data;
    } else if (Array.isArray(notificationsData)) {
      // If the whole response is an array
      data = notificationsData;
    }
    
    const notificationsArray = Array.isArray(data) ? data : [];
    console.log('🔔 AdminNotifications: Final notifications array length:', notificationsArray.length);
    console.log('🔔 AdminNotifications: Notifications:', notificationsArray);
    return notificationsArray;
  }, [notificationsData]);

  // Get Blocks admin user ID for mark as read operations
  useEffect(() => {
    const fetchBlocksAdminId = async () => {
      try {
        const usersResponse = await adminAPI.getUsers({ limit: 1, role: 'admin' });
        const blocksAdminUser = usersResponse?.data?.users?.[0] || usersResponse?.data?.data?.users?.[0];
        if (blocksAdminUser?.id) {
          setBlocksAdminUserId(blocksAdminUser.id);
        }
      } catch (error) {
        console.error('Failed to fetch Blocks admin user ID:', error);
      }
    };
    if (adminUser) {
      fetchBlocksAdminId();
    }
  }, [adminUser]);

  // Mark notification as read
  const markAsReadMutation = useMutation(
    async (notificationId) => {
      if (!blocksAdminUserId) {
        throw new Error('Blocks admin user ID not available');
      }
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/mark-read/${notificationId}/user/${blocksAdminUserId}`,
        { method: 'PATCH' }
      );
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-notifications']);
      },
    }
  );

  // Mark all as read
  const markAllAsReadMutation = useMutation(
    async () => {
      if (!blocksAdminUserId) {
        throw new Error('Blocks admin user ID not available');
      }
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/mark-all-read/user/${blocksAdminUserId}`,
        { method: 'PATCH' }
      );
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-notifications']);
      },
    }
  );

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    if (!searchQuery) return notifications;
    const query = searchQuery.toLowerCase();
    return notifications.filter(n => 
      n?.title?.toLowerCase().includes(query) || 
      n?.message?.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  const unreadCount = useMemo(() => {
    if (!Array.isArray(filteredNotifications)) return 0;
    return filteredNotifications.filter(n => !n.read || n.read === false).length;
  }, [filteredNotifications]);

  const recentNotifications = useMemo(() => {
    if (!Array.isArray(filteredNotifications)) return [];
    return filteredNotifications.filter(n => !n.read || n.read === false);
  }, [filteredNotifications]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate based on notification data
    if (notification.data?.url) {
      navigate(notification.data.url);
    } else if (notification.data?.propertyId) {
      navigate(`/admin/property/${notification.data.propertyId}`);
    }
  };

  const handleMarkAllAsRead = () => {
    if (recentNotifications.length > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar activeTab="notifications" setActiveTab={() => {}} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
                  <p className="text-muted-foreground mt-1">Blocks Admin Notifications</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin')}>
                  <X className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>

              {/* Push Notification Status */}
              {isSupported && (
                <div className={`mb-4 p-3 rounded-lg ${
                  isSubscribed 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className={`w-4 h-4 ${
                        isSubscribed ? 'text-green-600' : 'text-yellow-600'
                      }`} />
                      <span className="text-sm font-medium">
                        {isSubscribed 
                          ? 'Push notifications enabled' 
                          : 'Push notifications not enabled. Click to enable.'}
                      </span>
                    </div>
                    {!isSubscribed && (
                      <Button variant="outline" size="sm" onClick={enableNotifications} disabled={pushLoading}>
                        {pushLoading ? 'Enabling...' : 'Enable'}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Unread Notifications */}
            {recentNotifications.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Recent ({recentNotifications.length})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={markAllAsReadMutation.isLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {markAllAsReadMutation.isLoading ? 'Marking...' : 'Mark All as Read'}
                  </Button>
                </div>
                <div className="space-y-3">
                  {recentNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                        !notification.read ? 'border-l-4 border-l-primary' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Notifications */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                All Notifications ({filteredNotifications.length})
              </h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading notifications...</p>
                </div>
              ) : error ? (
              <Card className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Failed to load notifications. Please try again.</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4">
                  Retry
                </Button>
              </Card>
            ) : filteredNotifications.length === 0 ? (
                <Card className="p-8 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications found</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                        !notification.read ? 'border-l-4 border-l-primary' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;

