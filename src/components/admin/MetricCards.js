import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ label, value, change, trend, description, subtext }) => {
  const isPositive = trend === 'up';

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <h3 className="text-3xl font-bold text-card-foreground mt-1">{value}</h3>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
            isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{change}</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-card-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </div>
    </div>
  );
};

const MetricCards = ({ stats }) => {
  // Calculate metrics from stats or use defaults
  const metrics = [
    {
      label: 'Total Investment',
      value: stats?.totalInvestmentVolume 
        ? `$${parseFloat(stats.totalInvestmentVolume).toLocaleString()}` 
        : '$1,250.00',
      change: '+12%',
      trend: 'up',
      description: 'Trending up this month',
      subtext: 'Investment volume for last 6 months',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() || '1,234',
      change: stats?.userGrowth || '+8%',
      trend: stats?.userGrowth?.includes('-') ? 'down' : 'up',
      description: stats?.userGrowth?.includes('-') ? 'Down this period' : 'Growing steadily',
      subtext: 'User registration trend',
    },
    {
      label: 'Active Properties',
      value: stats?.totalProperties?.toLocaleString() || '45',
      change: '+12.5%',
      trend: 'up',
      description: 'Strong property growth',
      subtext: 'Listed properties available',
    },
    {
      label: 'ROI Rate',
      value: stats?.averageROI || '4.5%',
      change: '+4.5%',
      trend: 'up',
      description: 'Steady performance',
      subtext: 'Meets growth projections',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default MetricCards;

