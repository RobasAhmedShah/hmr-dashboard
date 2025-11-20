import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { User, Mail, Key, Building2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { useOrganizationAuth } from '../../components/organization/OrganizationAuth';
import { orgAdminAPI } from '../../services/api';

const OrgProfile = () => {
  const { adminEmail, adminFullName, adminId, organizationName, displayCode } = useOrganizationAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const changePasswordMutation = useMutation(
    async (data) => {
      try {
        // Try the organization-specific endpoint first
        return await orgAdminAPI.changeOrgAdminPassword(adminId, {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        });
      } catch (error) {
        // If endpoint doesn't exist (404), try alternative endpoint or show helpful error
        if (error.response?.status === 404) {
          throw new Error('Password change endpoint not available. Please contact support.');
        }
        throw error;
      }
    },
    {
      onSuccess: () => {
        alert('✅ Password changed successfully! Please log in again with your new password.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowChangePassword(false);
      },
      onError: (error) => {
        console.error('❌ Change password error:', error);
        console.error('❌ Error response:', error.response);
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Failed to change password. Please try again.';
        alert(`Error: ${errorMessage}`);
      }
    }
  );

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    
    // Validate current password is provided
    if (!passwordData.currentPassword.trim()) {
      alert('Please enter your current password');
      return;
    }

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(passwordData.newPassword);
    if (passwordError) {
      alert(passwordError);
      return;
    }

    if (!adminId) {
      alert('Admin ID not found. Please log out and log in again.');
      return;
    }

    console.log('🔄 Changing password for admin:', adminId);
    changePasswordMutation.mutate(passwordData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground">Profile Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and credentials</p>
      </div>

      {/* Organization Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Organization</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Organization Name</p>
              <p className="text-base font-medium text-card-foreground">{organizationName}</p>
            </div>
          </div>

          {displayCode && (
            <div className="flex items-start gap-3">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Organization ID</p>
                <Badge variant="blue" className="mt-1">{displayCode}</Badge>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Profile Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-base font-medium text-card-foreground">{adminEmail}</p>
            </div>
          </div>

          {adminFullName && (
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <User className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="text-base font-medium text-card-foreground">{adminFullName}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Password</h3>
            <p className="text-sm text-muted-foreground mt-1">Update your password to keep your account secure</p>
          </div>
          {!showChangePassword && (
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(true)}
              className="flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Change Password
            </Button>
          )}
        </div>

        {showChangePassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4 mt-6">
            <Input
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
              placeholder="Enter your current password"
            />

            <div>
              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={8}
                placeholder="Enter new password (min 8 characters)"
              />
              {passwordData.newPassword && validatePassword(passwordData.newPassword) && (
                <p className="text-sm text-red-600 mt-1">{validatePassword(passwordData.newPassword)}</p>
              )}
              {passwordData.newPassword && !validatePassword(passwordData.newPassword) && (
                <p className="text-sm text-green-600 mt-1">✓ Password meets requirements</p>
              )}
            </div>

            <div>
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                minLength={8}
                placeholder="Re-enter new password"
              />
              {passwordData.newPassword && passwordData.confirmPassword && 
               passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Passwords do not match!</p>
              )}
              {passwordData.newPassword && passwordData.confirmPassword && 
               passwordData.newPassword === passwordData.confirmPassword && 
               !validatePassword(passwordData.newPassword) && (
                <p className="text-sm text-green-600 mt-1">✓ Passwords match</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={changePasswordMutation.isLoading || passwordData.newPassword !== passwordData.confirmPassword}
              >
                {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-background rounded-lg p-4 mt-6">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrgProfile;

