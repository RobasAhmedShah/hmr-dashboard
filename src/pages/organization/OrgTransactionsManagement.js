import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { 
  Search, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { organizationsAPI } from '../../services/api';
import { useOrganizationAuth } from '../../components/organization/OrganizationAuth';

const OrgTransactionsManagement = ({ organizationId }) => {
  const { isAuthenticated, organizationName } = useOrganizationAuth();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    transaction_type: '',
    startDate: '',
    endDate: '',
    sortBy: 'latest' // 'latest' or 'earliest'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch organization liquidity transactions
  const { data: transactionsData, isLoading, error } = useQuery(
    ['org-transactions', organizationId],
    async () => {
      console.log(`💳 Fetching ONLY ${organizationName} transactions via GET /organizations/${organizationId}/transactions`);
      const response = await organizationsAPI.getTransactions(organizationId);
      console.log('✅ Organization Transactions API Response:', response);
      return response;
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated && !!organizationId
    }
  );

  // Extract transactions from response (handles multiple response structures)
  const orgTransactions = transactionsData?.data?.data?.transactions || 
                          transactionsData?.data?.transactions || 
                          transactionsData?.data || 
                          (Array.isArray(transactionsData) ? transactionsData : []);

  // Debug: Log transaction structure
  React.useEffect(() => {
    if (orgTransactions.length > 0) {
      console.log(`📊 ${organizationName} - First Transaction Structure:`, orgTransactions[0]);
      console.log(`💰 Total Transactions Fetched for ${organizationName}:`, orgTransactions.length);
    } else {
      console.log(`⚠️ No transactions found for ${organizationName} (${organizationId})`);
    }
  }, [orgTransactions, organizationName, organizationId]);

  // All transactions (currently just org transactions, but could be combined with investments)
  const allTransactions = [...orgTransactions];

  // Helper function to extract transaction amount (handles multiple field name variations)
  const getTransactionAmount = (tx) => {
    return parseFloat(
      tx.amountUSDT || 
      tx.amount_usdt || 
      tx.amount || 
      0
    );
  };

  // Helper function to extract user/entity name
  const getTransactionUser = (tx) => {
    // For organization transactions, could be fromEntity or toEntity
    return tx.fromEntity || 
           tx.toEntity || 
           tx.user_name || 
           tx.userName || 
           (tx.user && (tx.user.fullName || tx.user.name)) ||
           'N/A';
  };

  // Helper function to extract transaction type
  const getTransactionType = (tx) => {
    return tx.type || 
           tx.transaction_type || 
           tx.transactionType || 
           'other';
  };

  // Frontend filtering and sorting
  const filteredTransactions = useMemo(() => {
    let filtered = [...allTransactions];
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(transaction => {
        const id = (transaction.id || transaction.displayCode || '').toLowerCase();
        const description = (transaction.description || '').toLowerCase();
        const userName = getTransactionUser(transaction).toLowerCase();
        const fromEntity = (transaction.fromEntity || '').toLowerCase();
        const toEntity = (transaction.toEntity || '').toLowerCase();
        
        return id.includes(searchLower) ||
               description.includes(searchLower) ||
               userName.includes(searchLower) ||
               fromEntity.includes(searchLower) ||
               toEntity.includes(searchLower);
      });
    }
    
    // Status filter
    if (filters.status) {
      filtered = filtered.filter(transaction =>
        (transaction.status || '').toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    // Type filter
    if (filters.transaction_type) {
      const typeFilter = filters.transaction_type.toLowerCase();
      filtered = filtered.filter(transaction => {
        const txType = getTransactionType(transaction).toLowerCase();
        return txType === typeFilter;
      });
    }
    
    // Date range filter
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(transaction => {
        const txDate = new Date(transaction.created_at || transaction.createdAt || 0);
        if (!txDate || isNaN(txDate.getTime())) return false;
        
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;
        
        // Set time to start/end of day for proper comparison
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
        }
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        
        txDate.setHours(0, 0, 0, 0);
        
        if (startDate && endDate) {
          return txDate >= startDate && txDate <= endDate;
        } else if (startDate) {
          return txDate >= startDate;
        } else if (endDate) {
          return txDate <= endDate;
        }
        return true;
      });
    }
    
    // Sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      
      if (filters.sortBy === 'latest') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });
    
    return filtered;
  }, [allTransactions, filters]);
  
  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status, filters.transaction_type, filters.startDate, filters.endDate]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'USD 0';
    return `USD ${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'success':
        return (
          <Badge variant="green" className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="yellow" className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
      case 'cancelled':
        return (
          <Badge variant="red" className="flex items-center">
            <XCircle className="w-3 h-3 mr-1" />
            {statusLower === 'failed' ? 'Failed' : 'Cancelled'}
          </Badge>
        );
      default:
        return <Badge variant="gray">{status || 'Unknown'}</Badge>;
    }
  };

  const getTransactionTypeBadge = (type) => {
    const typeLower = (type || '').toLowerCase();
    switch (typeLower) {
      case 'inflow':
        return (
          <Badge variant="green" className="flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            Inflow
          </Badge>
        );
      case 'outflow':
        return (
          <Badge variant="red" className="flex items-center">
            <TrendingDown className="w-3 h-3 mr-1" />
            Outflow
          </Badge>
        );
      case 'deposit':
        return (
          <Badge variant="blue" className="flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            Deposit
          </Badge>
        );
      case 'withdrawal':
        return (
          <Badge variant="purple" className="flex items-center">
            <TrendingDown className="w-3 h-3 mr-1" />
            Withdrawal
          </Badge>
        );
      case 'investment':
        return (
          <Badge variant="green" className="flex items-center">
            <DollarSign className="w-3 h-3 mr-1" />
            Investment
          </Badge>
        );
      case 'reward':
        return (
          <Badge variant="orange" className="flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            Reward
          </Badge>
        );
      default:
        return <Badge variant="gray">{type || 'Other'}</Badge>;
    }
  };

  // Calculate summary statistics using helper functions
  const summary = useMemo(() => {
    const totalAmount = filteredTransactions.reduce((sum, tx) => 
      sum + getTransactionAmount(tx), 0
    );
    const completedTransactions = filteredTransactions.filter(tx => 
      (tx.status || '').toLowerCase() === 'completed' || (tx.status || '').toLowerCase() === 'success'
    ).length;
    const pendingTransactions = filteredTransactions.filter(tx => 
      (tx.status || '').toLowerCase() === 'pending'
    ).length;
    
    // Enhanced debug logging
    console.log(`💳 ${organizationName} Transaction Summary:`, {
      totalTransactions: filteredTransactions.length,
      totalAmount: totalAmount,
      completedCount: completedTransactions,
      pendingCount: pendingTransactions,
      note: `Only showing ${organizationName} transactions`,
      breakdown: filteredTransactions.map(tx => ({
        id: tx.displayCode || tx.id,
        amount: getTransactionAmount(tx),
        type: getTransactionType(tx),
        status: tx.status
      }))
    });
    
    return { totalAmount, completedTransactions, pendingTransactions };
  }, [filteredTransactions, organizationName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load transactions</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Transactions Management</h2>
          <p className="text-muted-foreground">
            Monitor {organizationName} transactions
            <span className="ml-2 text-primary font-medium">
              ({filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'})
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            💳 Showing only transactions for {organizationName} (Organization ID: {organizationId})
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-2 border-blue-400 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatCurrency(summary.totalAmount)}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-green-500 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold text-card-foreground">
                {summary.completedTransactions}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-yellow-500 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-card-foreground">
                {summary.pendingTransactions}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentPage(1);
                  }
                }}
                className="w-full pl-10 pr-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.transaction_type}
              onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
            >
              <option value="">All Types</option>
              <option value="inflow">Inflow (Money In)</option>
              <option value="outflow">Outflow (Money Out)</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="investment">Investment</option>
              <option value="reward">Reward</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={filters.startDate}
                className="w-full pl-10 pr-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              >
                <option value="latest">Latest First</option>
                <option value="earliest">Earliest First</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(filters.startDate || filters.endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFilterChange('startDate', '');
                  handleFilterChange('endDate', '');
                }}
                className="text-xs"
              >
                Clear Date Filter
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                // Trigger filter application by resetting page
                setCurrentPage(1);
              }}
              className="text-xs flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-card-foreground mb-2">No transactions found</h3>
                    <p className="text-muted-foreground">No transactions match your current filters</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((transaction) => {
                  const amount = getTransactionAmount(transaction);
                  const txType = getTransactionType(transaction);
                  const userName = getTransactionUser(transaction);
                  
                  return (
                    <tr key={transaction.id || transaction.displayCode} className="hover:bg-background">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-mono text-card-foreground">
                            {transaction.displayCode || transaction.id?.slice(0, 12) || 'N/A'}
                          </div>
                          {transaction.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs" title={transaction.description}>
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-card-foreground">
                              {userName}
                            </div>
                            {transaction.fromEntity && transaction.toEntity && (
                              <div className="text-xs text-muted-foreground">
                                {transaction.fromEntity} → {transaction.toEntity}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTransactionTypeBadge(txType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(amount)}
                        </div>
                        {transaction.propertyId && (
                          <div className="text-xs text-muted-foreground">
                            Property: {transaction.propertyId.slice(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-2 text-gray-400" />
                          {formatDate(transaction.created_at || transaction.createdAt)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-foreground">
                  Showing{' '}
                  <span className="font-medium">
                    {filteredTransactions.length === 0 ? 0 : startIndex + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(endIndex, filteredTransactions.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{filteredTransactions.length}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-r-none"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-input text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-l-none"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrgTransactionsManagement;

