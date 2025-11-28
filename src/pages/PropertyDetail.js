import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowLeft,
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Coins,
  Wallet
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { propertiesAPI, investmentsAPI } from '../services/api';
import { formatLocation, formatPrice, getPropertyImage, getPropertyImages } from '../utils/formatLocation';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch property details - PUBLIC ACCESS, NO AUTH REQUIRED
  const { data: propertyData, isLoading: propertyLoading, error: propertyError } = useQuery(
    ['property-detail', id],
    () => propertiesAPI.getById(id),
    {
      enabled: !!id,
      retry: 1,
      // Public access - no authentication required
    }
  );

  // Fetch property stats
  const { data: statsData } = useQuery(
    ['property-stats', id],
    () => propertiesAPI.getStats(id),
    {
      enabled: !!id,
      retry: 1,
    }
  );

  // Fetch investments for this property
  const { data: investmentsData } = useQuery(
    ['property-investments', id],
    () => investmentsAPI.getAll({ 
      propertyId: id,
      limit: 100 
    }),
    {
      enabled: !!id,
      retry: 1,
    }
  );

  const property = propertyData?.data || propertyData || {};
  const stats = statsData?.data || statsData || {};
  const investments = investmentsData?.data?.investments || investmentsData?.data || (Array.isArray(investmentsData) ? investmentsData : []);

  // Get all images
  const mainImage = getPropertyImage(property);
  const allImages = getPropertyImages(property);

  // Extract property data
  const location = property.location || 
                   (property.location_city && property.location_state 
                     ? `${property.location_city}, ${property.location_state}` 
                     : null) ||
                   (property.city && property.state 
                     ? `${property.city}, ${property.state}` 
                     : null) ||
                   property.address ||
                   property.city ||
                   null;

  const totalValue = property.price || 
                     property.pricing?.totalValue || 
                     property.totalValueUSDT ||
                     property.purchasePriceUSDT ||
                     property.pricing?.marketValue ||
                     property.marketValue ||
                     property.pricing_total_value ||
                     0;

  const expectedROI = property.roi || 
                      property.pricing?.expectedROI || 
                      property.expectedROI ||
                      property.pricing_expected_roi ||
                      0;

  const totalTokens = property.tokens || 
                     property.tokenization?.totalTokens || 
                     property.totalTokens ||
                     property.tokenization_total_tokens ||
                     0;

  const availableTokens = property.availableTokens || 
                         property.tokenization?.availableTokens || 
                         property.tokenization_available_tokens ||
                         property.available_tokens ||
                         0;

  const minInvestment = property.minInvestment || 
                       property.pricing?.minInvestment || 
                       property.min_investment ||
                       property.pricing_min_investment ||
                       null;

  const pricePerToken = property.pricePerTokenUSDT || 
                       property.price_per_token_usdt || 
                       property.pricePerToken ||
                       (totalTokens > 0 && totalValue > 0 ? totalValue / totalTokens : 0);

  const fundingPercentage = totalTokens > 0 
    ? ((totalTokens - availableTokens) / totalTokens) * 100 
    : 0;

  const getStatusBadge = (status) => {
    // Show EXACT DB value - no transformation
    if (!status) return { variant: 'default', text: 'N/A' };
    
    // Map for badge colors only, but display the EXACT DB value
    const statusVariantMap = {
      'coming-soon': 'warning',
      'active': 'success',
      'construction': 'info',
      'funding': 'info',
      'on-hold': 'secondary',
      'sold-out': 'danger',
      'completed': 'primary',
      'pending': 'warning',
    };
    
    const variant = statusVariantMap[status] || 'default';
    // Display the EXACT database value - no transformation
    return { variant, text: status };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleInvest = () => {
    navigate(`/wallet?buyTokens=1&propertyId=${property.id || property.displayCode || id}`);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'details', label: 'Details', icon: Building2 },
    { id: 'investments', label: 'Investments', icon: Users },
    { id: 'images', label: 'Images', icon: ImageIcon },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-lg font-bold text-card-foreground mt-1">
                {formatPrice(totalValue)}
              </p>
            </div>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Expected ROI</p>
              <p className="text-lg font-bold text-green-600 mt-1">
                {expectedROI ? `${expectedROI}%` : 'N/A'}
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Tokens</p>
              <p className="text-lg font-bold text-card-foreground mt-1">
                {totalTokens.toLocaleString()}
              </p>
            </div>
            <Coins className="w-5 h-5 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-lg font-bold text-card-foreground mt-1">
                {availableTokens.toLocaleString()}
              </p>
            </div>
            <Target className="w-5 h-5 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Funding Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Funding Progress</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(fundingPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{availableTokens.toLocaleString()} tokens available</span>
            <span>{(totalTokens - availableTokens).toLocaleString()} tokens sold</span>
          </div>
        </div>
      </Card>

      {/* Investment Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Investment Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Price Per Token</p>
            <p className="text-lg font-semibold text-card-foreground mt-1">
              {formatPrice(pricePerToken)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Min Investment</p>
            <p className="text-lg font-semibold text-card-foreground mt-1">
              {minInvestment ? formatPrice(minInvestment) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Investors</p>
            <p className="text-lg font-semibold text-card-foreground mt-1">
              {stats.totalInvestors || investments.length || 0}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Property Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Property Name</label>
            <p className="text-sm text-card-foreground">{property.title || property.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
            <p className="text-sm text-card-foreground">
              {/* Show exact DB value - no transformation */}
              {property.type || property.property_type || property.propertyType || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
            <Badge variant={getStatusBadge(property.status).variant}>
              {getStatusBadge(property.status).text}
            </Badge>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
            <p className="text-sm text-card-foreground">{formatLocation(location)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Address</label>
            <p className="text-sm text-card-foreground">{property.location_address || property.address || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">City</label>
            <p className="text-sm text-card-foreground">{property.location_city || property.city || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">State</label>
            <p className="text-sm text-card-foreground">{property.location_state || property.state || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Country</label>
            <p className="text-sm text-card-foreground">{property.location_country || property.country || 'N/A'}</p>
          </div>
          {property.description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
              <p className="text-sm text-card-foreground whitespace-pre-wrap">{property.description}</p>
            </div>
          )}
          {property.short_description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Short Description</label>
              <p className="text-sm text-card-foreground">{property.short_description}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Financial Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Financial Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Total Value</label>
            <p className="text-lg font-semibold text-card-foreground">{formatPrice(totalValue)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Market Value</label>
            <p className="text-lg font-semibold text-card-foreground">
              {formatPrice(property.pricing_market_value || property.marketValue || totalValue)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Expected ROI</label>
            <p className="text-lg font-semibold text-green-600">{expectedROI ? `${expectedROI}%` : 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Appreciation</label>
            <p className="text-lg font-semibold text-card-foreground">
              {property.pricing_appreciation ? `${property.pricing_appreciation}%` : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Min Investment</label>
            <p className="text-lg font-semibold text-card-foreground">
              {minInvestment ? formatPrice(minInvestment) : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Price Per Token</label>
            <p className="text-lg font-semibold text-card-foreground">{formatPrice(pricePerToken)}</p>
          </div>
        </div>
      </Card>

      {/* Tokenization Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Tokenization Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Total Tokens</label>
            <p className="text-lg font-semibold text-card-foreground">{totalTokens.toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Available Tokens</label>
            <p className="text-lg font-semibold text-card-foreground">{availableTokens.toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Tokens Sold</label>
            <p className="text-lg font-semibold text-card-foreground">{(totalTokens - availableTokens).toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Token Price</label>
            <p className="text-lg font-semibold text-card-foreground">{formatPrice(pricePerToken)}</p>
          </div>
        </div>
      </Card>

      {/* Property Features */}
      {(property.features || property.amenities || property.property_features) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Features & Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {property.property_features?.map((feature, index) => (
              <Badge key={index} variant="default">{feature}</Badge>
            ))}
            {property.amenities?.map((amenity, index) => (
              <Badge key={index} variant="default">{amenity}</Badge>
            ))}
            {property.features?.amenities?.map((amenity, index) => (
              <Badge key={index} variant="default">{amenity}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Dates */}
      {(property.start_date || property.expected_completion || property.handover_date) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {property.start_date && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
                <p className="text-sm text-card-foreground">{formatDate(property.start_date)}</p>
              </div>
            )}
            {property.expected_completion && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Expected Completion</label>
                <p className="text-sm text-card-foreground">{formatDate(property.expected_completion)}</p>
              </div>
            )}
            {property.handover_date && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Handover Date</label>
                <p className="text-sm text-card-foreground">{formatDate(property.handover_date)}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );

  const renderInvestments = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">Investment History</h3>
          <Badge variant="info">{investments.length} investments</Badge>
        </div>
        {investments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No investments yet</p>
        ) : (
          <div className="space-y-4">
            {investments.slice(0, 10).map((investment) => {
              const user = investment.user || {};
              const userName = user.fullName || user.full_name || user.name || 'Unknown User';
              const amount = investment.amountUSDT || investment.amount || investment.investment_amount || 0;
              const tokens = investment.tokensToBuy || investment.tokensPurchased || investment.tokens_purchased || 0;
              const createdAt = investment.createdAt || investment.created_at || investment.date;
              
              return (
                <div key={investment.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{userName}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-card-foreground">{formatPrice(amount)}</p>
                    <p className="text-sm text-muted-foreground">{tokens.toLocaleString()} tokens</p>
                  </div>
                </div>
              );
            })}
            {investments.length > 10 && (
              <p className="text-center text-sm text-muted-foreground">
                Showing 10 of {investments.length} investments
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );

  const renderImages = () => (
    <div className="space-y-6">
      {allImages.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No images available</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allImages.map((imageUrl, index) => (
            <div
              key={index}
              className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
              onClick={() => window.open(imageUrl, '_blank')}
            >
              <img
                src={imageUrl}
                alt={`Property ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (propertyLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (propertyError || !property.title) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-card-foreground mb-2">Property Not Found</h2>
            <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/properties')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Properties
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/properties')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-card-foreground mb-2">{property.title || property.name}</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{formatLocation(location)}</span>
                </div>
                <Badge variant={getStatusBadge(property.status).variant}>
                  {getStatusBadge(property.status).text}
                </Badge>
              </div>
            </div>
            {property.status === 'active' && availableTokens > 0 && (
              <Button onClick={handleInvest} className="ml-4">
                <Wallet className="w-4 h-4 mr-2" />
                Invest Now
              </Button>
            )}
          </div>
        </div>

        {/* Main Image */}
        {mainImage && (
          <Card className="mb-8 overflow-hidden p-0">
            <div className="w-full h-96 bg-muted overflow-hidden">
              <img
                src={mainImage}
                alt={property.title || 'Property image'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'details' && renderDetails()}
          {activeTab === 'investments' && renderInvestments()}
          {activeTab === 'images' && renderImages()}
        </div>
      </div>
    </Layout>
  );
};

export default PropertyDetail;

