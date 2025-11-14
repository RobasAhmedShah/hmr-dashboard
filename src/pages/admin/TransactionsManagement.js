import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { 
  Search, 
  Filter, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { adminAPI } from '../../services/api';
import { useAdminAuth } from '../../components/admin/AdminAuth';

const TransactionsManagement = () => {
  const { isAuthenticated } = useAdminAuth();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    transaction_type: '',
    property: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch transactions
  const { data: transactionsData, isLoading, error } = useQuery(
    ['admin-transactions'],
    async () => {
      const response = await adminAPI.getTransactions({
        limit: 1000 // Get all transactions for frontend filtering
      });
      console.log('Transactions API Response:', response);
      return response;
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated
    }
  );

  // Handle different response formats from backend
  const allTransactions = transactionsData?.data?.data?.transactions || 
                          transactionsData?.data?.transactions || 
                          transactionsData?.data || 
                          (Array.isArray(transactionsData) ? transactionsData : []);

  // Get unique properties from transactions for filter dropdown
  const uniqueProperties = useMemo(() => {
    const propertySet = new Set();
    allTransactions.forEach(transaction => {
      const propertyTitle = transaction.property?.title || transaction.property_title;
      if (propertyTitle) {
        propertySet.add(propertyTitle);
      }
    });
    return Array.from(propertySet).sort();
  }, [allTransactions]);
  
  // Frontend filtering logic
  const filteredTransactions = useMemo(() => {
    let filtered = [...allTransactions];
    
    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(transaction => {
        const id = (transaction.id || '').toLowerCase();
        const description = (transaction.description || '').toLowerCase();
        const userName = (transaction.user_name || '').toLowerCase();
        const userEmail = (transaction.user_email || '').toLowerCase();
        
        return id.includes(searchLower) ||
               description.includes(searchLower) ||
               userName.includes(searchLower) ||
               userEmail.includes(searchLower);
      });
    }
    
    // Status filter
    if (filters.status && filters.status.trim()) {
      filtered = filtered.filter(transaction => {
        const transactionStatus = (transaction.status || '').toLowerCase();
        const filterStatus = filters.status.toLowerCase();
        return transactionStatus === filterStatus;
      });
    }
    
    // Transaction type filter
    if (filters.transaction_type && filters.transaction_type.trim()) {
      filtered = filtered.filter(transaction => {
        const transactionType = (transaction.transaction_type || '').toLowerCase();
        const filterType = filters.transaction_type.toLowerCase();
        return transactionType === filterType;
      });
    }
    
    // Property filter
    if (filters.property && filters.property.trim()) {
      filtered = filtered.filter(transaction => {
        const propertyTitle = (transaction.property?.title || transaction.property_title || '').toLowerCase();
        const filterProperty = filters.property.toLowerCase();
        return propertyTitle.includes(filterProperty);
      });
    }
    
    // Sorting
    if (filters.sort_by) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (filters.sort_by) {
          case 'amount_in_pkr':
            aValue = parseFloat(a.amount_in_pkr || 0);
            bValue = parseFloat(b.amount_in_pkr || 0);
            break;
          case 'status':
            aValue = (a.status || '').toLowerCase();
            bValue = (b.status || '').toLowerCase();
            break;
          case 'created_at':
          default:
            aValue = new Date(a.created_at || 0);
            bValue = new Date(b.created_at || 0);
            break;
        }
        
        if (filters.sort_order === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }
    
    return filtered;
  }, [allTransactions, filters]);
  
  // Use filtered transactions instead of raw transactions
  const transactions = filteredTransactions;
  
  const pagination = transactionsData?.data?.data?.pagination || 
                     transactionsData?.data?.pagination || 
                     {
                       totalPages: 1,
                       currentPage: 1,
                       totalTransactions: transactions.length,
                       hasPrev: false,
                       hasNext: false
                     };

  // Calculate summary statistics from ALL transactions (not filtered)
  const summary = useMemo(() => {
    const stats = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      pendingCount: 0,
      netVolume: 0
    };
    
    allTransactions.forEach(tx => {
      const amount = parseFloat(tx.amountUSDT || tx.amount_in_pkr || tx.amount || 0);
      const type = (tx.transaction_type || tx.type || '').toLowerCase();
      const status = (tx.status || '').toLowerCase();
      
      // Count pending
      if (status === 'pending') {
        stats.pendingCount++;
      }
      
      // Sum deposits and withdrawals (only completed)
      if (status === 'completed') {
        if (type === 'deposit') {
          stats.totalDeposits += amount;
          stats.netVolume += amount;
        } else if (type === 'withdrawal') {
          stats.totalWithdrawals += amount;
          stats.netVolume -= amount;
        }
      }
    });
    
    return stats;
  }, [allTransactions]);

  // Debug logging
  console.log('Transactions Data:', {
    raw: transactionsData,
    allTransactions: allTransactions.length,
    filteredTransactions: transactions.length,
    pagination: pagination,
    summary: summary
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // No need to reset currentPage since we're using frontend filtering
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { variant: 'warning', text: 'Pending', icon: Clock },
      'completed': { variant: 'success', text: 'Completed', icon: CheckCircle },
      'failed': { variant: 'danger', text: 'Failed', icon: XCircle },
      'cancelled': { variant: 'default', text: 'Cancelled', icon: XCircle }
    };
    return statusMap[status] || { variant: 'default', text: status, icon: Clock };
  };

  const getTransactionTypeIcon = (type) => {
    return type === 'deposit' ? TrendingUp : TrendingDown;
  };

  const getTransactionTypeColor = (type) => {
    return type === 'deposit' ? 'text-green-600' : 'text-red-600';
  };

  const formatPrice = (amount, currency = 'PKR') => {
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
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
    return `${month}/${day}/${year}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view transactions.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-muted-foreground">Loading transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Failed to load transactions</p>
          <p className="text-muted-foreground text-sm mb-2">{error.message}</p>
        </div>
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
            Monitor all financial transactions
            {allTransactions.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({allTransactions.length} {allTransactions.length === 1 ? 'transaction' : 'transactions'})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Deposits</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatPrice(summary.totalDeposits)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Withdrawals</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatPrice(summary.totalWithdrawals)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-card-foreground">
                {summary.pendingCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Net Volume</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatPrice(summary.netVolume)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="w-full pl-10 pr-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Type</label>
            <select
              value={filters.transaction_type}
              onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Property</label>
            <select
              value={filters.property}
              onChange={(e) => handleFilterChange('property', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="">All Properties</option>
              {uniqueProperties.map((propertyTitle) => (
                <option key={propertyTitle} value={propertyTitle}>
                  {propertyTitle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sort By</label>
            <select
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="created_at">Date</option>
              <option value="amount_in_pkr">Amount</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Order</label>
            <select
              value={filters.sort_order}
              onChange={(e) => handleFilterChange('sort_order', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="desc">Descending ↓</option>
              <option value="asc">Ascending ↑</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <div>
          <table className="w-full table-fixed text-sm">
            <thead className="bg-accent">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[10rem]">
                  Transaction
                </th>
                <th className="pl-6 pr-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[18rem]">
                  User
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[8rem]">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[8rem]">
                  Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[9rem]">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[10rem]">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No transactions found</p>
                      <p className="text-sm">Transactions will appear here once users make deposits or withdrawals</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  // Map backend field names to frontend
                  const mappedTransaction = {
                    ...transaction,
                    status: transaction.status || 'completed',
                    transaction_type: transaction.transactionType || transaction.transaction_type || transaction.type || 'deposit',
                    amount_in_pkr: transaction.amountUSDT || transaction.amount_in_pkr || transaction.amount || 0,
                    currency: transaction.currency || 'USDT',
                    created_at: transaction.createdAt || transaction.created_at,
                    user_name: transaction.user?.fullName || transaction.user_name || 'Unknown',
                    user_email: transaction.user?.email || transaction.user_email || '',
                    description: transaction.description || `${transaction.transactionType || transaction.type || 'Transaction'}`
                  };

                  const statusInfo = getStatusBadge(mappedTransaction.status);
                  const TypeIcon = getTransactionTypeIcon(mappedTransaction.transaction_type);
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={transaction.id} className="hover:bg-accent">
                    <td className="pl-6 pr-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="ml-3 min-w-0">
                          <div className="text-sm font-medium text-card-foreground">
                            {transaction.displayCode || transaction.id?.slice(0, 8) + '...'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[20rem]">
                            {mappedTransaction.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="ml-2 min-w-0">
                          <div className="text-sm font-medium text-card-foreground truncate">
                            {mappedTransaction.user_name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[14rem]">
                            {mappedTransaction.user_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className={`flex items-center text-sm ${getTransactionTypeColor(mappedTransaction.transaction_type)}`}>
                        <TypeIcon className="w-4 h-4 mr-2" />
                        <span className="capitalize">{mappedTransaction.transaction_type}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-card-foreground">
                      {formatPrice(mappedTransaction.amount_in_pkr, mappedTransaction.currency)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge variant={statusInfo.variant} className="flex items-center text-[10px] px-2 py-0.5">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.text}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-2 text-muted-foreground" />
                        {formatDate(mappedTransaction.created_at)}
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
        {pagination.totalPages > 1 && (
          <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-foreground">
                  Showing{' '}
                  <span className="font-medium">
                    {((currentPage - 1) * 10) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, pagination.totalTransactions)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalTransactions}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-card border-input text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TransactionsManagement;
