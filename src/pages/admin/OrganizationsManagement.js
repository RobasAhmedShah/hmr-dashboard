import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Building2, 
  Plus, 
  Key, 
  Edit, 
  Trash2,
  Mail,
  Calendar,
  Users,
  Home,
  Search
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { orgAdminAPI, organizationsAPI } from '../../services/api';
import CreateOrganizationModal from '../../components/admin/CreateOrganizationModal';
import CredentialsModal from '../../components/admin/CredentialsModal';
import ResetPasswordModal from '../../components/admin/ResetPasswordModal';
import EditOrganizationModal from '../../components/admin/EditOrganizationModal';

const OrganizationsManagement = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all organizations (combine new admin API + existing organizations API)
  const { data: orgsData, isLoading } = useQuery(
    'admin-organizations',
    async () => {
      console.log('🏢 Fetching all organizations for admin...');
      
      let adminOrgs = [];
      let existingOrgs = [];
      
      // Try to fetch from new admin API (with admin details)
      try {
        const adminResponse = await orgAdminAPI.getAllOrganizations();
        console.log('✅ Admin organizations API response:', adminResponse);
        adminOrgs = adminResponse?.data?.organizations || adminResponse?.data || [];
      } catch (error) {
        console.warn('⚠️ Admin organizations API not available:', error.message);
      }
      
      // Also fetch from existing organizations API (for orgs without admins)
      try {
        const existingResponse = await organizationsAPI.getAll();
        console.log('✅ Existing organizations API response:', existingResponse);
        existingOrgs = existingResponse?.data?.organizations || existingResponse?.data || [];
      } catch (error) {
        console.warn('⚠️ Existing organizations API error:', error.message);
      }
      
      // Merge results - prioritize admin API data, add missing orgs from existing API
      const adminOrgIds = new Set(adminOrgs.map(org => org.id || org._id));
      const missingOrgs = existingOrgs.filter(org => !adminOrgIds.has(org.id || org._id));
      
      const allOrgs = [...adminOrgs, ...missingOrgs];
      console.log('📊 Combined organizations:', {
        fromAdminAPI: adminOrgs.length,
        fromExistingAPI: existingOrgs.length,
        missing: missingOrgs.length,
        total: allOrgs.length
      });
      
      return { data: { organizations: allOrgs } };
    },
    { refetchOnWindowFocus: false }
  );

  const organizations = orgsData?.data?.organizations || [];

  // Filter organizations by search query
  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return organizations;
    
    const query = searchQuery.toLowerCase().trim();
    return organizations.filter(org => 
      org.name?.toLowerCase().includes(query) ||
      org.description?.toLowerCase().includes(query) ||
      org.displayCode?.toLowerCase().includes(query)
    );
  }, [organizations, searchQuery]);

  // Delete mutation
  const deleteMutation = useMutation(
    (orgId) => orgAdminAPI.deleteOrganization(orgId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-organizations');
        alert('Organization deleted successfully');
      },
      onError: (error) => {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleDelete = (org) => {
    if (window.confirm(`Are you sure you want to delete ${org.name}? This will also delete the organization admin.`)) {
      deleteMutation.mutate(org.id);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Organizations Management</h2>
          <p className="text-muted-foreground">
            Manage organizations and their admin credentials
            <span className="ml-2 text-blue-600 font-medium">
              ({filteredOrganizations.length} of {organizations.length} {organizations.length === 1 ? 'organization' : 'organizations'})
            </span>
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Organization
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search organizations by name, description, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
        />
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrganizations.map((org) => (
          <Card key={org.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">{org.name}</h3>
                  <p className="text-sm text-muted-foreground">{org.displayCode}</p>
                </div>
              </div>
              <Badge variant={org.isActive ? 'green' : 'red'}>
                {org.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {org.description && (
              <p className="text-sm text-muted-foreground mb-4">{org.description}</p>
            )}

            {org.website && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Home className="w-4 h-4 text-muted-foreground" />
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {org.website}
                </a>
              </div>
            )}

            {/* Admin Info */}
            {org.admin ? (
              <div className="bg-accent rounded-lg p-4 mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Organization Admin</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-card-foreground">{org.admin.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{org.admin.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last login: {formatDate(org.admin.lastLogin)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  💡 Admin credentials: Use <strong>admin@{org.name?.toLowerCase().replace(/\s+/g, '')}.com</strong> at <code className="bg-blue-100 px-1 rounded">/org/login</code>
                </p>
              </div>
            )}

            {/* Stats */}
            {org.stats && (
              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
                <div className="text-center">
                  <p className="text-2xl font-bold text-card-foreground">{org.stats.totalProperties || 0}</p>
                  <p className="text-xs text-muted-foreground">Properties</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-card-foreground">{org.stats.totalInvestments || 0}</p>
                  <p className="text-xs text-muted-foreground">Investments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-card-foreground">{org.stats.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedOrg(org);
                  setShowEditModal(true);
                }}
                className="flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedOrg(org);
                  setShowResetPasswordModal(true);
                }}
                className="flex items-center gap-1"
              >
                <Key className="w-4 h-4" />
                Reset Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(org)}
                className="flex items-center gap-1 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrganizations.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          {searchQuery ? (
            <>
              <h3 className="text-lg font-medium text-card-foreground mb-2">No organizations found</h3>
              <p className="text-muted-foreground mb-6">
                No organizations match your search "{searchQuery}"
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-card-foreground mb-2">No organizations yet</h3>
              <p className="text-muted-foreground mb-6">Create your first organization to get started</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Organization
              </Button>
            </>
          )}
        </Card>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(credentials) => {
            setCreatedCredentials(credentials);
            queryClient.invalidateQueries('admin-organizations');
          }}
        />
      )}

      {showEditModal && selectedOrg && (
        <EditOrganizationModal
          org={selectedOrg}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrg(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries('admin-organizations');
          }}
        />
      )}

      {showResetPasswordModal && selectedOrg && (
        <ResetPasswordModal
          org={selectedOrg}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedOrg(null);
          }}
        />
      )}

      {createdCredentials && (
        <CredentialsModal
          credentials={createdCredentials}
          onClose={() => setCreatedCredentials(null)}
        />
      )}
    </div>
  );
};

export default OrganizationsManagement;
