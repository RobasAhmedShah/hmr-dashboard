import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminAPI } from '../../services/api';
import { Activity } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const InvestmentChart = ({ data, stats }) => {
  const { theme } = useTheme();
  
  // Fetch investments from API
  const { data: investmentsData, isLoading, error } = useQuery(
    'all-investments',
    () => adminAPI.getInvestments(),
    { 
      refetchInterval: 60000,
      retry: 1,
    }
  );

  // Helpers to coerce various backend shapes into { date, value }
  const parseAmount = (raw) => {
    if (raw == null) return 0;
    if (typeof raw === 'number') return raw;
    // Remove currency/units and handle K/M suffixes
    const str = String(raw).trim().replace(/[^0-9.\-kKmM]/g, '');
    const mult = /m$/i.test(str) ? 1_000_000 : /k$/i.test(str) ? 1_000 : 1;
    const num = parseFloat(str.replace(/[kKmM]/g, ''));
    return isNaN(num) ? 0 : num * mult;
  };

  const coerceDateKey = (obj) => {
    const d = obj.date || obj.day || obj.investmentDate || obj.createdAt || obj.created_at || obj.timestamp || obj.time;
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const coerceValue = (obj) => {
    // Try common amount fields
    const candidate = obj.value ?? obj.amount ?? obj.volume ?? obj.total ?? obj.totalVolume ?? obj.sum ?? 0;
    return parseAmount(candidate);
  };

  const normalizeDataset = (dataset) => {
    if (!Array.isArray(dataset)) return [];
    // If already looks normalized (has date + value numbers), keep but coerce
    const looksNormalized = dataset.every((x) => x && (x.date || x.createdAt || x.investmentDate));
    if (looksNormalized) {
      const grouped = {};
      dataset.forEach((item) => {
        const key = coerceDateKey(item);
        if (!key) return;
        if (!grouped[key]) grouped[key] = { date: key, value: 0, value2: 0, count: 0 };
        const v = coerceValue(item);
        grouped[key].value += v;
        grouped[key].value2 += v * 0.7;
        grouped[key].count += 1;
      });
      return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return [];
  };

  // Process investments data for the chart
  const chartData = useMemo(() => {
    console.log('📊 Processing chart data...');
    console.log('Prop data:', data);
    console.log('API data:', investmentsData);
    
    // 1) Prefer provided prop if it can be normalized
    if (Array.isArray(data) && data.length > 0) {
      const normalized = normalizeDataset(data);
      if (normalized.length > 0) {
        console.log('✅ Using normalized prop data:', normalized.length);
        return normalized.slice(-30);
      }
    }

    // 2) Else process investments from API
    const investments = investmentsData?.data?.data?.investments || investmentsData?.data?.investments || investmentsData?.data || [];
    console.log('💰 Investments found:', investments?.length || 0);
    
    // Try to normalize direct dataset (maybe already time-series)
    const normalizedFromApi = normalizeDataset(investments);
    if (normalizedFromApi.length > 0) {
      console.log('✅ Using normalized API investments:', normalizedFromApi.length);
      return normalizedFromApi.slice(-30);
    }

    if (!investments || investments.length === 0) {
      console.log('⚠️ No investments found, using sample data');
      // Return sample data if no investments
      return [
        { date: 'Oct 15', value: 45000, value2: 31500 },
        { date: 'Oct 17', value: 48000, value2: 33600 },
        { date: 'Oct 19', value: 52000, value2: 36400 },
        { date: 'Oct 21', value: 58000, value2: 40600 },
        { date: 'Oct 23', value: 65000, value2: 45500 },
        { date: 'Oct 25', value: 72000, value2: 50400 },
        { date: 'Oct 27', value: 80000, value2: 56000 },
        { date: 'Oct 29', value: 90000, value2: 63000 },
        { date: 'Oct 31', value: 105000, value2: 73500 },
        { date: 'Nov 2', value: 120000, value2: 84000 },
        { date: 'Nov 4', value: 135000, value2: 94500 },
        { date: 'Nov 6', value: 150000, value2: 105000 },
        { date: 'Nov 8', value: 169703, value2: 118792 },
      ];
    }

    console.log('🔄 Processing investments into chart data...');
    console.log('Sample investment:', investments[0]);

    // 3) Try to coerce generic arrays of objects (unknown shape)
    const coerced = normalizeDataset(investments);
    const result = coerced.length > 0 ? coerced.slice(-30) : [];
    
    console.log('✅ Chart data processed:', result.length, 'points');
    console.log('Sample point:', result[0]);
    console.log('Total investment value:', result.reduce((sum, point) => sum + point.value, 0));
    
    return result;
  }, [data, investmentsData]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading investment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center py-20 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Unable to load investment data</p>
          <p className="text-xs mt-2">Using sample data for demonstration</p>
        </div>
      </div>
    );
  }

  // Theme-aware colors
  const tooltipBg = theme === 'dark' ? '#02080f' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#0e171f' : '#e2e8f0';
  const tooltipText = theme === 'dark' ? '#e9eff5' : '#0f172a';
  const gridColor = theme === 'dark' ? '#0e171f' : '#e2e8f0';
  const axisColor = theme === 'dark' ? '#7b8186' : '#64748b';

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-card-foreground">Total Investment Volume</h3>
          <p className="text-sm text-muted-foreground">Total for the last 6 months</p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <button className="hover:text-card-foreground transition">Last 6 months</button>
          <button className="hover:text-card-foreground transition">Last 30 days</button>
          <button className="hover:text-card-foreground transition">Last 7 days</button>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1175c5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1175c5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#40c8ff" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#40c8ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke={axisColor} 
              style={{ fontSize: '12px' }} 
            />
            <YAxis 
              stroke={axisColor} 
              style={{ fontSize: '12px' }} 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '0.625rem',
                color: tooltipText,
              }}
              labelStyle={{ color: tooltipText }}
              itemStyle={{ color: tooltipText }}
              cursor={{ fill: 'rgba(0, 166, 255, 0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#0899f8" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
            <Area 
              type="monotone" 
              dataKey="value2" 
              stroke="#40c8ff" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue2)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InvestmentChart;
