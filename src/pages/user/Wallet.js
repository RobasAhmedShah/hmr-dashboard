import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { 
  Wallet as WalletIcon, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useUser } from '../../contexts/UserContext';
import { walletTransactionsAPI, paymentMethodsAPI, usersAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatLocation';
import BuyTokens from '../../components/BuyTokens';
import OnChainDeposit from '../../components/OnChainDeposit';

const Wallet = () => {
  const { currentUser } = useUser();
  const userId = currentUser?.id;
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showOnChainDepositModal, setShowOnChainDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showBuyTokens, setShowBuyTokens] = useState(false);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  // Invalidate queries when user changes
  useEffect(() => {
    if (currentUser?.name) {
      console.log('Wallet: User changed to:', currentUser.name, 'ID:', userId);
    }
    queryClient.invalidateQueries(['wallet-balance', userId]);
    queryClient.invalidateQueries(['wallet-transactions', userId]);
    queryClient.invalidateQueries(['paymentMethods', userId]);
  }, [userId, queryClient, currentUser?.name]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  // Optional deep link flags from query string - MUST be before early returns
  const params = new URLSearchParams(window.location.search);
  const openBuyTokens = params.get('buyTokens') === '1';
  const preselectPropertyId = params.get('propertyId');

  // Auto-open buy tokens modal from URL parameter
  useEffect(() => {
    if (openBuyTokens) {
      setShowBuyTokens(true);
    }
  }, [openBuyTokens]);
  

  // Fetch wallet balance data (from user_wallets table)
  // Try GET /api/wallet/user/:userId first
  const { data: walletBalanceData, isLoading: walletBalanceLoading, error: walletBalanceError } = useQuery(
    ['wallet-balance', userId],
    () => usersAPI.getWalletById(userId),
    { 
      enabled: !!userId,
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Wallet balance API Success - Full Response:', data);
        console.log('✅ Wallet balance data structure:', {
          data: data?.data,
          dataData: data?.data?.data,
          direct: data
        });
        console.log('Wallet balance data for', currentUser?.name || 'User', ':', data);
      },
      onError: (error) => {
        console.error('❌ Wallet balance API Error:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error URL:', error.config?.url);
        console.warn('Wallet balance API not available:', error.response?.status);
      }
    }
  );
  
  // Fallback: Try current balance endpoint if main endpoint fails
  const { data: currentBalanceData } = useQuery(
    ['wallet-current-balance', userId],
    () => walletTransactionsAPI.getBalance(),
    {
      enabled: !!userId && !!walletBalanceError,
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Current balance fallback success:', data);
      },
      onError: (error) => {
        console.warn('Current balance fallback also failed:', error.response?.status);
      }
    }
  );

  // Fetch wallet transactions (from wallet_transactions table)
  const { data: walletTransactionsData, isLoading: walletTransactionsLoading } = useQuery(
    ['wallet-transactions', userId],
    () => walletTransactionsAPI.getByUserId(userId, { limit: 50 }),
    { 
      enabled: !!userId,
      retry: false,
      onSuccess: (data) => {
        console.log('Wallet transactions data for', currentUser?.name || 'User', ':', data);
      },
      onError: (error) => {
        console.warn('Wallet transactions API not available:', error.response?.status);
      }
    }
  );

  // Fetch payment methods (from payment_methods table)
  const { data: paymentMethodsData, isLoading: paymentMethodsLoading } = useQuery(
    ['paymentMethods', userId],
    () => paymentMethodsAPI.getAll(userId),
    { 
      enabled: !!userId,
      retry: false,
      onError: (error) => {
        console.warn('Payment methods API not available:', error.response?.status);
      }
    }
  );

  // Deposit mutation
  const depositMutation = useMutation((data) => walletTransactionsAPI.createDeposit({ ...data, userId }), {
    onSuccess: () => {
      queryClient.invalidateQueries(['wallet-balance', userId]);
      queryClient.invalidateQueries(['wallet-transactions', userId]);
      setShowDepositModal(false);
      reset();
    },
  });

  // Withdraw mutation
  const withdrawMutation = useMutation((data) => walletTransactionsAPI.createWithdrawal({ ...data, userId }), {
    onSuccess: () => {
      queryClient.invalidateQueries(['wallet-balance', userId]);
      queryClient.invalidateQueries(['wallet-transactions', userId]);
      setShowWithdrawModal(false);
      reset();
    },
  });

  // Add payment method mutation (unused - commented out)
  // const addPaymentMethodMutation = useMutation(paymentMethodsAPI.create, {
  //   onSuccess: () => {
  //     queryClient.invalidateQueries('paymentMethods');
  //     setShowAddPaymentModal(false);
  //     reset();
  //   },
  // });

  // Extract wallet data with fallbacks for different API response formats
  // From user_wallets table: total_balance, available_balance, locked_balance, total_tokens, total_investment, total_returns
  // Also try fallback current balance endpoint
  const wallet = walletBalanceData?.data?.data || 
                 walletBalanceData?.data || 
                 walletBalanceData ||
                 currentBalanceData?.data?.data ||
                 currentBalanceData?.data ||
                 currentBalanceData ||
                 {};
  
  // Extract wallet fields - Backend returns USDT values (matching mobile app)
  // Mobile app uses: usdc, totalValue, totalInvested, totalEarnings
  // Backend wallet returns: balanceUSDT, totalDepositedUSDT, totalWithdrawnUSDT, lockedUSDT
  
  const availableBalance = Number(
    wallet.balanceUSDT || 
    wallet.balanceUSDT?.toString() ||
    wallet.usdc || // Mobile app format
    wallet.availableBalance || 
    wallet.available_balance || 
    wallet.balance ||
    currentBalanceData?.data?.balanceUSDT ||
    currentBalanceData?.data?.usdc ||
    currentBalanceData?.data?.available_balance ||
    currentBalanceData?.data?.availableBalance ||
    0
  ) || 0;
  
  const totalBalance = Number(
    wallet.totalValue || // Mobile app format
    wallet.balanceUSDT || 
    wallet.balanceUSDT?.toString() ||
    wallet.totalBalance || 
    wallet.total_balance ||
    0
  ) || 0;
  
  const lockedBalance = Number(
    wallet.lockedUSDT || 
    wallet.lockedUSDT?.toString() ||
    wallet.lockedBalance || 
    wallet.locked_balance ||
    0
  ) || 0;
  
  const totalTokens = Number(
    wallet.totalTokens || 
    wallet.total_tokens ||
    0
  ) || 0;
  
  const totalInvestment = Number(
    wallet.totalInvested || // Mobile app format
    wallet.totalInvestment || 
    wallet.total_invested || 
    wallet.investedAmount ||
    0
  ) || 0;
  
  const totalReturns = Number(
    wallet.totalEarnings || // Mobile app format (calculated earnings)
    wallet.totalRewardsUSDT ||
    wallet.totalRewardsUSDT?.toString() ||
    wallet.totalReturns || 
    wallet.total_returns || 
    wallet.returns ||
    0
  ) || 0;

  // Extract transactions from wallet_transactions table FIRST (needed for calculations)
  // Fields: id, user_id, payment_method_id, transaction_type, amount, currency, exchange_rate, amount_in_pkr, status, description, reference_id, metadata, created_at
  const transactions = walletTransactionsData?.data?.data || 
                      walletTransactionsData?.data ||
                      (Array.isArray(walletTransactionsData?.data) ? walletTransactionsData.data : []) ||
                      [];
  
  // Calculate totalDeposited and totalWithdrawn from transactions if not in wallet data
  // Transactions use amountUSDT field (matching mobile app)
  const calculateFromTransactions = () => {
    if (!Array.isArray(transactions) || transactions.length === 0) return { deposited: 0, withdrawn: 0 };
    
    const deposited = transactions
      .filter(t => (t.type === 'deposit' || t.transaction_type === 'deposit') && t.status === 'completed')
      .reduce((sum, t) => sum + (Number(t.amountUSDT || t.amountUSDT?.toString() || t.amount || 0)), 0);
    
    const withdrawn = transactions
      .filter(t => (t.type === 'withdrawal' || t.transaction_type === 'withdrawal') && t.status === 'completed')
      .reduce((sum, t) => sum + (Number(t.amountUSDT || t.amountUSDT?.toString() || t.amount || 0)), 0);
    
    return { deposited, withdrawn };
  };
  
  const transactionTotals = calculateFromTransactions();
  
  // Backend returns totalDepositedUSDT and totalWithdrawnUSDT (in USDT, not PKR)
  const totalDeposited = Number(
    wallet.totalDepositedUSDT || 
    wallet.totalDepositedUSDT?.toString() ||
    wallet.totalDeposited || 
    wallet.total_deposited ||
    transactionTotals.deposited ||
    0
  ) || 0;
  
  const totalWithdrawn = Number(
    wallet.totalWithdrawnUSDT || 
    wallet.totalWithdrawnUSDT?.toString() ||
    wallet.totalWithdrawn || 
    wallet.total_withdrawn ||
    transactionTotals.withdrawn ||
    0
  ) || 0;
  
  // Extract payment methods from payment_methods table
  // Fields: id, user_id, card_type, card_number_masked, card_holder_name, expiry_month, expiry_year, currency, is_default, is_verified, status
  const paymentMethods = paymentMethodsData?.data?.data || 
                        paymentMethodsData?.data ||
                        (Array.isArray(paymentMethodsData?.data) ? paymentMethodsData.data : []) ||
                        [];

  // Debug logging
  console.log('Wallet - Full API Response:', walletBalanceData);
  console.log('Wallet - Extracted wallet object:', wallet);
  console.log('Wallet - Available Balance:', availableBalance);
  console.log('Wallet - Total Deposited:', totalDeposited);
  console.log('Wallet - Total Withdrawn:', totalWithdrawn);
  console.log('Wallet - Transactions:', transactions);
  console.log('Wallet - Payment methods:', paymentMethods);

  // Filter transactions by type (deposit, withdrawal, investment, return/reward, fee)
  // Backend uses 'type' field, but also check 'transaction_type' for compatibility
  const filteredTransactions = Array.isArray(transactions) ? transactions.filter(transaction => {
    const txType = transaction.type || transaction.transaction_type;
    if (filter === 'all') return true;
    if (filter === 'deposits') return txType === 'deposit';
    if (filter === 'withdrawals') return txType === 'withdrawal';
    if (filter === 'investments') return txType === 'investment';
    if (filter === 'returns') return txType === 'return' || txType === 'reward' || txType === 'dividend';
    return true;
  }) : [];

  const getTransactionIcon = (transactionType, status) => {
    if (status === 'completed') {
      if (transactionType === 'deposit' || transactionType === 'return' || transactionType === 'reward') return ArrowDownRight;
      if (transactionType === 'investment' || transactionType === 'withdrawal') return ArrowUpRight;
    }
    return Clock;
  };

  const getTransactionColor = (transactionType, status) => {
    if (status === 'completed') {
      if (transactionType === 'deposit' || transactionType === 'return' || transactionType === 'reward') return 'text-green-600';
      if (transactionType === 'investment' || transactionType === 'withdrawal') return 'text-red-600';
    }
    if (status === 'pending') return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': { icon: CheckCircle, color: 'text-green-600 bg-green-100' },
      'pending': { icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
      'failed': { icon: XCircle, color: 'text-red-600 bg-red-100' },
    };
    const statusInfo = statusMap[status] || { icon: Clock, color: 'text-gray-600 bg-gray-100' };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <statusInfo.icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  const onDepositSubmit = (data) => {
    if (!data.paymentMethodId) {
      alert('Please select a payment method');
      return;
    }
    
    if (!data.amount || data.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    // POST /api/wallet-transactions/deposit
    // Request Body: { userId, amount, currency, paymentMethodId, description, provider, action }
    depositMutation.mutate({
      userId: userId,
      amount: parseFloat(data.amount),
      currency: data.currency || 'PKR',
      paymentMethodId: data.paymentMethodId,
      description: data.description || 'Wallet deposit',
    });
  };

  const onWithdrawSubmit = (data) => {
    if (!data.paymentMethodId) {
      alert('Please select a payment method');
      return;
    }
    
    if (!data.amount || data.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    // Check if withdrawal amount exceeds available balance
    if (parseFloat(data.amount) > availableBalance) {
      alert('Insufficient balance. Available: ' + formatCurrency(availableBalance));
      return;
    }
    
    // POST /api/wallet-transactions/withdrawal
    // Request Body: { userId, amount, currency, paymentMethodId, description, metadata }
    withdrawMutation.mutate({
      userId: userId,
      amount: parseFloat(data.amount),
      currency: data.currency || 'PKR',
      paymentMethodId: data.paymentMethodId,
      description: data.description || 'Wallet withdrawal',
      metadata: data.metadata || {},
    });
  };

  // Only show loading if we're actually loading and have no data
  const isLoading = (walletBalanceLoading || walletTransactionsLoading || paymentMethodsLoading) && 
                     !walletBalanceData && !walletTransactionsData && !paymentMethodsData;
  
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading wallet{currentUser?.name ? ` for ${currentUser.name}` : ''}...</p>
                <p className="text-sm text-gray-500 mt-2">User ID: {userId}</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Early return if no user is selected
  if (!currentUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
            <p className="text-gray-600 mt-2">Manage your funds and transaction history</p>
            {walletBalanceError && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Wallet balance could not be loaded. Showing calculated values from transactions.
                </p>
              </div>
            )}
          </div>

          {/* Wallet Summary - from user_wallets table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <WalletIcon className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {availableBalance > 0 ? `$${availableBalance.toFixed(2)}` : '$0.00'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">USDT</p>
                  {walletBalanceError && (
                    <p className="text-xs text-red-500 mt-1">Unable to load balance</p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <ArrowDownRight className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Deposited</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalDeposited > 0 ? `$${totalDeposited.toFixed(2)}` : '$0.00'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">USDT</p>
                  {transactionTotals.deposited > 0 && totalDeposited === transactionTotals.deposited && (
                    <p className="text-xs text-gray-500 mt-1">Calculated from transactions</p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <ArrowUpRight className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Withdrawn</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalWithdrawn > 0 ? `$${totalWithdrawn.toFixed(2)}` : '$0.00'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">USDT</p>
                  {transactionTotals.withdrawn > 0 && totalWithdrawn === transactionTotals.withdrawn && (
                    <p className="text-xs text-gray-500 mt-1">Calculated from transactions</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mb-8">
            {/* Primary Actions */}
            <div className="flex gap-4">
              <Button onClick={() => setShowDepositModal(true)} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Debit Card Deposit
              </Button>
              <Button onClick={() => setShowOnChainDepositModal(true)} className="flex-1 bg-purple-600 hover:bg-purple-700">
                <WalletIcon className="h-4 w-4 mr-2" />
                On-Chain & Third-Party
              </Button>
              <Button onClick={() => setShowWithdrawModal(true)} variant="outline" className="flex-1">
                <Minus className="h-4 w-4 mr-2" />
                Withdraw Funds
              </Button>
            </div>
            
            {/* Secondary Actions */}
            <div className="flex gap-4">
              <Button onClick={() => setShowBuyTokens(true)} className="flex-1 bg-green-600 hover:bg-green-700">
                <WalletIcon className="h-4 w-4 mr-2" />
                Buy Tokens
              </Button>
              <Button onClick={() => setShowAddPaymentModal(true)} variant="outline" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          </div>

          {/* Transaction History */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="deposits">Deposits</option>
                  <option value="withdrawals">Withdrawals</option>
                  <option value="investments">Investments</option>
                  <option value="returns">Dividends</option>
                </select>
              </div>
            </div>

            {filteredTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  const txType = transaction.type || transaction.transaction_type;
                  const IconComponent = getTransactionIcon(txType, transaction.status);
                  
                  // Extract transaction data - Backend uses amountUSDT (matching mobile app)
                  // Fields: amountUSDT, type, status, description, referenceId, metadata
                  const amount = Number(
                    transaction.amountUSDT || 
                    transaction.amountUSDT?.toString() ||
                    transaction.amount || 
                    0
                  );
                  const currency = transaction.currency || 'USDT';
                  const referenceId = transaction.referenceId || transaction.reference_id || '';
                  
                  // Parse metadata (can be string or object)
                  let metadata = {};
                  try {
                    if (typeof transaction.metadata === 'string') {
                      metadata = JSON.parse(transaction.metadata);
                    } else if (transaction.metadata) {
                      metadata = transaction.metadata;
                    }
                  } catch (e) {
                    // Ignore parsing errors
                  }
                  
                  // Check if it's an on-chain or third-party deposit from metadata
                  const isOnChain = metadata.provider || metadata.blockchain;
                  const provider = metadata.provider || metadata.blockchain || '';
                  
                  const getTransactionLabel = (transactionType) => {
                    switch (transactionType) {
                      case 'deposit': 
                        if (provider === 'binance') return 'Binance Pay Deposit';
                        if (provider) return `${provider} Deposit`;
                        return 'Deposit';
                      case 'withdrawal': return 'Withdrawal';
                      case 'investment': return 'Token Purchase';
                      case 'return': 
                      case 'reward':
                        return 'ROI Reward';
                      case 'fee': return 'Fee';
                      default: return 'Transaction';
                    }
                  };
                  
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center flex-1">
                        <IconComponent className={`h-5 w-5 mr-3 ${getTransactionColor(txType, transaction.status)}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {getTransactionLabel(txType)}
                            </p>
                            {isOnChain && (
                              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                {provider}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-gray-400">
                              {new Date(transaction.createdAt || transaction.created_at).toLocaleString()}
                            </p>
                            {referenceId && (
                              <p className="text-xs text-gray-400">
                                Ref: {referenceId}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className={`text-sm font-medium ${getTransactionColor(txType, transaction.status)}`}>
                            {txType === 'deposit' || txType === 'return' || txType === 'reward' ? '+' : '-'}
                            ${amount.toFixed(2)} {currency}
                          </p>
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <WalletIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No transactions found</p>
              </div>
            )}
          </Card>

          {/* Deposit Modal */}
          {showDepositModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md p-6 m-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deposit Funds</h3>
                <form onSubmit={handleSubmit(onDepositSubmit)} className="space-y-4">
                  <Input
                    label="Amount (USDT)"
                    type="number"
                    step="0.01"
                    {...register('amount', { 
                      required: 'Amount is required',
                      min: { value: 1, message: 'Minimum deposit is 1 USDT' }
                    })}
                    error={errors.amount?.message}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      {...register('paymentMethodId', { 
                        required: 'Payment method is required' 
                      })}
                    >
                      <option value="">Select payment method</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.card_type} - {method.card_number_masked}
                        </option>
                      ))}
                    </select>
                    {errors.paymentMethodId && (
                      <p className="text-red-500 text-sm mt-1">{errors.paymentMethodId.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1" disabled={depositMutation.isLoading}>
                      {depositMutation.isLoading ? 'Processing...' : 'Deposit'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowDepositModal(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                  
                </form>
              </Card>
            </div>
          )}

          {/* Withdraw Modal */}
          {showWithdrawModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md p-6 m-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Funds</h3>
                <form onSubmit={handleSubmit(onWithdrawSubmit)} className="space-y-4">
                  <Input
                    label="Amount (USDT)"
                    type="number"
                    step="0.01"
                    {...register('amount', { 
                      required: 'Amount is required',
                      min: { value: 1, message: 'Minimum withdrawal is 1 USDT' },
                      max: { 
                        value: availableBalance || 0, 
                        message: 'Insufficient balance' 
                      }
                    })}
                    error={errors.amount?.message}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      {...register('paymentMethodId', { 
                        required: 'Payment method is required' 
                      })}
                    >
                      <option value="">Select payment method</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.card_type} - {method.card_number_masked}
                        </option>
                      ))}
                    </select>
                    {errors.paymentMethodId && (
                      <p className="text-red-500 text-sm mt-1">{errors.paymentMethodId.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1" disabled={withdrawMutation.isLoading}>
                      {withdrawMutation.isLoading ? 'Processing...' : 'Withdraw'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowWithdrawModal(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                  
                </form>
              </Card>
            </div>
          )}

          {/* On-Chain & Third-Party Deposit Modal */}
          {showOnChainDepositModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="w-full max-w-2xl p-4">
                <OnChainDeposit
                  userId={userId}
                  onDepositSuccess={(data) => {
                    queryClient.invalidateQueries(['wallet-balance', userId]);
                    queryClient.invalidateQueries(['wallet-transactions', userId]);
                    setShowOnChainDepositModal(false);
                  }}
                  onClose={() => setShowOnChainDepositModal(false)}
                />
              </div>
            </div>
          )}

          {/* Buy Tokens Modal */}
          {showBuyTokens && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="w-full max-w-4xl p-4">
                <Card className="max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Buy Property Tokens</h3>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowBuyTokens(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </Button>
                  </div>
                  <BuyTokens 
                    userId={userId} 
                    preselectPropertyId={preselectPropertyId}
                    onPurchaseSuccess={(data) => {
                      queryClient.invalidateQueries(['wallet-balance', userId]);
                      queryClient.invalidateQueries(['wallet-transactions', userId]);
                      setShowBuyTokens(false);
                    }}
                  />
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Wallet;
