import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { X, Building2, Globe, Image, FileText } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Organization</h2>
              <p className="text-sm text-gray-500">{org.displayCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              label="Organization Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., HMR Builders"
              className="pl-10"
              required
            />
          </div>

          <div className="relative">
            <FileText className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Brief description of the organization..."
            />
          </div>

          <div className="relative">
            <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              label="Website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
              type="url"
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Image className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              label="Logo URL"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              type="url"
              className="pl-10"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Updating...' : 'Update Organization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrganizationModal;

