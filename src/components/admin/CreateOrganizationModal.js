import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { X, Building2, Globe, Image, FileText, Mail, User, Key } from 'lucide-react';
import Button from '../ui/Button';
import { orgAdminAPI } from '../../services/api';

const CreateOrganizationModal = ({ onClose, onSuccess }) => {
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    logoUrl: '',
    adminEmail: '',
    adminPassword: '',
    adminFullName: ''
  });

  const createMutation = useMutation(
    (data) => orgAdminAPI.createOrganization(data),
    {
      onSuccess: (response) => {
        console.log('✅ Organization created:', response);
        const credentials = {
          email: response.data?.admin?.email || formData.adminEmail,
          password: response.data?.admin?.tempPassword || formData.adminPassword,
          fullName: response.data?.admin?.fullName || formData.adminFullName,
          organizationName: response.data?.organization?.name || formData.name,
          organizationId: response.data?.organization?.displayCode || response.data?.organization?.id
        };
        onSuccess(credentials);
        onClose();
      },
      onError: (error) => {
        console.error('❌ Create organization error:', error);
        const errorMessage = error.response?.data?.message || error.message;
        alert(`Error creating organization: ${errorMessage}`);
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      website: formData.website.trim(),
      logoUrl: formData.logoUrl.trim()
    };

    // If not auto-generating, include manual credentials (backend auto-generates if not provided)
    if (!autoGenerate) {
      payload.adminEmail = formData.adminEmail.trim();
      payload.adminPassword = formData.adminPassword;
      payload.adminFullName = formData.adminFullName.trim();
    }

    console.log('🚀 Creating organization with payload:', payload);
    createMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] my-auto flex flex-col">
        <div className="bg-card border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-card-foreground">Create New Organization</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form id="create-org-form" onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Organization Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-card-foreground uppercase">Organization Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Organization Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., HMR Builders"
                  className="w-full pl-10 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <FileText className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-10 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Brief description of the organization..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  type="url"
                  className="w-full pl-10 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Logo URL</label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  type="url"
                  className="w-full pl-10 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Admin Credentials Section */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-card-foreground uppercase">Admin Credentials</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGenerate}
                  onChange={(e) => setAutoGenerate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-input rounded focus:ring-blue-500"
                />
                <span className="text-sm text-foreground">Auto-generate credentials</span>
              </label>
            </div>

            {autoGenerate ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ✨ A random email and secure password will be automatically generated for the organization admin.
                  You'll see the credentials after creation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      placeholder="admin@organization.com"
                      type="email"
                      className="w-full pl-10 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={!autoGenerate}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Admin Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      value={formData.adminFullName}
                      onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                      placeholder="John Doe"
                      className="w-full pl-10 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={!autoGenerate}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Admin Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      placeholder="Secure password (min 8 characters)"
                      type="password"
                      className="w-full pl-10 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={!autoGenerate}
                      minLength={8}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </form>

        {/* Actions - Sticky Footer */}
        <div className="flex gap-3 justify-end p-6 border-t bg-card rounded-b-lg flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-org-form" disabled={createMutation.isLoading}>
            {createMutation.isLoading ? 'Creating...' : 'Create Organization'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganizationModal;

