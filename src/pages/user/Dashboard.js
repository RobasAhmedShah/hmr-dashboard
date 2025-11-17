import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { 
  TrendingUp, 
  DollarSign, 
  Building2, 
  PieChart, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Shield,
  CreditCard,
  Coins,
  Bell,
  User,
  Calendar,
  Mail,
  Phone,
  Target,
  Award,
  BarChart3
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PropertyCard from '../../components/PropertyCard';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { 
  portfolioAPI, 
  usersAPI, 
  investmentsAPI, 
  propertiesAPI,
  walletTransactionsAPI,
  walletAPI,
  paymentMethodsAPI,
  rewardsAPI,
  kycAPI,
  adminAPI
} from '../../services/api';
import { formatCurrency, formatPercentage } from '../../utils/formatLocation';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  // Try multiple ways to get user ID
  const userId = currentUser?.id || currentUser?.userId || currentUser?.displayCode || currentUser?.email;
  const queryClient = useQueryClient();

  // Debug logging
  useEffect(() => {
    console.log('🔍 Dashboard - Current User:', currentUser);
    console.log('🔍 Dashboard - User ID:', userId);
    console.log('🔍 Dashboard - User Email:', currentUser?.email);
    
    // If no userId but we have email, try to find user by email
    if (!userId && currentUser?.email) {
      console.warn('⚠️ No user ID found, but email exists:', currentUser.email);
    }
  }, [currentUser, userId]);
  
  // Fallback: Try to get user by email if ID doesn't work
  const userEmail = currentUser?.email;
  const fallbackUserId = userId || userEmail;

  const handleInvest = (property) => {
    navigate(`/wallet?buyTokens=1&propertyId=${property.id}`);
  };

  // Invalidate queries when user changes
  useEffect(() => {
    console.log('User changed to:', currentUser?.name, 'ID:', userId);
    queryClient.invalidateQueries(['portfolio', userId]);
    queryClient.invalidateQueries(['portfolio-summary', userId]);
    queryClient.invalidateQueries(['profile', userId]);
    queryClient.invalidateQueries(['investments', userId]);
    queryClient.invalidateQueries(['wallet', userId]);
    queryClient.invalidateQueries(['transactions', userId]);
    queryClient.invalidateQueries(['featured-properties']);
    queryClient.invalidateQueries(['holdings', userId]);
    queryClient.invalidateQueries(['payment-methods', userId]);
    queryClient.invalidateQueries(['kyc-status', userId]);
    queryClient.invalidateQueries(['notifications', userId]);
    queryClient.invalidateQueries(['rewards', userId]);
    queryClient.invalidateQueries(['investment-analytics', userId]);
    queryClient.invalidateQueries(['kyc-verification', userId]);
  }, [userId, queryClient, currentUser?.name]);

  // Fetch dashboard data with error handling
  const { data: portfolioData, isLoading: portfolioLoading } = useQuery(
    ['portfolio', userId, userEmail],
    () => {
      const portfolioUserId = userId || userEmail;
      return portfolioAPI.getPortfolio(portfolioUserId);
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Portfolio API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Portfolio API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  const { isLoading: summaryLoading } = useQuery(
    ['portfolioSummary', userId, userEmail],
    () => {
      const summaryUserId = userId || userEmail;
      return portfolioAPI.getSummary(summaryUserId);
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Portfolio Summary API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Portfolio Summary API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  const { data: profileData, isLoading: profileLoading } = useQuery(
    ['profile', userId, userEmail],
    () => {
      // Try with userId first, then email as fallback
      if (userId) {
        return usersAPI.getProfileById(userId);
      } else if (userEmail) {
        return usersAPI.getProfileById(userEmail);
      }
      throw new Error('No user ID or email available');
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Profile API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Profile API Error:', error.response?.status, error.response?.data || error.message);
        // Try alternative endpoint
        if (userEmail && !userId) {
          console.log('🔄 Trying alternative profile fetch...');
        }
      }
    }
  );

  const { data: investmentsData } = useQuery(
    ['investments', userId, userEmail],
    () => {
      const investmentsUserId = userId || userEmail;
      return investmentsAPI.getByUserId(investmentsUserId);
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Investments API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Investments API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  // Fetch wallet data
  const { data: walletData } = useQuery(
    ['wallet', userId, userEmail],
    () => {
      const walletUserId = userId || userEmail;
      return usersAPI.getWalletById(walletUserId);
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Wallet API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Wallet API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  // Fetch holdings
  const { data: holdingsData } = useQuery(
    ['holdings', userId, userEmail],
    () => {
      const holdingsUserId = userId || userEmail;
      return walletAPI.getHoldings(holdingsUserId);
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Holdings API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Holdings API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  // Fetch payment methods
  const { data: paymentMethodsData } = useQuery(
    ['payment-methods', userId, userEmail],
    () => {
      const pmUserId = userId || userEmail;
      return paymentMethodsAPI.getAll(pmUserId);
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Payment Methods API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Payment Methods API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  // Fetch KYC status
  const { data: kycStatusData } = useQuery(
    ['kyc-status', userId, userEmail],
    () => {
      const kycUserId = userId || userEmail;
      return kycAPI.getStatus(kycUserId);
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ KYC Status API Success:', data);
      },
      onError: (error) => {
        console.error('❌ KYC Status API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  // Fetch KYC verification details (full KYC data)
  const { data: kycVerificationData } = useQuery(
    ['kyc-verification', userId, userEmail],
    () => {
      const kycUserId = userId || userEmail;
      return adminAPI.getUserKYC(kycUserId);
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ KYC Verification API Success:', data);
      },
      onError: (error) => {
        console.error('❌ KYC Verification API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  // Fetch notifications
  const { data: notificationsData } = useQuery(
    ['notifications', userId, userEmail],
    () => usersAPI.getNotifications(),
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Notifications API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Notifications API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  // Fetch rewards
  const { data: rewardsData } = useQuery(
    ['rewards', userId, userEmail],
    () => {
      const rewardsUserId = userId || userEmail;
      return rewardsAPI.getByUserId(rewardsUserId);
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Rewards API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Rewards API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  // Fetch investment analytics
  const { data: investmentAnalyticsData } = useQuery(
    ['investment-analytics', userId, userEmail],
    () => {
      const analyticsUserId = userId || userEmail;
      return investmentsAPI.getUserAnalytics(analyticsUserId);
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Investment Analytics API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Investment Analytics API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  const { data: recentTransactions } = useQuery(
    ['recentTransactions', userId, userEmail],
    () => {
      const transactionsUserId = userId || userEmail;
      return walletTransactionsAPI.getByUserId(transactionsUserId, { limit: 5 });
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      onSuccess: (data) => {
        console.log('✅ Transactions API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Transactions API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  const { data: featuredProperties, isError: featuredError } = useQuery(
    'featuredProperties',
    () => propertiesAPI.getFeatured(),
    {
      retry: false,
      onError: (error) => {
        console.warn('Featured properties API not available:', error.response?.status);
      }
    }
  );

  // Fallback query for featured properties if main query fails
  const { data: fallbackProperties } = useQuery(
    'featuredPropertiesFallback',
    () => propertiesAPI.getAll({ featured: true, limit: 6 }),
    {
      enabled: featuredError && !featuredProperties,
      retry: false,
      onError: (error) => {
        console.warn('Fallback properties API also failed:', error.response?.status);
      }
    }
  );

  const { data: statsData, refetch: refetchStats } = useQuery(
    ['portfolio-stats', userId, userEmail],
    () => {
      const statsUserId = userId || userEmail;
      return portfolioAPI.getStats(statsUserId);
    },
    { 
      enabled: !!(userId || userEmail),
      retry: false,
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: true,
      onSuccess: (data) => {
        console.log('✅ Portfolio Stats API Success:', data);
      },
      onError: (error) => {
        console.error('❌ Portfolio Stats API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
  );

  // Extract portfolio data with extensive fallbacks
  const portfolio = portfolioData?.data?.data || portfolioData?.data?.portfolio || portfolioData?.data || portfolioData?.portfolio || portfolioData || {};
  console.log('📊 Portfolio Data:', portfolio);
  
  // Extract profile data with extensive fallbacks - prioritize currentUser data
  const profile = profileData?.data?.data || profileData?.data?.user || profileData?.data || profileData?.user || profileData || currentUser || {};
  console.log('👤 Profile Data:', profile);
  
  // Extract investments with extensive fallbacks
  const investments = investmentsData?.data?.data?.investments || 
                      investmentsData?.data?.investments || 
                      investmentsData?.data?.data || 
                      investmentsData?.investments || 
                      investmentsData?.data || 
                      (Array.isArray(investmentsData?.data) ? investmentsData.data : []) || 
                      (Array.isArray(investmentsData) ? investmentsData : []) || 
                      [];
  console.log('💼 Investments Data:', investments);
  
  // Extract transactions with extensive fallbacks
  const transactions = recentTransactions?.data?.data?.transactions || 
                       recentTransactions?.data?.transactions || 
                       recentTransactions?.data?.data || 
                       recentTransactions?.transactions || 
                       recentTransactions?.data || 
                       (Array.isArray(recentTransactions?.data) ? recentTransactions.data : []) || 
                       (Array.isArray(recentTransactions) ? recentTransactions : []) || 
                       [];
  console.log('💳 Transactions Data:', transactions);
  
  // Handle multiple response formats for featured properties, with fallback
  const properties = featuredProperties?.data?.data?.properties || 
                     featuredProperties?.data?.properties || 
                     featuredProperties?.properties || 
                     featuredProperties?.data?.data || 
                     (Array.isArray(featuredProperties?.data) ? featuredProperties.data : []) || 
                     // Fallback to getAll if featured endpoint failed
                     fallbackProperties?.data?.data?.properties ||
                     fallbackProperties?.data?.properties ||
                     fallbackProperties?.properties ||
                     fallbackProperties?.data?.data ||
                     (Array.isArray(fallbackProperties?.data) ? fallbackProperties.data : []) ||
                     [];
  
  // Extract stats with fallbacks
  const userStats = statsData?.data?.data || statsData?.data?.stats || statsData?.data || statsData?.stats || statsData || {};
  console.log('📈 Stats Data:', userStats);
  
  // Extract wallet data with extensive fallbacks
  const wallet = walletData?.data?.data || walletData?.data?.wallet || walletData?.data || walletData?.wallet || walletData || {};
  console.log('💰 Wallet Data:', wallet);
  
  const availableBalance = Number(
    wallet.availableBalance || 
    wallet.available_balance || 
    wallet.balance || 
    wallet.availableBalancePKR || 
    wallet.available_balance_pkr ||
    portfolio.availableBalance ||
    0
  ) || 0;
  
  const totalInvested = Number(
    wallet.totalInvested || 
    wallet.total_invested || 
    wallet.totalInvestment || 
    wallet.investedAmount || 
    wallet.total_investment ||
    portfolio.totalInvested ||
    portfolio.totalInvestment ||
    userStats.totalInvestment ||
    0
  ) || 0;
  
  const totalReturns = Number(
    wallet.totalReturns || 
    wallet.total_returns || 
    wallet.totalReturnsPKR || 
    wallet.returns || 
    wallet.total_returns_pkr ||
    portfolio.totalReturns ||
    userStats.totalReturns ||
    0
  ) || 0;
  
  // Extract holdings with extensive fallbacks
  const holdings = holdingsData?.data?.data || holdingsData?.data?.holdings || holdingsData?.data || holdingsData?.holdings || holdingsData || {};
  console.log('🪙 Holdings Data:', holdings);
  
  const totalTokens = Number(
    holdings.totalTokens || 
    holdings.total_tokens || 
    holdings.summary?.total_tokens || 
    holdings.summary?.totalTokens ||
    portfolio.totalTokens ||
    0
  ) || 0;
  
  // Extract payment methods with extensive fallbacks
  const paymentMethods = paymentMethodsData?.data?.data || 
                         paymentMethodsData?.data?.paymentMethods || 
                         paymentMethodsData?.data || 
                         paymentMethodsData?.paymentMethods || 
                         (Array.isArray(paymentMethodsData?.data) ? paymentMethodsData.data : []) || 
                         (Array.isArray(paymentMethodsData) ? paymentMethodsData : []) || 
                         [];
  console.log('💳 Payment Methods Data:', paymentMethods);
  
  // Extract KYC status with extensive fallbacks
  const kycStatus = kycStatusData?.data?.data?.status || 
                    kycStatusData?.data?.status || 
                    kycStatusData?.status || 
                    profile.kycStatus || 
                    profile.kyc_status || 
                    profile.kyc?.status || 
                    currentUser?.kycStatus ||
                    'pending';
  console.log('🛡️ KYC Status:', kycStatus);
  
  // Extract KYC verification details
  const kycVerification = kycVerificationData?.data?.data || 
                          kycVerificationData?.data?.kyc || 
                          kycVerificationData?.data || 
                          kycVerificationData?.kyc || 
                          kycVerificationData || 
                          {};
  console.log('🛡️ KYC Verification Data:', kycVerification);
  
  // Extract notifications with extensive fallbacks
  const notifications = notificationsData?.data?.data || 
                        notificationsData?.data?.notifications || 
                        notificationsData?.data || 
                        notificationsData?.notifications || 
                        (Array.isArray(notificationsData?.data) ? notificationsData.data : []) || 
                        (Array.isArray(notificationsData) ? notificationsData : []) || 
                        [];
  const unreadNotifications = notifications.filter(n => !n.read || n.read === false).length;
  console.log('🔔 Notifications Data:', notifications);
  
  // Extract rewards with extensive fallbacks
  const rewards = rewardsData?.data?.data || 
                  rewardsData?.data?.rewards || 
                  rewardsData?.data || 
                  rewardsData?.rewards || 
                  (Array.isArray(rewardsData?.data) ? rewardsData.data : []) || 
                  (Array.isArray(rewardsData) ? rewardsData : []) || 
                  [];
  const totalRewards = rewards.reduce((sum, reward) => sum + (Number(reward.amount || reward.value || 0) || 0), 0);
  console.log('🏆 Rewards Data:', rewards);
  
  // Extract investment analytics with extensive fallbacks
  const analytics = investmentAnalyticsData?.data?.data || 
                    investmentAnalyticsData?.data?.analytics || 
                    investmentAnalyticsData?.data || 
                    investmentAnalyticsData?.analytics || 
                    investmentAnalyticsData || 
                    {};
  console.log('📊 Analytics Data:', analytics);


  // Show loading only if we're actually loading critical data
  const isLoading = portfolioLoading || summaryLoading || profileLoading;
  
  if (isLoading && !portfolioData && !profileData) {
    return (
      <Layout>
        <div className="min-h-screen bg-background py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading dashboard for {currentUser?.name}...</p>
                <p className="text-sm text-muted-foreground mt-2">User ID: {userId}</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }


  const stats = [
    {
      name: 'Total Investment',
      value: formatCurrency(userStats.totalInvestment || portfolio.totalInvestment || totalInvested || 0),
      change: userStats.totalInvestmentChange !== undefined ? 
        `${userStats.totalInvestmentChange >= 0 ? '+' : ''}${userStats.totalInvestmentChange}%` : '+0%',
      changeType: userStats.totalInvestmentChange > 0 ? 'positive' : userStats.totalInvestmentChange < 0 ? 'negative' : 'neutral',
      icon: DollarSign,
    },
    {
      name: 'Current Value',
      value: formatCurrency(userStats.currentValue || portfolio.currentValue || (totalInvested + totalReturns) || 0),
      change: userStats.currentValueChange !== undefined ? 
        `${userStats.currentValueChange >= 0 ? '+' : ''}${userStats.currentValueChange}%` : '+0%',
      changeType: userStats.currentValueChange > 0 ? 'positive' : userStats.currentValueChange < 0 ? 'negative' : 'neutral',
      icon: TrendingUp,
    },
    {
      name: 'Total ROI',
      value: formatPercentage(userStats.totalROI || portfolio.totalROI || (totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0) || 0),
      change: userStats.totalROIChange !== undefined ? 
        `${userStats.totalROIChange >= 0 ? '+' : ''}${userStats.totalROIChange}%` : '+0%',
      changeType: userStats.totalROIChange > 0 ? 'positive' : userStats.totalROIChange < 0 ? 'negative' : 'neutral',
      icon: PieChart,
    },
    {
      name: 'Active Investments',
      value: (userStats.activeInvestments || investments.length || analytics.activeInvestments || 0).toString(),
      change: userStats.activeInvestmentsChange !== undefined ? 
        `${userStats.activeInvestmentsChange >= 0 ? '+' : ''}${userStats.activeInvestmentsChange}` : '+0',
      changeType: userStats.activeInvestmentsChange > 0 ? 'positive' : userStats.activeInvestmentsChange < 0 ? 'negative' : 'neutral',
      icon: Building2,
    },
  ];

  // Early return if no user is selected
  if (!currentUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading user data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background dark:bg-[#010408] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-[#e9eff5]">
                Welcome back, {profile.firstName || profile.first_name || profile.name || currentUser?.firstName || currentUser?.name || 'User'}!
              </h1>
              <p className="text-muted-foreground dark:text-[#7b8186] mt-2">
                Here's an overview of your investment portfolio
              </p>
            </div>
            <Button 
              onClick={() => {
                refetchStats();
                queryClient.invalidateQueries();
              }} 
              variant="outline"
              className="ml-4"
            >
              Refresh Stats
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.name} className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <p className="text-2xl font-semibold text-[#e9eff5]">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      {stat.changeType === 'positive' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
                  <p className="text-2xl font-semibold text-[#e9eff5]">{formatCurrency(availableBalance)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Available to invest</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Coins className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                  <p className="text-2xl font-semibold text-[#e9eff5]">{totalTokens.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Token holdings</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Rewards</p>
                  <p className="text-2xl font-semibold text-[#e9eff5]">{formatCurrency(totalRewards)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{rewards.length} rewards earned</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">KYC Status</p>
                  <div className="mt-1">
                    <Badge variant={
                      kycStatus === 'verified' ? 'success' : 
                      kycStatus === 'pending' ? 'warning' : 
                      kycStatus === 'rejected' ? 'danger' : 'default'
                    }>
                      {kycStatus === 'verified' ? 'Verified' : 
                       kycStatus === 'pending' ? 'Pending' : 
                       kycStatus === 'rejected' ? 'Rejected' : 'Not Submitted'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* User Profile Quick Info */}
          <Card className="p-6 mb-8 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#e9eff5]">Profile Information</h2>
              <Button as={Link} to="/profile" variant="outline" size="sm">
                Edit Profile
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="text-sm font-medium text-foreground">
                    {profile.name || 
                     profile.fullName || 
                     profile.full_name ||
                     `${profile.firstName || profile.first_name || ''} ${profile.lastName || profile.last_name || ''}`.trim() || 
                     currentUser?.name || 
                     currentUser?.fullName ||
                     `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
                     'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile.email || currentUser?.email || 'N/A'}
                  </p>
                </div>
              </div>
              {profile.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground">{profile.phone}</p>
                  </div>
                </div>
              )}
              {(profile.createdAt || profile.created_at) && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(profile.createdAt || profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Wallet Details */}
          <Card className="p-6 mb-8 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#e9eff5]">Wallet Details</h2>
              <Button as={Link} to="/wallet" variant="outline" size="sm">
                View Wallet
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#080f18] border border-[#0e171f] rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-[#e9eff5]">{formatCurrency(availableBalance)}</p>
              </div>
              <div className="p-4 bg-[#080f18] border border-[#0e171f] rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Invested</p>
                <p className="text-2xl font-bold text-[#e9eff5]">{formatCurrency(totalInvested)}</p>
              </div>
              <div className="p-4 bg-[#080f18] border border-[#0e171f] rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Returns</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalReturns)}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Portfolio Overview */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#e9eff5]">Portfolio Overview</h2>
                  <Button as={Link} to="/portfolio" variant="outline">
                    View All
                  </Button>
                </div>
                
                {investments.length > 0 ? (
                  <div className="space-y-4">
                    {investments.slice(0, 5).map((investment) => {
                      const amount = investment.amountUSDT || investment.amount || investment.investmentAmount || investment.currentValue || 0;
                      const tokens = investment.tokensPurchased || investment.tokensToBuy || investment.tokens_purchased || 0;
                      const roi = investment.roiPercentage || investment.roi || 0;
                      
                      return (
                        <div key={investment.id} className="flex items-center justify-between p-4 bg-[#080f18] border border-[#0e171f] rounded-lg hover:bg-[#0a121b] transition-colors">
                          <div className="flex items-center flex-1">
                            <div className="flex-shrink-0">
                              <Building2 className="h-8 w-8 text-primary" />
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#e9eff5] truncate">
                                {investment.property?.title || investment.propertyName || 'Property'}
                              </p>
                              <div className="flex items-center space-x-3 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {investment.property?.location || investment.location || 'Location'}
                                </p>
                                {tokens > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    • {tokens.toLocaleString()} tokens
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-medium text-[#e9eff5]">
                              {formatCurrency(amount)}
                            </p>
                            {roi > 0 && (
                              <p className="text-sm text-green-400">
                                {formatPercentage(roi)} ROI
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No investments yet</p>
                    <Button as={Link} to="/properties">
                      Start Investing
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Recent Activity & Notifications */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#e9eff5]">Recent Activity</h2>
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => {
                      const amount = transaction.amountUSDT || transaction.amount || 0;
                      const type = transaction.type || transaction.transactionType || 'deposit';
                      const date = transaction.createdAt || transaction.created_at || transaction.date;
                      
                      return (
                        <div key={transaction.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full ${
                              type === 'deposit' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div className="ml-3">
                            <p className="text-sm font-medium text-[#e9eff5] capitalize">
                              {type === 'deposit' ? 'Deposit' : type === 'withdrawal' ? 'Withdrawal' : type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {date ? new Date(date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm font-medium ${
                          type === 'deposit' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {type === 'deposit' ? '+' : '-'}{formatCurrency(amount)}
                        </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </Card>

              {/* Notifications */}
              <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold text-[#e9eff5]">Notifications</h2>
                    {unreadNotifications > 0 && (
                      <Badge variant="danger" className="ml-2">{unreadNotifications}</Badge>
                    )}
                  </div>
                </div>
                
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`p-3 rounded-lg border ${
                        notification.read ? 'bg-[#080f18] border-[#0e171f]' : 'bg-primary/10 border-primary/30'
                      }`}>
                        <p className="text-sm font-medium text-[#e9eff5]">
                          {notification.title || notification.message || 'Notification'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.createdAt || notification.created_at ? 
                            new Date(notification.createdAt || notification.created_at).toLocaleDateString() : 
                            'Recently'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* All User Tables Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* KYC Verification Details */}
            <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#e9eff5]">KYC Verification</h2>
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              
              {kycVerification && Object.keys(kycVerification).length > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-[#e9eff5]">Status</p>
                      <Badge variant={
                        kycVerification.status === 'verified' ? 'success' : 
                        kycVerification.status === 'pending' ? 'warning' : 
                        kycVerification.status === 'rejected' ? 'danger' : 'default'
                      }>
                        {kycVerification.status || kycStatus || 'Pending'}
                      </Badge>
                    </div>
                    {kycVerification.submittedAt && (
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(kycVerification.submittedAt || kycVerification.submitted_at || kycVerification.createdAt || kycVerification.created_at).toLocaleDateString()}
                      </p>
                    )}
                    {kycVerification.verifiedAt && (
                      <p className="text-xs text-muted-foreground">
                        Verified: {new Date(kycVerification.verifiedAt || kycVerification.verified_at).toLocaleDateString()}
                      </p>
                    )}
                    {kycVerification.rejectionReason && (
                      <p className="text-xs text-red-400 mt-1">
                        Reason: {kycVerification.rejectionReason}
                      </p>
                    )}
                  </div>
                  {(kycVerification.documents || kycVerification.documentUrls) && (
                    <div className="p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Documents</p>
                      <p className="text-sm text-[#e9eff5]">
                        {kycVerification.documents?.length || kycVerification.documentUrls?.length || 0} document(s) uploaded
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No KYC verification submitted</p>
                  <Badge variant="warning" className="text-xs">{kycStatus || 'Pending'}</Badge>
                </div>
              )}
            </Card>

            {/* Payment Methods */}
            <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#e9eff5]">Payment Methods</h2>
                <Button as={Link} to="/wallet" variant="outline" size="sm">
                  Manage
                </Button>
              </div>
              
              {paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.slice(0, 3).map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-[#e9eff5]">
                            {method.type || method.paymentType || 'Payment Method'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {method.last4 ? `****${method.last4}` : method.accountNumber ? `****${method.accountNumber.slice(-4)}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {method.isDefault && (
                        <Badge variant="default" className="text-xs">Default</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No payment methods added</p>
                  <Button as={Link} to="/wallet" size="sm">
                    Add Payment Method
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Detailed Data Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

            {/* Investment Analytics */}
            <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#e9eff5]">Investment Analytics</h2>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Investments</p>
                    <p className="text-lg font-bold text-[#e9eff5]">
                      {analytics.totalInvestments || investments.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Active Investments</p>
                    <p className="text-lg font-bold text-[#e9eff5]">
                      {analytics.activeInvestments || investments.filter(inv => inv.status === 'active' || inv.status === 'Active').length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Average ROI</p>
                    <p className="text-lg font-bold text-green-400">
                      {analytics.averageROI ? formatPercentage(analytics.averageROI) : 
                       investments.length > 0 ? 
                         formatPercentage(investments.reduce((sum, inv) => sum + (Number(inv.roiPercentage || inv.roi || 0) || 0), 0) / investments.length) : 
                         '0%'}
                    </p>
                  </div>
                  <div className="p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Tokens</p>
                    <p className="text-lg font-bold text-[#e9eff5]">
                      {totalTokens.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* All Tables Summary */}
            <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#e9eff5]">Data Summary</h2>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-[#e9eff5]">Investments</span>
                  </div>
                  <Badge variant="default">{investments.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-[#e9eff5]">KYC Verifications</span>
                  </div>
                  <Badge variant={kycStatus === 'verified' ? 'success' : 'warning'}>
                    {kycVerification && Object.keys(kycVerification).length > 0 ? '1' : '0'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-[#e9eff5]">Payment Methods</span>
                  </div>
                  <Badge variant="default">{paymentMethods.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-[#e9eff5]">Portfolios</span>
                  </div>
                  <Badge variant="default">{portfolio && Object.keys(portfolio).length > 0 ? '1' : '0'}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-[#e9eff5]">Rewards</span>
                  </div>
                  <Badge variant="default">{rewards.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-[#e9eff5]">Transactions</span>
                  </div>
                  <Badge variant="default">{transactions.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#080f18] border border-[#0e171f] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-[#e9eff5]">Wallets</span>
                  </div>
                  <Badge variant="default">{wallet && Object.keys(wallet).length > 0 ? '1' : '0'}</Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Featured Properties */}
          {properties.length > 0 && (
            <div className="mt-8">
              <Card className="p-6 bg-[#02080f] border-[#0e171f] dark:bg-[#02080f] dark:border-[#0e171f]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#e9eff5]">Featured Properties</h2>
                  <Button as={Link} to="/properties" variant="outline">
                    View All
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.slice(0, 3).map((property) => (
                    <PropertyCard key={property.id} property={property} onInvest={handleInvest} />
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

