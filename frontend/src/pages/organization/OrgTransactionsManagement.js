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
  const { isAuthenticated } = useOrganizationAuth();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    transaction_type: ''
  });

  // Fetch transactions using organization-specific API
  const { data: transactionsData, isLoading, error } = useQuery(
    ['org-transactions', organizationId],
    async () => {
      console.log('🔄 Fetching transactions for organization:', organizationId);
      const response = await organizationsAPI.getTransactions(organizationId);
      console.log('✅ Transactions API Response:', response);
      return response;
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated && !!organizationId
    }
  );

  const allTransactions = transactionsData?.data?.data?.transactions || 
                          transactionsData?.data?.transactions || 
                          transactionsData?.data || 
                          (Array.isArray(transactionsData) ? transactionsData : []);

  // Frontend filtering
  const filteredTransactions = useMemo(() => {
    let filtered = [...allTransactions];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(transaction => {
        const id = (transaction.id || '').toLowerCase();
        const description = (transaction.description || '').toLowerCase();
        const userName = (transaction.user_name || '').toLowerCase();
        
        return id.includes(searchLower) ||
               description.includes(searchLower) ||
               userName.includes(searchLower);
      });
    }
    
    if (filters.status) {
      filtered = filtered.filter(transaction =>
        (transaction.status || '').toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    if (filters.transaction_type) {
      filtered = filtered.filter(transaction =>
        (transaction.transaction_type || transaction.transactionType || '').toLowerCase() === filters.transaction_type.toLowerCase()
      );
    }
    
    return filtered;
  }, [allTransactions, filters]);

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

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalAmount = filteredTransactions.reduce((sum, tx) => 
      sum + parseFloat(tx.amount || 0), 0
    );
    const completedTransactions = filteredTransactions.filter(tx => 
      (tx.status || '').toLowerCase() === 'completed' || (tx.status || '').toLowerCase() === 'success'
    ).length;
    const pendingTransactions = filteredTransactions.filter(tx => 
      (tx.status || '').toLowerCase() === 'pending'
    ).length;
    
    return { totalAmount, completedTransactions, pendingTransactions };
  }, [filteredTransactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Transactions Management</h2>
          <p className="text-gray-600">
            Monitor all transactions
            <span className="ml-2 text-blue-600 font-medium">
              ({filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'})
            </span>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.completedTransactions}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.pendingTransactions}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="investment">Investment</option>
              <option value="reward">Reward</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                    <p className="text-gray-500">No transactions match your current filters</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">
                        {transaction.id?.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {transaction.user_name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTransactionTypeBadge(transaction.transaction_type || transaction.transactionType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-3 h-3 mr-2 text-gray-400" />
                        {formatDate(transaction.created_at || transaction.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default OrgTransactionsManagement;

