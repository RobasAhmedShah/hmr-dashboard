import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Search, 
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  User,
  CreditCard,
  X,
  Mail,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { adminAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';

const KYCManagement = () => {
  const { isAuthenticated } = useAdminAuth();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    sort_by: 'submittedAt',
    sort_order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedKYCs, setSelectedKYCs] = useState([]);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch all KYC verifications
  const { data: kycData, isLoading: kycLoading } = useQuery(
    ['all-kyc', filters, currentPage],
    () => adminAPI.getAllKYC({
      ...filters,
      page: currentPage,
      limit: 50
    }),
    {
      enabled: isAuthenticated,
      retry: false,
      onError: (error) => {
        console.warn('KYC API not available:', error.response?.status);
      }
    }
  );

  // Fetch users to get user details
  const { data: usersData } = useQuery(
    ['all-users'],
    () => adminAPI.getUsers({ limit: 1000 }),
    {
      enabled: isAuthenticated,
      retry: false,
    }
  );

  // Extract KYC list - each record is a single document type
  const kycList = kycData?.data?.data || 
                  kycData?.data || 
                  (Array.isArray(kycData?.data) ? kycData.data : []) ||
                  [];

  // Extract users list
  const usersList = usersData?.data?.data || 
                   usersData?.data || 
                   (Array.isArray(usersData?.data) ? usersData.data : []) ||
                   [];

  // Create user lookup map
  const userMap = useMemo(() => {
    const map = {};
    usersList.forEach(user => {
      map[user.id] = user;
    });
    return map;
  }, [usersList]);

  // Group KYC records by userId to show all documents for each user
  const groupedKYCs = useMemo(() => {
    const grouped = {};
    kycList.forEach(kyc => {
      const userId = kyc.userId;
      if (!grouped[userId]) {
        grouped[userId] = {
          userId,
          user: userMap[userId] || null,
          documents: [],
          overallStatus: 'pending'
        };
      }
      grouped[userId].documents.push(kyc);
      
      // Determine overall status
      const statuses = grouped[userId].documents.map(d => d.status);
      if (statuses.every(s => s === 'verified')) {
        grouped[userId].overallStatus = 'verified';
      } else if (statuses.some(s => s === 'rejected')) {
        grouped[userId].overallStatus = 'rejected';
      } else {
        grouped[userId].overallStatus = 'pending';
      }
    });
    return Object.values(grouped);
  }, [kycList, userMap]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = kycList.length;
    const pending = kycList.filter(k => k.status === 'pending').length;
    const verified = kycList.filter(k => k.status === 'verified').length;
    const rejected = kycList.filter(k => k.status === 'rejected').length;
    
    return { total, pending, verified, rejected };
  }, [kycList]);

  // Filter grouped KYCs
  const filteredKYCs = useMemo(() => {
    return groupedKYCs.filter(group => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const user = group.user;
        const matchesSearch = 
          user?.name?.toLowerCase().includes(searchLower) ||
          user?.email?.toLowerCase().includes(searchLower) ||
          group.userId?.toLowerCase().includes(searchLower) ||
          group.documents.some(d => d.id?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      
      if (filters.status) {
        if (filters.status === 'pending' && group.overallStatus !== 'pending') return false;
        if (filters.status === 'verified' && group.overallStatus !== 'verified') return false;
        if (filters.status === 'rejected' && group.overallStatus !== 'rejected') return false;
      }

      if (filters.type) {
        const hasType = group.documents.some(d => d.type === filters.type);
        if (!hasType) return false;
      }
      
      return true;
    });
  }, [groupedKYCs, filters]);

  // Update KYC status mutation - using actual API structure
  const updateKYCStatusMutation = useMutation(
    ({ kycId, status, rejectionReason: reason }) => {
      const updateData = {
        status,
        rejectionReason: reason || null,
        reviewer: 'admin@hmr.com' // Get from auth context if available
      };
      return adminAPI.updateKYCStatus(kycId, updateData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['all-kyc']);
        setSelectedKYC(null);
        setShowDocumentModal(false);
        setSelectedKYCs([]);
        setShowBulkActionModal(false);
      },
    }
  );

  // Bulk update mutation
  const bulkUpdateMutation = useMutation(
    ({ kycIds, status, rejectionReason: reason }) => {
      const promises = kycIds.map(kycId => 
        adminAPI.updateKYCStatus(kycId, { 
          status, 
          rejectionReason: reason || null,
          reviewer: 'admin@hmr.com'
        })
      );
      return Promise.all(promises);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['all-kyc']);
        setSelectedKYCs([]);
        setShowBulkActionModal(false);
        setBulkAction(null);
        setRejectionReason('');
      },
    }
  );

  const getStatusBadge = (status) => {
    const statusMap = {
      'verified': { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Verified' },
      'pending': { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'Pending' },
      'rejected': { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Rejected' },
    };
    
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <Badge className={statusInfo.color}>
        <statusInfo.icon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  const getTypeLabel = (type) => {
    const typeMap = {
      'cnic': 'CNIC',
      'face': 'Face/Selfie',
      'card': 'Card',
    };
    return typeMap[type] || type;
  };

  const getTypeIcon = (type) => {
    if (type === 'cnic') return FileText;
    if (type === 'face') return User;
    if (type === 'card') return CreditCard;
    return FileText;
  };

  const handleApprove = (kyc) => {
    if (window.confirm(`Approve this ${getTypeLabel(kyc.type)} verification?`)) {
      updateKYCStatusMutation.mutate({
        kycId: kyc.id,
        status: 'verified',
        rejectionReason: null
      });
    }
  };

  const handleReject = (kyc) => {
    const reason = window.prompt('Enter rejection reason:', '');
    if (reason !== null) {
      updateKYCStatusMutation.mutate({
        kycId: kyc.id,
        status: 'rejected',
        rejectionReason: reason || 'Rejected by admin'
      });
    }
  };

  const handleBulkApprove = () => {
    if (selectedKYCs.length === 0) return;
    if (window.confirm(`Approve ${selectedKYCs.length} KYC verification(s)?`)) {
      bulkUpdateMutation.mutate({
        kycIds: selectedKYCs,
        status: 'verified',
        rejectionReason: null
      });
    }
  };

  const handleBulkReject = () => {
    if (selectedKYCs.length === 0) return;
    setBulkAction('reject');
    setShowBulkActionModal(true);
  };

  const handleBulkRejectConfirm = () => {
    if (selectedKYCs.length === 0) return;
    bulkUpdateMutation.mutate({
      kycIds: selectedKYCs,
      status: 'rejected',
      rejectionReason: rejectionReason || 'Bulk rejected by admin'
    });
  };

  const toggleSelectKYC = (kycId) => {
    setSelectedKYCs(prev => 
      prev.includes(kycId) 
        ? prev.filter(id => id !== kycId)
        : [...prev, kycId]
    );
  };

  const toggleSelectAll = () => {
    const allIds = filteredKYCs.flatMap(group => group.documents.map(d => d.id));
    if (selectedKYCs.length === allIds.length) {
      setSelectedKYCs([]);
    } else {
      setSelectedKYCs(allIds);
    }
  };

  const getDocumentUrl = (kyc) => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hmr-backend.vercel.app';
    
    // Use documentFrontUrl, documentBackUrl, or selfieUrl based on type
    let url = kyc.documentFrontUrl || kyc.documentBackUrl || kyc.selfieUrl;
    
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    return `${API_BASE_URL}/${url}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (kycLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading KYC verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">KYC Management</h1>
          <p className="text-muted-foreground mt-2">Review and manage user KYC verifications</p>
        </div>
        {selectedKYCs.length > 0 && (
          <div className="flex gap-2">
            <Button onClick={handleBulkApprove} variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Selected ({selectedKYCs.length})
            </Button>
            <Button onClick={handleBulkReject} variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">
              <XCircle className="h-4 w-4 mr-2" />
              Reject Selected ({selectedKYCs.length})
            </Button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              placeholder="Search by name, email, user ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
          
          <div>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="cnic">CNIC</option>
              <option value="face">Face/Selfie</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div>
            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', status: '', type: '', sort_by: 'submittedAt', sort_order: 'desc' })}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* KYC List - Grouped by User */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedKYCs.length > 0 && selectedKYCs.length === filteredKYCs.flatMap(g => g.documents.map(d => d.id)).length}
                    onChange={toggleSelectAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Document Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reviewed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredKYCs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No KYC verifications found</p>
                  </td>
                </tr>
              ) : (
                filteredKYCs.flatMap(group => 
                  group.documents.map((kyc) => {
                    const TypeIcon = getTypeIcon(kyc.type);
                    return (
                      <tr key={kyc.id} className="hover:bg-accent/50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedKYCs.includes(kyc.id)}
                            onChange={() => toggleSelectKYC(kyc.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-card-foreground">{kyc.userId}</p>
                            {group.user?.email && (
                              <p className="text-sm text-muted-foreground">{group.user.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-card-foreground">{getTypeLabel(kyc.type)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(kyc.status)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-card-foreground">{formatDate(kyc.submittedAt || kyc.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-card-foreground">{formatDate(kyc.reviewedAt)}</p>
                          {kyc.reviewer && (
                            <p className="text-xs text-muted-foreground">{kyc.reviewer}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {getDocumentUrl(kyc) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedKYC(kyc);
                                  setShowDocumentModal(true);
                                }}
                                title="View Document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {kyc.status !== 'verified' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(kyc)}
                                className="text-green-600 hover:bg-green-50"
                                disabled={updateKYCStatusMutation.isLoading}
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {kyc.status !== 'rejected' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(kyc)}
                                className="text-red-600 hover:bg-red-50"
                                disabled={updateKYCStatusMutation.isLoading}
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Document Viewer Modal */}
      {showDocumentModal && selectedKYC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-card-foreground">KYC Document Details</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {getTypeLabel(selectedKYC.type)} - {selectedKYC.userId}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedKYC(null);
                }}
                className="text-muted-foreground hover:text-card-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-6 space-y-6">
              {/* User Information */}
              <div>
                <h3 className="text-lg font-semibold text-card-foreground mb-4">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-medium text-card-foreground">{selectedKYC.userId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Document Type</p>
                    <p className="font-medium text-card-foreground">{getTypeLabel(selectedKYC.type)}</p>
                  </div>
                  {userMap[selectedKYC.userId]?.name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium text-card-foreground">{userMap[selectedKYC.userId].name}</p>
                    </div>
                  )}
                  {userMap[selectedKYC.userId]?.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-card-foreground">{userMap[selectedKYC.userId].email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Status */}
              <div>
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Verification Status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Status</p>
                    {getStatusBadge(selectedKYC.status)}
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Submitted</p>
                    <p className="font-medium text-card-foreground">{formatDate(selectedKYC.submittedAt || selectedKYC.createdAt)}</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Reviewed</p>
                    <p className="font-medium text-card-foreground">{formatDate(selectedKYC.reviewedAt) || 'Not reviewed'}</p>
                    {selectedKYC.reviewer && (
                      <p className="text-xs text-muted-foreground mt-1">by {selectedKYC.reviewer}</p>
                    )}
                  </div>
                </div>
                {selectedKYC.rejectionReason && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm font-medium text-red-400 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-300">{selectedKYC.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Document Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Front Document */}
                  {selectedKYC.documentFrontUrl && (
                    <div className="border border-border rounded-lg p-4">
                      <p className="text-sm font-medium text-card-foreground mb-2">Front</p>
                      <img
                        src={getDocumentUrl({ ...selectedKYC, documentFrontUrl: selectedKYC.documentFrontUrl })}
                        alt="Document Front"
                        className="w-full h-48 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-80"
                        onClick={() => window.open(getDocumentUrl({ ...selectedKYC, documentFrontUrl: selectedKYC.documentFrontUrl }), '_blank')}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getDocumentUrl({ ...selectedKYC, documentFrontUrl: selectedKYC.documentFrontUrl }), '_blank')}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                    </div>
                  )}

                  {/* Back Document */}
                  {selectedKYC.documentBackUrl && (
                    <div className="border border-border rounded-lg p-4">
                      <p className="text-sm font-medium text-card-foreground mb-2">Back</p>
                      <img
                        src={getDocumentUrl({ ...selectedKYC, documentBackUrl: selectedKYC.documentBackUrl })}
                        alt="Document Back"
                        className="w-full h-48 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-80"
                        onClick={() => window.open(getDocumentUrl({ ...selectedKYC, documentBackUrl: selectedKYC.documentBackUrl }), '_blank')}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getDocumentUrl({ ...selectedKYC, documentBackUrl: selectedKYC.documentBackUrl }), '_blank')}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                    </div>
                  )}

                  {/* Selfie */}
                  {selectedKYC.selfieUrl && (
                    <div className="border border-border rounded-lg p-4">
                      <p className="text-sm font-medium text-card-foreground mb-2">Selfie</p>
                      <img
                        src={getDocumentUrl({ ...selectedKYC, selfieUrl: selectedKYC.selfieUrl })}
                        alt="Selfie"
                        className="w-full h-48 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-80"
                        onClick={() => window.open(getDocumentUrl({ ...selectedKYC, selfieUrl: selectedKYC.selfieUrl }), '_blank')}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getDocumentUrl({ ...selectedKYC, selfieUrl: selectedKYC.selfieUrl }), '_blank')}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                    </div>
                  )}

                  {!selectedKYC.documentFrontUrl && !selectedKYC.documentBackUrl && !selectedKYC.selfieUrl && (
                    <div className="col-span-3 text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p>No document images available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                {selectedKYC.status !== 'verified' && (
                  <Button
                    onClick={() => handleApprove(selectedKYC)}
                    disabled={updateKYCStatusMutation.isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                )}
                {selectedKYC.status !== 'rejected' && (
                  <Button
                    onClick={() => handleReject(selectedKYC)}
                    disabled={updateKYCStatusMutation.isLoading}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Modal */}
      {showBulkActionModal && bulkAction === 'reject' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Reject {selectedKYCs.length} KYC(s)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Rejection Reason
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-md bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleBulkRejectConfirm}
                  disabled={bulkUpdateMutation.isLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {bulkUpdateMutation.isLoading ? 'Processing...' : 'Confirm Reject'}
                </Button>
                <Button
                  onClick={() => {
                    setShowBulkActionModal(false);
                    setBulkAction(null);
                    setRejectionReason('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default KYCManagement;
