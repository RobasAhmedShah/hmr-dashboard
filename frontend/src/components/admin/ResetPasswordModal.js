import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { X, Key, Mail, AlertTriangle, CheckCircle, Copy, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { orgAdminAPI } from '../../services/api';

const ResetPasswordModal = ({ org, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetMutation = useMutation(
    (data) => orgAdminAPI.resetOrgPassword(org.id, data),
    {
      onSuccess: (response) => {
        console.log('✅ Password reset successful:', response);
        const tempPassword = response.data?.tempPassword || newPassword;
        setGeneratedPassword(tempPassword);
        setResetSuccess(true);
      },
      onError: (error) => {
        console.error('❌ Reset password error:', error);
        alert(`Error: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = newPassword.trim() 
      ? { newPassword: newPassword.trim() }
      : { autoGenerate: true };
    
    console.log('🔄 Resetting password for org:', org.displayCode, payload);
    resetMutation.mutate(payload);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (resetSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-lg w-full">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-3 text-white">
              <CheckCircle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Password Reset Successful!</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-green-700 rounded-lg transition text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Important Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Share this password securely!</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Make sure to securely communicate this temporary password to the organization admin.
                </p>
              </div>
            </div>

            {/* Organization Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Organization: {org.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Admin Email:</span>
                  <span className="font-medium text-gray-900">{org.admin?.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* New Password */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-400" />
                  <label className="text-xs font-medium text-gray-500 uppercase">New Temporary Password</label>
                </div>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      Show
                    </>
                  )}
                </button>
              </div>
              <div className="flex gap-2">
                <p className="flex-1 text-base font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                  {showPassword ? generatedPassword : '••••••••••••'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="px-6 py-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Key className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Reset Admin Password</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Organization Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Organization: {org.name}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Current Admin Email:</span>
                <span className="font-medium text-gray-900">{org.admin?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">This will reset the admin's password</p>
              <p className="text-sm text-yellow-800 mt-1">
                The admin will need to use the new temporary password to log in.
              </p>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <Input
              label="New Password (leave empty to auto-generate)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password or leave blank"
            />
            <p className="text-xs text-gray-500 mt-1">
              {newPassword.trim() 
                ? 'A custom password will be set' 
                : 'A secure random password will be generated'
              }
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={resetMutation.isLoading}>
              {resetMutation.isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordModal;

