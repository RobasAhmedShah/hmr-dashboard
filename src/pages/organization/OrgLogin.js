import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, LogIn } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useOrganizationAuth } from '../../components/organization/OrganizationAuth';

const OrgLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useOrganizationAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/orgdashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userData = await login(formData.email, formData.password);
      console.log('Organization login successful:', userData);
      navigate('/orgdashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const fillHMRCredentials = () => {
    setFormData({
      email: 'admin@hmr.com',
      password: 'hmr123'
    });
  };

  const fillSaimaCredentials = () => {
    setFormData({
      email: 'admin@saima.com',
      password: 'saima123'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Organization Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your organization
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <Badge variant="blue" className="text-xs">HMR Company</Badge>
            <Badge variant="purple" className="text-xs">Saima Company</Badge>
          </div>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@organization.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full flex items-center justify-center space-x-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Quick Login:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={fillHMRCredentials}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  🏢 HMR
                </button>
                <button
                  type="button"
                  onClick={fillSaimaCredentials}
                  className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                >
                  🏢 Saima
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Demo Credentials:</h3>
            <div className="space-y-2">
              <div className="bg-white p-2 rounded border border-blue-200">
                <p className="text-xs font-medium text-blue-700">HMR Company:</p>
                <p className="text-xs text-gray-600">
                  <strong>Email:</strong> admin@hmr.com<br />
                  <strong>Password:</strong> hmr123
                </p>
              </div>
              <div className="bg-white p-2 rounded border border-purple-200">
                <p className="text-xs font-medium text-purple-700">Saima Company:</p>
                <p className="text-xs text-gray-600">
                  <strong>Email:</strong> admin@saima.com<br />
                  <strong>Password:</strong> saima123
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 Secure organization portal for property management
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrgLogin;

