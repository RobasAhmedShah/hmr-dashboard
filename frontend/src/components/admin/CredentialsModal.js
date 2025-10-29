import React, { useState } from 'react';
import { X, Mail, Key, User, Building2, Copy, CheckCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const CredentialsModal = ({ credentials, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopyCredentials = () => {
    const text = `
Organization: ${credentials.organizationName}
Organization ID: ${credentials.organizationId}
Login URL: ${window.location.origin}/org/login

Admin Email: ${credentials.email}
Temporary Password: ${credentials.password}
Full Name: ${credentials.fullName}

⚠️ IMPORTANT: Save these credentials securely. The password will not be shown again.
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] my-auto flex flex-col">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-3 text-white">
            <CheckCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Organization Created Successfully!</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-green-700 rounded-lg transition text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Important Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Important: Save these credentials now!</p>
              <p className="text-sm text-yellow-800 mt-1">
                The temporary password will not be shown again. Make sure to copy and securely store these credentials.
              </p>
            </div>
          </div>

          {/* Organization Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Organization Details</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{credentials.organizationName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Organization ID:</span>
                <Badge variant="blue">{credentials.organizationId}</Badge>
              </div>
            </div>
          </div>

          {/* Admin Credentials */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Admin Login Credentials
            </h3>

            <div className="space-y-3">
              {/* Email */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                </div>
                <p className="text-base font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                  {credentials.email}
                </p>
              </div>

              {/* Password */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-gray-400" />
                    <label className="text-xs font-medium text-gray-500 uppercase">Temporary Password</label>
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
                <p className="text-base font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                  {showPassword ? credentials.password : '••••••••••••'}
                </p>
              </div>

              {/* Full Name */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <label className="text-xs font-medium text-gray-500 uppercase">Full Name</label>
                </div>
                <p className="text-base font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                  {credentials.fullName}
                </p>
              </div>
            </div>
          </div>

          {/* Login URL */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Login URL:</strong>{' '}
              <a 
                href="/org/login" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-900"
              >
                {window.location.origin}/org/login
              </a>
            </p>
          </div>

        </div>

        {/* Actions - Sticky Footer */}
        <div className="flex gap-3 justify-end p-6 border-t bg-white rounded-b-lg flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCopyCredentials}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy All Credentials
              </>
            )}
          </Button>
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CredentialsModal;

