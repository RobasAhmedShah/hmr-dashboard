import React, { useState, useMemo } from 'react';
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
  Eye,
  Edit,
  Settings,
  FileText,
  Download
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { adminAPI, propertiesAPI, investmentsAPI, walletTransactionsAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';
import { getPropertyImage, getPropertyImages, getPropertyDocuments } from '../../utils/formatLocation';

const PropertyDetail = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch property details
  const { data: propertyData, isLoading: propertyLoading, error: propertyError } = useQuery(
    ['property', propertyId],
    () => propertiesAPI.getById(propertyId),
    {
      enabled: Boolean(isAuthenticated && propertyId)
    }
  );

  // Fetch investments for this property
  const { data: investmentsData, isLoading: investmentsLoading } = useQuery(
    ['property-investments', propertyId],
    () => adminAPI.getInvestments({ limit: 1000 }),
    {
      enabled: Boolean(isAuthenticated && propertyId)
    }
  );

  // Fetch transactions for this property
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery(
    ['property-transactions', propertyId],
    () => walletTransactionsAPI.getAll({ limit: 1000 }),
    {
      enabled: Boolean(isAuthenticated && propertyId)
    }
  );

  const property = propertyData?.data || propertyData || {};
  
  // Debug: Log documents specifically
  console.log('🔍 Property.documents from API:', property.documents);
  console.log('🔍 Property.documents type:', typeof property.documents);
  console.log('🔍 Property.documents isArray:', Array.isArray(property.documents));
  const allInvestments = investmentsData?.data?.investments || investmentsData?.data || (Array.isArray(investmentsData) ? investmentsData : []);
  const allTransactions = transactionsData?.data?.transactions || transactionsData?.data || (Array.isArray(transactionsData) ? transactionsData : []);

  // Filter investments and transactions for this property
  const investments = allInvestments.filter(inv => 
    (inv.propertyId === propertyId || inv.property_id === propertyId || inv.property?.id === propertyId)
  );
  
  const transactions = allTransactions.filter(txn => 
    (txn.propertyId === propertyId || txn.property_id === propertyId || txn.property?.id === propertyId)
  );

  // Calculate metrics from the data
  const metrics = useMemo(() => {
    const totalInvestment = investments.reduce((sum, inv) => {
      const amount = parseFloat(inv.amountUSDT || inv.amount || inv.investment_amount || 0);
      return sum + amount;
    }, 0);

    const uniqueBuyers = new Set();
    investments.forEach(inv => {
      const userId = inv.userId || inv.user_id || inv.user?.id;
      if (userId) uniqueBuyers.add(userId);
    });

    const totalTokens = parseFloat(property.totalTokens || property.total_tokens || 0);
    const availableTokens = parseFloat(property.availableTokens || property.available_tokens || 0);
    const tokensSold = totalTokens - availableTokens;
    const tokensLeft = availableTokens;
    
    const pricePerToken = parseFloat(property.pricePerTokenUSDT || property.price_per_token_usdt || property.pricePerToken || 0);
    const totalValueUSDT = parseFloat(property.totalValueUSDT || property.total_value_usdt || property.pricing_total_value || 0);
    
    const fundingProgress = totalValueUSDT > 0 ? (totalInvestment / totalValueUSDT) * 100 : 0;
    const expectedROI = parseFloat(property.expectedROI || property.expected_roi || 0);

    return {
      totalInvestment,
      totalBuyers: uniqueBuyers.size,
      tokensLeft,
      tokensSold,
      totalTokens,
      pricePerToken,
      roi: expectedROI,
      fundingProgress: Math.min(fundingProgress, 100)
    };
  }, [investments, property]);

  const isLoading = propertyLoading || investmentsLoading || transactionsLoading;
  const error = propertyError;

  const formatPrice = (amount, currency = 'USD') => {
    const num = parseFloat(amount);
    if (num >= 1000000000) {
      return `${currency} ${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `${currency} ${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${currency} ${(num / 1000).toFixed(0)}K`;
    }
    return `${currency} ${num.toFixed(0)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'coming-soon': { variant: 'warning', text: 'Coming Soon' },
      'active': { variant: 'success', text: 'Active' },
      'construction': { variant: 'info', text: 'Under Construction' },
      'on-hold': { variant: 'secondary', text: 'On Hold' },
      'sold-out': { variant: 'danger', text: 'Sold Out' },
      'completed': { variant: 'primary', text: 'Completed' }
    };
    return statusMap[status] || { variant: 'default', text: status };
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'tokens', label: 'Token Activity', icon: PieChart },
    { id: 'transactions', label: 'Transactions', icon: Activity }
  ];

  const StatCard = ({ title, value, icon: Icon, color = 'blue', change, changeType = 'positive' }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'positive' ? '+' : ''}{change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Investment"
          value={formatPrice(metrics.totalInvestment || 0)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Buyers"
          value={metrics.totalBuyers || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Tokens Left"
          value={metrics.tokensLeft || 0}
          icon={Target}
          color="yellow"
        />
        <StatCard
          title="ROI"
          value={`${metrics.roi || 0}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Price Per Token"
          value={formatPrice(metrics.pricePerToken || 0)}
          icon={Award}
          color="indigo"
        />
        <StatCard
          title="Total Tokens"
          value={metrics.totalTokens || 0}
          icon={PieChart}
          color="pink"
        />
        <StatCard
          title="Funding Progress"
          value={`${metrics.fundingProgress || 0}%`}
          icon={BarChart3}
          color="teal"
        />
      </div>

      {/* Property Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Property Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Property Name</label>
            <p className="text-sm text-card-foreground">{property.title || property.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Type</label>
            <p className="text-sm text-card-foreground capitalize">{property.type || property.property_type || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Status</label>
            {property.status ? (
              <Badge variant={getStatusBadge(property.status).variant}>
                {getStatusBadge(property.status).text}
              </Badge>
            ) : (
              <p className="text-sm text-gray-500">N/A</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Location</label>
            <p className="text-sm text-card-foreground">{property.city || property.location_city || property.location || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Total Value</label>
            <p className="text-sm text-card-foreground">{formatPrice(property.totalValueUSDT || property.total_value_usdt || property.pricing_total_value || 0, 'USD')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Price Per Token</label>
            <p className="text-sm text-card-foreground">{formatPrice(property.pricePerTokenUSDT || property.price_per_token_usdt || property.pricePerToken || 0, 'USD')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Total Tokens</label>
            <p className="text-sm text-card-foreground">{(property.totalTokens || property.total_tokens || 0).toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Available Tokens</label>
            <p className="text-sm text-card-foreground">{(property.availableTokens || property.available_tokens || 0).toLocaleString()}</p>
          </div>
          {property.description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <p className="text-sm text-card-foreground">{property.description}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderInvestments = () => (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-card-foreground">Investment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {investments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No investments found for this property
                  </td>
                </tr>
              ) : (
                investments.map((investment) => {
                  const user = investment.user || {};
                  const userName = user.fullName || user.full_name || user.name || 'Unknown User';
                  const userEmail = user.email || 'N/A';
                  const amount = investment.amountUSDT || investment.amount || investment.investment_amount || 0;
                  const tokens = investment.tokensToBuy || investment.tokensPurchased || investment.tokens_purchased || investment.tokens_to_buy || 0;
                  const createdAt = investment.createdAt || investment.created_at || investment.date;
                  
                  return (
                    <tr key={investment.id || investment._id || Math.random()} className="hover:bg-accent">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <Users className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-card-foreground">
                              {userName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                        {formatPrice(amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                        {parseFloat(tokens).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {createdAt ? formatDate(createdAt) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={investment.status === 'pending' ? 'warning' : 'success'}>
                          {investment.status || 'completed'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderTokens = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Token Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Total Tokens</label>
            <p className="text-2xl font-bold text-card-foreground">{metrics.totalTokens || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tokens Sold</label>
            <p className="text-2xl font-bold text-card-foreground">{metrics.tokensSold || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tokens Left</label>
            <p className="text-2xl font-bold text-card-foreground">{metrics.tokensLeft || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Price Per Token</label>
            <p className="text-2xl font-bold text-card-foreground">{formatPrice(metrics.pricePerToken || 0, 'USD')}</p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-card-foreground">Recent Token Purchases</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {investments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No token purchases found for this property
                  </td>
                </tr>
              ) : (
                investments.map((purchase) => {
                  const user = purchase.user || {};
                  const userName = user.fullName || user.full_name || user.name || 'Unknown User';
                  const tokens = purchase.tokensToBuy || purchase.tokensPurchased || purchase.tokens_purchased || purchase.tokens_to_buy || 0;
                  const amount = purchase.amountUSDT || purchase.amount || purchase.investment_amount || 0;
                  const createdAt = purchase.createdAt || purchase.created_at || purchase.date;
                  
                  return (
                    <tr key={purchase.id || purchase._id || Math.random()} className="hover:bg-accent">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-card-foreground">
                          {userName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                        {parseFloat(tokens).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                        {formatPrice(amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {createdAt ? formatDate(createdAt) : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-card-foreground">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No transactions found for this property
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const txnId = transaction.id || transaction._id || 'N/A';
                  const txnType = transaction.type || transaction.transaction_type || transaction.transactionType || 'N/A';
                  const amount = transaction.amountUSDT || transaction.amount || transaction.amount_in_pkr || 0;
                  const createdAt = transaction.createdAt || transaction.created_at || transaction.date;
                  const status = transaction.status || 'completed';
                  
                  return (
                    <tr key={txnId} className="hover:bg-accent">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-card-foreground">
                          {typeof txnId === 'string' && txnId.length > 8 ? txnId.slice(0, 8) + '...' : txnId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">{txnType}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                        {formatPrice(amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {createdAt ? formatDate(createdAt) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={status === 'pending' ? 'warning' : 'success'}>
                          {status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderDocuments = () => {
    const documents = getPropertyDocuments(property);
    
    // Check if any documents exist
    const hasDocuments = documents?.brochure || 
                         documents?.floorPlan || 
                         (Array.isArray(documents?.compliance) && documents.compliance.length > 0);
    
    if (!hasDocuments) {
      return (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No Documents Available</h3>
            <p className="text-sm text-muted-foreground">No documents have been uploaded for this property yet.</p>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Brochure */}
        {documents?.brochure && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Brochure
              </h3>
            </div>
            <div className="p-4 bg-accent rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">
                    {documents.brochure.name}
                  </p>
                  {documents.brochure.notes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {documents.brochure.notes}
                    </p>
                  )}
                  {documents.brochure.uploadedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploaded: {new Date(documents.brochure.uploadedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <a
                  href={documents.brochure.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 p-2 text-primary hover:text-primary/80 transition-colors"
                  title="View Brochure"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            </div>
          </Card>
        )}

        {/* Floor Plan */}
        {documents?.floorPlan && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Floor Plan
              </h3>
            </div>
            <div className="p-4 bg-accent rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">
                    Version {documents.floorPlan.version}
                  </p>
                  {documents.floorPlan.mimeType && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {documents.floorPlan.mimeType}
                    </p>
                  )}
                </div>
                <a
                  href={documents.floorPlan.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 p-2 text-primary hover:text-primary/80 transition-colors"
                  title="View Floor Plan"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            </div>
          </Card>
        )}

        {/* Compliance Documents */}
        {Array.isArray(documents?.compliance) && documents.compliance.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Compliance Documents
              </h3>
              <p className="text-sm text-muted-foreground">
                {documents.compliance.length} {documents.compliance.length === 1 ? 'document' : 'documents'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.compliance.map((comp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-accent rounded-lg border border-border hover:bg-accent/80 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {comp.type}
                      </p>
                      {comp.issuedAt && (
                        <p className="text-xs text-muted-foreground">
                          Issued: {comp.issuedAt}
                        </p>
                      )}
                      {comp.issuedBy && (
                        <p className="text-xs text-muted-foreground">
                          By: {comp.issuedBy}
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={comp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 p-2 text-primary hover:text-primary/80 transition-colors"
                    title="View Document"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'documents':
        return renderDocuments();
      case 'investments':
        return renderInvestments();
      case 'tokens':
        return renderTokens();
      case 'transactions':
        return renderTransactions();
      default:
        return renderOverview();
    }
  };

  // Wait for auth to finish loading before checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-muted-foreground">Checking authentication...</span>
      </div>
    );
  }

  // Only show login message if auth has finished loading and user is not authenticated
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view property details.</p>
        <Button onClick={() => navigate('/admin/login')} className="mt-4">
          Go to Login
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-muted-foreground">Loading property details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load property details</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Admin</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">{property.title || property.name || 'Property Details'}</h1>
                <p className="text-sm text-muted-foreground">{property.city || property.location_city || property.location || 'Location not specified'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit Property</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Image Section */}
        {(() => {
          const mainImage = getPropertyImage(property);
          const allImages = getPropertyImages(property);
          
          if (mainImage || allImages.length > 0) {
            return (
              <Card className="mb-8 overflow-hidden">
                <div className="relative">
                  {/* Main Image */}
                  {mainImage && (
                    <div className="w-full h-96 bg-muted flex items-center justify-center overflow-hidden">
                      <img
                        src={mainImage}
                        alt={property.title || property.name || 'Property image'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', mainImage);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center bg-muted">
                        <Building2 className="w-16 h-16 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  
                  {/* Image Gallery (if multiple images) */}
                  {allImages.length > 1 && (
                    <div className="p-4 bg-accent border-t border-border">
                      <h3 className="text-sm font-medium text-foreground mb-3">Additional Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {allImages.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          }
          return null;
        })()}


        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-foreground hover:border-input'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PropertyDetail;
