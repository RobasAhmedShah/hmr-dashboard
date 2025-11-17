import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { X, Building2, MapPin, DollarSign, TrendingUp, Users, Calendar, Target, Award, Coins, BarChart3, PieChart, Clock, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { propertiesAPI, investmentsAPI } from '../services/api';
import { formatLocation, formatPrice, getPropertyImage, getPropertyImages } from '../utils/formatLocation';

const PropertyDetailModal = ({ property, isOpen, onClose, onInvest }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch detailed property data
  const { data: propertyData, isLoading: propertyLoading } = useQuery(
    ['property-detail', property?.id || property?.displayCode],
    () => propertiesAPI.getById(property?.id || property?.displayCode),
    {
      enabled: isOpen && !!(property?.id || property?.displayCode),
      retry: 1,
    }
  );

  // Fetch property stats
  const { data: statsData } = useQuery(
    ['property-stats', property?.id || property?.displayCode],
    () => propertiesAPI.getStats(property?.id || property?.displayCode),
    {
      enabled: isOpen && !!(property?.id || property?.displayCode),
      retry: 1,
    }
  );

  // Fetch investments for this property
  const { data: investmentsData } = useQuery(
    ['property-investments', property?.id || property?.displayCode],
    () => investmentsAPI.getAll({ 
      propertyId: property?.id || property?.displayCode,
      limit: 100 
    }),
    {
      enabled: isOpen && !!(property?.id || property?.displayCode),
      retry: 1,
    }
  );

  if (!isOpen || !property) return null;

  // Merge property data
  const detailedProperty = propertyData?.data || propertyData || property;
  const stats = statsData?.data || statsData || {};
  const investments = investmentsData?.data?.investments || investmentsData?.data || (Array.isArray(investmentsData) ? investmentsData : []);

  // Get all images
  const mainImage = getPropertyImage(detailedProperty);
  const allImages = getPropertyImages(detailedProperty);

  // Extract property data
  const location = detailedProperty.location || 
                   (detailedProperty.location_city && detailedProperty.location_state 
                     ? `${detailedProperty.location_city}, ${detailedProperty.location_state}` 
                     : null) ||
                   (detailedProperty.city && detailedProperty.state 
                     ? `${detailedProperty.city}, ${detailedProperty.state}` 
                     : null) ||
                   detailedProperty.address ||
                   detailedProperty.city ||
                   null;

  const totalValue = detailedProperty.price || 
                     detailedProperty.pricing?.totalValue || 
                     detailedProperty.totalValueUSDT ||
                     detailedProperty.purchasePriceUSDT ||
                     detailedProperty.pricing?.marketValue ||
                     detailedProperty.marketValue ||
                     detailedProperty.pricing_total_value ||
                     0;

  const expectedROI = detailedProperty.roi || 
                      detailedProperty.pricing?.expectedROI || 
                      detailedProperty.expectedROI ||
                      detailedProperty.pricing_expected_roi ||
                      0;

  const totalTokens = detailedProperty.tokens || 
                     detailedProperty.tokenization?.totalTokens || 
                     detailedProperty.totalTokens ||
                     detailedProperty.tokenization_total_tokens ||
                     0;

  const availableTokens = detailedProperty.availableTokens || 
                         detailedProperty.tokenization?.availableTokens || 
                         detailedProperty.tokenization_available_tokens ||
                         detailedProperty.available_tokens ||
                         0;

  const minInvestment = detailedProperty.minInvestment || 
                       detailedProperty.pricing?.minInvestment || 
                       detailedProperty.min_investment ||
                       detailedProperty.pricing_min_investment ||
                       null;

  const pricePerToken = detailedProperty.pricePerTokenUSDT || 
                       detailedProperty.price_per_token_usdt || 
                       detailedProperty.pricePerToken ||
                       (totalTokens > 0 && totalValue > 0 ? totalValue / totalTokens : 0);

  const fundingPercentage = totalTokens > 0 
    ? ((totalTokens - availableTokens) / totalTokens) * 100 
    : 0;

  const getStatusBadge = (status) => {
    const statusMap = {
      'coming-soon': { variant: 'warning', text: 'Coming Soon' },
      'active': { variant: 'success', text: 'Active' },
      'construction': { variant: 'info', text: 'Under Construction' },
      'funding': { variant: 'info', text: 'Funding' },
      'on-hold': { variant: 'secondary', text: 'On Hold' },
      'sold-out': { variant: 'danger', text: 'Sold Out' },
      'completed': { variant: 'primary', text: 'Completed' },
      'pending': { variant: 'warning', text: 'Pending' },
    };
    return statusMap[status] || { variant: 'default', text: status };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'investments', label: 'Investments' },
    { id: 'images', label: 'Images' },
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
            <p className="text-sm text-card-foreground">{detailedProperty.title || detailedProperty.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
            <p className="text-sm text-card-foreground capitalize">{detailedProperty.type || detailedProperty.property_type || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
            <Badge variant={getStatusBadge(detailedProperty.status).variant}>
              {getStatusBadge(detailedProperty.status).text}
            </Badge>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
            <p className="text-sm text-card-foreground">{formatLocation(location)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Address</label>
            <p className="text-sm text-card-foreground">{detailedProperty.location_address || detailedProperty.address || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">City</label>
            <p className="text-sm text-card-foreground">{detailedProperty.location_city || detailedProperty.city || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">State</label>
            <p className="text-sm text-card-foreground">{detailedProperty.location_state || detailedProperty.state || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Country</label>
            <p className="text-sm text-card-foreground">{detailedProperty.location_country || detailedProperty.country || 'N/A'}</p>
          </div>
          {detailedProperty.description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
              <p className="text-sm text-card-foreground whitespace-pre-wrap">{detailedProperty.description}</p>
            </div>
          )}
          {detailedProperty.short_description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Short Description</label>
              <p className="text-sm text-card-foreground">{detailedProperty.short_description}</p>
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
              {formatPrice(detailedProperty.pricing_market_value || detailedProperty.marketValue || totalValue)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Expected ROI</label>
            <p className="text-lg font-semibold text-green-600">{expectedROI ? `${expectedROI}%` : 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Appreciation</label>
            <p className="text-lg font-semibold text-card-foreground">
              {detailedProperty.pricing_appreciation ? `${detailedProperty.pricing_appreciation}%` : 'N/A'}
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
      {(detailedProperty.features || detailedProperty.amenities || detailedProperty.property_features) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Features & Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {detailedProperty.property_features?.map((feature, index) => (
              <Badge key={index} variant="default">{feature}</Badge>
            ))}
            {detailedProperty.amenities?.map((amenity, index) => (
              <Badge key={index} variant="default">{amenity}</Badge>
            ))}
            {detailedProperty.features?.amenities?.map((amenity, index) => (
              <Badge key={index} variant="default">{amenity}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Dates */}
      {(detailedProperty.start_date || detailedProperty.expected_completion || detailedProperty.handover_date) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {detailedProperty.start_date && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
                <p className="text-sm text-card-foreground">{formatDate(detailedProperty.start_date)}</p>
              </div>
            )}
            {detailedProperty.expected_completion && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Expected Completion</label>
                <p className="text-sm text-card-foreground">{formatDate(detailedProperty.expected_completion)}</p>
              </div>
            )}
            {detailedProperty.handover_date && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Handover Date</label>
                <p className="text-sm text-card-foreground">{formatDate(detailedProperty.handover_date)}</p>
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
                alt={`Property image ${index + 1}`}
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col my-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 rounded-t-lg flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-card-foreground">{detailedProperty.title || detailedProperty.name}</h2>
            <div className="flex items-center mt-2 space-x-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{formatLocation(location)}</span>
              <Badge variant={getStatusBadge(detailedProperty.status).variant} className="ml-2">
                {getStatusBadge(detailedProperty.status).text}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 ml-4"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Image */}
        {mainImage && (
          <div className="w-full h-64 bg-muted overflow-hidden">
            <img
              src={mainImage}
              alt={detailedProperty.title || 'Property image'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {propertyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'details' && renderDetails()}
              {activeTab === 'investments' && renderInvestments()}
              {activeTab === 'images' && renderImages()}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 rounded-b-lg flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {detailedProperty.status === 'active' && availableTokens > 0 && (
            <Button onClick={() => {
              onClose();
              if (onInvest) onInvest(property, 'invest');
            }}>
              Invest Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;

