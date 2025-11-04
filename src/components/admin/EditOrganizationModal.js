import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { X, Building2, Globe, Image, FileText } from 'lucide-react';
import Button from '../ui/Button';
import { orgAdminAPI } from '../../services/api';

const EditOrganizationModal = ({ org, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: org.name || '',
    description: org.description || '',
    website: org.website || '',
    logoUrl: org.logoUrl || ''
  });

  const updateMutation = useMutation(
    (data) => orgAdminAPI.updateOrganization(org.id, data),
    {
      onSuccess: () => {
        console.log('✅ Organization updated successfully');
        onSuccess();
        onClose();
        alert('Organization updated successfully!');
      },
      onError: (error) => {
        console.error('❌ Update organization error:', error);
        alert(`Error: ${error.response?.data?.message || error.message}`);
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

    console.log('🔄 Updating organization:', org.displayCode, payload);
    updateMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] my-auto flex flex-col">
        <div className="sticky top-0 z-10 bg-card border-b px-6 py-4 flex items-center justify-between flex-shrink-0 rounded-t-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-card-foreground">Edit Organization</h2>
              <p className="text-sm text-gray-500">{org.displayCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form id="edit-org-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Organization Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Blocks"
                className="w-full pl-10 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-5 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-10 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Brief description of the organization..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                className="w-full pl-10 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Logo URL</label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full pl-10 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </form>

        {/* Actions - Sticky Footer */}
        <div className="flex gap-3 justify-end p-6 border-t bg-card rounded-b-lg flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-org-form" disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? 'Updating...' : 'Update Organization'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditOrganizationModal;

