import { FC, useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Wallet,
  Building2,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard, StatsGrid } from '@/components/ui/Stats';
import { PageLoading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { investorApi, propertiesApi } from '@/services/api';
import { format, subDays, subMonths } from 'date-fns';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

const COLORS = ['#9945FF', '#14F195', '#00D1FF', '#FF6B6B', '#FFE66D', '#4ECDC4'];

// Generate mock historical data for demo
const generateHistoricalData = (days: number, baseValue: number) => {
  const data = [];
  let value = baseValue * 0.7;
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const change = (Math.random() - 0.4) * (baseValue * 0.05);
    value = Math.max(value + change, baseValue * 0.5);
    data.push({
      date: format(date, 'MMM dd'),
      value: Math.round(value * 100) / 100,
      revenue: Math.round(Math.random() * 500 * 100) / 100,
    });
  }
  return data;
};

// Generate mock revenue distribution data
const generateRevenueByProperty = (holdings: any[]) => {
  return holdings.map((h, i) => ({
    name: h.propertyName.length > 15 ? h.propertyName.slice(0, 15) + '...' : h.propertyName,
    value: h.valueUsd,
    color: COLORS[i % COLORS.length],
  }));
};

export const ReportsPage: FC = () => {
  const { publicKey, connected } = useWallet();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio', publicKey?.toString()],
    queryFn: () => investorApi.getPortfolio(publicKey!.toString()),
    enabled: !!publicKey,
  });

  const { data: _properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll(),
  });

  // Calculate time range in days
  const daysInRange = useMemo(() => {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      case 'all': return 365;
      default: return 30;
    }
  }, [timeRange]);

  // Generate chart data based on portfolio
  const portfolioHistory = useMemo(() => {
    if (!portfolio) return [];
    return generateHistoricalData(daysInRange, portfolio.totalValueUsd);
  }, [portfolio, daysInRange]);

  // Portfolio allocation data
  const allocationData = useMemo(() => {
    if (!portfolio?.holdings?.length) return [];
    return generateRevenueByProperty(portfolio.holdings);
  }, [portfolio]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!portfolioHistory.length) return { change: 0, percentChange: 0, isPositive: true };
    const firstValue = portfolioHistory[0]?.value || 0;
    const lastValue = portfolioHistory[portfolioHistory.length - 1]?.value || 0;
    const change = lastValue - firstValue;
    const percentChange = firstValue > 0 ? (change / firstValue) * 100 : 0;
    return {
      change: Math.round(change * 100) / 100,
      percentChange: Math.round(percentChange * 100) / 100,
      isPositive: change >= 0,
    };
  }, [portfolioHistory]);

  // Monthly revenue data
  const monthlyRevenueData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, 'MMM'),
        revenue: Math.round(Math.random() * 2000 + 500),
        claimed: Math.round(Math.random() * 1500 + 300),
      });
    }
    return months;
  }, []);

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      wallet: publicKey?.toString(),
      timeRange,
      portfolio: {
        totalValue: portfolio?.totalValueUsd,
        totalProperties: portfolio?.totalProperties,
        holdings: portfolio?.holdings,
      },
      performance: performanceMetrics,
      historicalData: portfolioHistory,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hub-token-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!connected) {
    return (
      <EmptyState
        icon={<Wallet className="w-10 h-10" />}
        title="Connect Your Wallet"
        description="Connect your Solana wallet to view your investment reports and analytics."
      />
    );
  }

  if (portfolioLoading) return <PageLoading />;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-solana-purple-400" />
            Reports & Analytics
          </h1>
          <p className="text-solana-dark-400 mt-1">Track your investment performance and insights</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Filter */}
          <div className="flex items-center gap-1 bg-solana-dark-800/50 rounded-xl p-1">
            {(['7d', '30d', '90d', '1y', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-solana-purple-500 text-white'
                    : 'text-solana-dark-400 hover:text-white'
                }`}
              >
                {range === 'all' ? 'All' : range.toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={exportReport}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <StatsGrid cols={4}>
        <StatCard
          title="Portfolio Value"
          value={`$${portfolio?.totalValueUsd?.toLocaleString() || '0'}`}
          icon={<DollarSign className="w-6 h-6 text-solana-purple-400" />}
          iconBg="bg-solana-purple-500/20"
          change={performanceMetrics.isPositive ? `+${performanceMetrics.percentChange}%` : `${performanceMetrics.percentChange}%`}
          changeType={performanceMetrics.isPositive ? 'positive' : 'negative'}
        />
        <StatCard
          title="Period Change"
          value={`${performanceMetrics.isPositive ? '+' : ''}$${performanceMetrics.change.toLocaleString()}`}
          icon={performanceMetrics.isPositive ? (
            <TrendingUp className="w-6 h-6 text-solana-green-400" />
          ) : (
            <TrendingDown className="w-6 h-6 text-red-400" />
          )}
          iconBg={performanceMetrics.isPositive ? "bg-solana-green-500/20" : "bg-red-500/20"}
        />
        <StatCard
          title="Properties"
          value={portfolio?.totalProperties || 0}
          icon={<Building2 className="w-6 h-6 text-blue-400" />}
          iconBg="bg-blue-500/20"
        />
        <StatCard
          title="Avg. Yield"
          value="8.5%"
          icon={<Percent className="w-6 h-6 text-yellow-400" />}
          iconBg="bg-yellow-500/20"
          subtitle="Annual"
        />
      </StatsGrid>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Value Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Portfolio Value Over Time"
            subtitle={`Last ${timeRange === 'all' ? 'year' : timeRange}`}
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9945FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9945FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#9945FF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Portfolio Allocation */}
        <Card>
          <CardHeader title="Portfolio Allocation" subtitle="By property" />
          <div className="h-80">
            {allocationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-solana-dark-300 text-sm">{value}</span>}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-solana-dark-400">No holdings to display</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Revenue Analysis */}
      <Card>
        <CardHeader
          title="Revenue Analysis"
          subtitle="Monthly revenue distribution and claims"
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-solana-dark-300 text-sm capitalize">{value}</span>
                )}
              />
              <Bar dataKey="revenue" name="Total Revenue" fill="#9945FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="claimed" name="Claimed" fill="#14F195" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Activity & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader title="Recent Activity" subtitle="Your latest transactions" />
          <div className="space-y-3">
            {[
              { type: 'claim', property: 'Downtown Plaza', amount: '+0.5 SOL', time: '2 hours ago', positive: true },
              { type: 'invest', property: 'Sunset Apartments', amount: '-2.0 SOL', time: '1 day ago', positive: false },
              { type: 'claim', property: 'Tech Hub Office', amount: '+0.3 SOL', time: '3 days ago', positive: true },
              { type: 'transfer', property: 'Marina View', amount: '100 tokens', time: '5 days ago', positive: false },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-solana-dark-800/50 rounded-xl"
              >
                <div className={`p-2 rounded-lg ${activity.positive ? 'bg-solana-green-500/20' : 'bg-solana-purple-500/20'}`}>
                  {activity.positive ? (
                    <ArrowUpRight className="w-4 h-4 text-solana-green-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-solana-purple-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white capitalize">{activity.type}</p>
                  <p className="text-xs text-solana-dark-400">{activity.property}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${activity.positive ? 'text-solana-green-400' : 'text-white'}`}>
                    {activity.amount}
                  </p>
                  <p className="text-xs text-solana-dark-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Investment Insights */}
        <Card>
          <CardHeader title="Investment Insights" subtitle="AI-powered recommendations" />
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-solana-purple-500/10 to-solana-green-500/10 rounded-xl border border-solana-purple-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-solana-purple-500/20">
                  <TrendingUp className="w-5 h-5 text-solana-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Diversification Opportunity</p>
                  <p className="text-sm text-solana-dark-300 mt-1">
                    Your portfolio is concentrated in residential properties. Consider adding commercial real estate for better diversification.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-solana-green-500/10 rounded-xl border border-solana-green-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-solana-green-500/20">
                  <DollarSign className="w-5 h-5 text-solana-green-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Unclaimed Revenue</p>
                  <p className="text-sm text-solana-dark-300 mt-1">
                    You have unclaimed revenue waiting. Visit the Revenue page to claim your earnings.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Upcoming Distribution</p>
                  <p className="text-sm text-solana-dark-300 mt-1">
                    Next revenue distribution is scheduled in 5 days. Make sure your KYC is up to date.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Property Performance Table */}
      <Card>
        <CardHeader
          title="Property Performance"
          subtitle="Individual property metrics"
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-solana-dark-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-solana-dark-400">Property</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-solana-dark-400">Value</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-solana-dark-400">Tokens</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-solana-dark-400">Yield</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-solana-dark-400">Allocation</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-solana-dark-400">Performance</th>
              </tr>
            </thead>
            <tbody>
              {portfolio?.holdings?.map((holding, index) => (
                <tr key={holding.propertyMint} className="border-b border-solana-dark-800/50 hover:bg-solana-dark-800/30">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium text-white">{holding.propertyName}</p>
                        <p className="text-xs text-solana-dark-400">{holding.propertySymbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4 text-white">${holding.valueUsd.toLocaleString()}</td>
                  <td className="text-right py-4 px-4 text-solana-dark-300">
                    {Number(holding.balance).toLocaleString()}
                  </td>
                  <td className="text-right py-4 px-4 text-solana-green-400">8.5%</td>
                  <td className="text-right py-4 px-4 text-solana-dark-300">
                    {holding.percentage.toFixed(1)}%
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className="inline-flex items-center gap-1 text-solana-green-400">
                      <ArrowUpRight className="w-4 h-4" />
                      +{(Math.random() * 10 + 2).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {(!portfolio?.holdings || portfolio.holdings.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-solana-dark-400">
                    No holdings to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
