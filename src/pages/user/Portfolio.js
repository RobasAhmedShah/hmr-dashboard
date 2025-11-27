import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { TrendingUp, DollarSign, Coins, PieChart, ArrowUpRight, Building2, Trophy, Calendar, Wallet, Clock, Bell } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { portfolioAPI, usersAPI, walletAPI } from '../../services/api';
import Layout from '../../components/Layout/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { formatCurrency, formatPercentage } from '../../utils/formatLocation';
import { useNavigate } from 'react-router-dom';

const Portfolio = () => {
  const { currentUser } = useUser();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Invalidate queries when user changes
  useEffect(() => {
    queryClient.invalidateQueries(['portfolio', userId]);
    queryClient.invalidateQueries(['portfolio-summary', userId]);
    queryClient.invalidateQueries(['profile', userId]);
    queryClient.invalidateQueries(['token-holdings', userId]);
  }, [userId, queryClient]);

  // Fetch detailed portfolio data (includes all investments, rewards, summary)
  const { data: portfolioData, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery(
    ['portfolio-detailed', userId],
    () => portfolioAPI.getPortfolio(userId),
    {
      enabled: !!userId,
      retry: false,
      refetchOnWindowFocus: true,
      onError: (error) => {
        console.warn('Portfolio API not available:', error.response?.status);
      }
    }
  );

  // Extract portfolio data from API response
  const portfolioResponse = portfolioData?.data?.data || portfolioData?.data || {};
  const portfolio = portfolioResponse.portfolio || {};
  const summary = portfolioResponse.summary || {};
  const investments = portfolioResponse.investments || [];
  const rewards = portfolioResponse.rewards || [];

  // Calculate portfolio values from API data (matching mobile app)
  const totalValue = useMemo(() => {
    // Use totalCurrentValueUSDT from summary, or calculate from investments
    const summaryValue = Number(summary.totalCurrentValueUSDT || 0);
    if (summaryValue > 0) return summaryValue;
    
    // Fallback: calculate from investments
    return investments.reduce((sum, inv) => {
      return sum + Number(inv.currentValueUSDT || inv.currentValue || 0);
    }, 0);
  }, [summary, investments]);

  const totalInvested = useMemo(() => {
    // Use totalInvestedUSDT from summary or portfolio
    const summaryInvested = Number(summary.totalInvestedUSDT || portfolio.totalInvestedUSDT || 0);
    if (summaryInvested > 0) return summaryInvested;
    
    // Fallback: calculate from investments
    return investments.reduce((sum, inv) => {
      return sum + Number(inv.amountInvestedUSDT || inv.investedAmount || 0);
    }, 0);
  }, [summary, portfolio, investments]);

  const totalEarnings = useMemo(() => {
    return totalValue - totalInvested;
  }, [totalValue, totalInvested]);

  const totalROI = useMemo(() => {
    if (totalInvested === 0) return 0;
    return ((totalEarnings / totalInvested) * 100);
  }, [totalEarnings, totalInvested]);

  // Calculate monthly rental income from rewards (average monthly)
  const monthlyRentalIncome = useMemo(() => {
    // Sum all rewards and divide by 12 to get monthly average
    const totalRewards = Number(summary.totalRewardsUSDT || portfolio.totalRewardsUSDT || 0);
    // If we have rewards, estimate monthly income (rough estimate: total rewards / 12)
    if (totalRewards > 0 && investments.length > 0) {
      return totalRewards / 12; // Rough monthly estimate
    }
    // Fallback: calculate from investments' expected ROI
    return investments.reduce((sum, inv) => {
      const invested = Number(inv.amountInvestedUSDT || 0);
      const roi = Number(inv.expectedROI || 0);
      return sum + (invested * roi / 100 / 12); // Monthly income from ROI
    }, 0);
  }, [summary, portfolio, investments]);

  const thisMonthEarnings = monthlyRentalIncome * 1.12; // 12% growth (matching mobile app)
  const nextPayoutDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  // Find best performing property
  const bestProperty = useMemo(() => {
    if (investments.length === 0) return null;
    return investments.reduce((best, current) => {
      const currentROI = Number(current.expectedROI || 0);
      const bestROI = Number(best?.expectedROI || 0);
      return currentROI > bestROI ? current : best;
    }, investments[0]);
  }, [investments]);

  // Debug logging
  console.log('Portfolio - Portfolio data:', portfolio);
  console.log('Portfolio - Summary data:', summary);
  console.log('Portfolio - Investments:', investments);


  // Only show loading if we have no data at all
  const isLoading = portfolioLoading && !portfolioData;
  
  if (isLoading) { 
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 bg-muted rounded"></div>
                ))}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header - Matching Mobile App */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Total Portfolio Value</span>
              </div>
              <button
                onClick={() => navigate('/notifications?context=portfolio')}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative"
              >
                <Bell className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-4xl font-bold text-gray-900">
                ${totalValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h1>
              <div className="px-3 py-1.5 rounded-full bg-green-100 flex items-center">
                <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm font-semibold text-green-600">
                  +{totalROI.toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-right">
              ${monthlyRentalIncome.toFixed(2)} Monthly Rental Income
            </p>
          </div>

          {/* Overview Cards - Matching Mobile App */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Total Earnings Card */}
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <span className="px-2 py-1 text-xs font-semibold bg-green-200 text-green-700 rounded">
                    All Time
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </Card>

              {/* This Month Card */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                    +12%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${thisMonthEarnings.toFixed(2)}
                </p>
              </Card>

              {/* Total Invested Card */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Total Invested</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </Card>

              {/* Next Payout Card */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Next Payout</p>
                <p className="text-lg font-bold text-gray-900">
                  {nextPayoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ~${monthlyRentalIncome.toFixed(2)}
                </p>
              </Card>
            </div>
          </div>

          {/* Performance Summary - Matching Mobile App */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Performance Summary</h2>
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center mb-3">
                <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm font-semibold text-gray-900">Monthly Highlights</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Monthly Return</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${monthlyRentalIncome.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Best Performer</span>
                  <span className="text-sm font-semibold text-green-600 truncate max-w-[200px]">
                    {bestProperty?.property?.title || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Properties</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {investments.length}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Your Properties Section - Matching Mobile App */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Properties</h2>
            {investments.length > 0 ? (
              <div className="space-y-4">
                {investments.map((investment) => {
                  const currentValue = Number(investment.currentValueUSDT || 0);
                  const investedAmount = Number(investment.amountInvestedUSDT || 0);
                  const tokens = Number(investment.tokensPurchased || 0);
                  const gainLoss = currentValue - investedAmount;
                  const gainLossPercentage = investedAmount > 0 ? (gainLoss / investedAmount) * 100 : 0;
                  
                  return (
                    <Card key={investment.investmentId || investment.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{investment.property?.title || 'Property'}</h3>
                          <p className="text-sm text-gray-600">
                            {investment.property?.city || ''}, {investment.property?.country || ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Current Value</p>
                          <p className="font-semibold text-gray-900">
                            ${currentValue.toFixed(2)}
                          </p>
                          <Button 
                            as="a" 
                            href={`/wallet?buyTokens=1&propertyId=${investment.property?.id}`} 
                            className="mt-2 bg-green-600 hover:bg-green-700 py-1 px-3 text-sm"
                          >
                            Invest
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Tokens</p>
                          <p className="font-medium">{tokens.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Invested</p>
                          <p className="font-medium">${investedAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Gain/Loss</p>
                          <p className={`font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${gainLoss.toFixed(2)} ({gainLossPercentage.toFixed(2)}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">ROI</p>
                          <p className="font-medium">{Number(investment.expectedROI || 0).toFixed(2)}%</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start building your portfolio by investing in property tokens.
                </p>
                <Button as="a" href="/wallet?buyTokens=1">
                  View Properties
                </Button>
              </Card>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Portfolio;
