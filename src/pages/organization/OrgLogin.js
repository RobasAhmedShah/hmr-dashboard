import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, LogIn } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ThemeToggle from '../../components/ThemeToggle';
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
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src="/logo1.png" alt="Logo" className="mx-auto h-16 w-16 rounded-lg shadow-lg" />
          <h2 className="mt-6 text-3xl font-extrabold text-card-foreground">
            Organization Portal
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
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
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="admin@organization.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
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
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-muted-foreground"
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

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Quick Login:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={fillHMRCredentials}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                >
                  🏢 HMR
                </button>
                <button
                  type="button"
                  onClick={fillSaimaCredentials}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                >
                  🏢 Saima
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 p-4 bg-accent rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Demo Credentials:</h3>
            <div className="space-y-2">
              <div className="bg-card p-2 rounded border border-border">
                <p className="text-xs font-medium text-primary">HMR Company:</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Email:</strong> admin@hmr.com<br />
                  <strong>Password:</strong> hmr123
                </p>
              </div>
              <div className="bg-card p-2 rounded border border-border">
                <p className="text-xs font-medium text-primary">Saima Company:</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Email:</strong> admin@saima.com<br />
                  <strong>Password:</strong> saima123
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            🔒 Secure organization portal for property management
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrgLogin;

