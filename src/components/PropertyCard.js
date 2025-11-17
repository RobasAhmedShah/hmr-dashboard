import React from 'react';
import { MapPin, Coins, Building2 } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { formatLocation, formatPrice, getPropertyImage } from '../utils/formatLocation';

const PropertyCard = ({ property, onInvest }) => {
  // Debug: Log the property data
  console.log('PropertyCard received property:', property);

  const getStatusBadge = (status) => {
    // Show EXACT DB value - no transformation
    if (!status) return <Badge variant="default">N/A</Badge>;
    
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
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getPropertyTypeColor = (type) => {
    const typeMap = {
      'residential': 'bg-blue-100 text-blue-800',
      'commercial': 'bg-green-100 text-green-800',
      'mixed-use': 'bg-purple-100 text-purple-800',
    };
    return typeMap[type] || 'bg-muted text-card-foreground';
  };

  // Extract property data with fallbacks for different API formats
  // Location handling
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

  // Total Value - check multiple possible field names
  const totalValue = property.price || 
                     property.pricing?.totalValue || 
                     property.totalValueUSDT ||
                     property.purchasePriceUSDT ||
                     property.pricing?.marketValue ||
                     property.marketValue ||
                     null;

  // Expected ROI - check multiple possible field names
  const expectedROI = property.roi || 
                      property.pricing?.expectedROI || 
                      property.expectedROI ||
                      property.pricing_expected_roi ||
                      null;

  // Tokens - check multiple possible field names
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

  // Calculate price per token
  const pricePerToken = property.pricePerTokenUSDT || 
                       property.price_per_token_usdt || 
                       property.pricePerToken ||
                       property.tokenization?.pricePerToken ||
                       property.tokenization_price_per_token ||
                       (totalTokens > 0 && totalValue > 0 ? totalValue / totalTokens : 0);

  // Min Investment - check multiple possible field names
  const minInvestment = property.minInvestment || 
                       property.pricing?.minInvestment || 
                       property.min_investment ||
                       property.pricing_min_investment ||
                       property.pricing?.min_investment ||
                       property.minInvestmentUSDT ||
                       property.min_investment_usdt ||
                       // Calculate from price per token if available (minimum 1 token)
                       (pricePerToken > 0 ? pricePerToken : null) ||
                       null;

  // Calculate funding percentage
  const tokenPercentage = property.fundingPercentage || 
    (totalTokens > 0 
      ? ((totalTokens - availableTokens) / totalTokens) * 100 
      : 0);

  const mainImage = getPropertyImage(property);

  return (
    <Card hover className="h-full flex flex-col overflow-hidden">
      {/* Property Image */}
      {mainImage && (
        <div className="relative w-full h-48 bg-muted overflow-hidden">
          <img
            src={mainImage}
            alt={property.title || 'Property image'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
            {getStatusBadge(property.status)}
            <Badge className={getPropertyTypeColor(property.propertyType || property.type || property.property_type)}>
              {/* Show exact DB value - no transformation */}
              {property.propertyType || property.type || property.property_type || 'Property'}
            </Badge>
            {property.isFeatured && (
              <Badge variant="primary">Featured</Badge>
            )}
          </div>
        </div>
      )}
      {!mainImage && (
        <div className="relative w-full h-48 bg-muted flex items-center justify-center mb-4">
          <Building2 className="w-16 h-16 text-muted-foreground" />
          <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
            {getStatusBadge(property.status)}
            <Badge className={getPropertyTypeColor(property.propertyType || property.type || property.property_type)}>
              {/* Show exact DB value - no transformation */}
              {property.propertyType || property.type || property.property_type || 'Property'}
            </Badge>
            {property.isFeatured && (
              <Badge variant="primary">Featured</Badge>
            )}
          </div>
        </div>
      )}
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold text-card-foreground mb-2 line-clamp-2">
          {property.title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {property.shortDescription || property.description || 'No description available'}
        </p>

        <div className="flex items-center text-white/80 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{formatLocation(location)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-white/80">Total Value</p>
            <p className="font-semibold text-lg text-white">
              {totalValue ? formatPrice(totalValue) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/80">Expected ROI</p>
            <p className="font-semibold text-lg text-green-400">
              {expectedROI ? `${expectedROI}%` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white/80">Funding Progress</span>
            <span className="font-medium text-white">{Math.round(tokenPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${tokenPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>{availableTokens} available</span>
            <span>{totalTokens} total</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="flex items-center">
            <Coins className="w-4 h-4 mr-1 text-white/70" />
            <span className="text-white/80">Min Investment</span>
          </div>
          <div className="text-right font-medium text-white">
            {minInvestment ? (typeof minInvestment === 'string' ? minInvestment : `PKR ${minInvestment.toLocaleString()}`) : 'N/A'}
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onInvest) {
                  onInvest(property, 'details');
                }
              }}
            >
              More Info
            </Button>
            {property.status === 'active' && availableTokens > 0 && (
              <Button
                type="button"
                className="flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onInvest) {
                    onInvest(property, 'invest');
                  }
                }}
              >
                Invest Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PropertyCard;
