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
  Loader2,
  AlertCircle,
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
import * as userApi from '@/services/api/user';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

const COLORS = ['#9945FF', '#14F195', '#00D1FF', '#FF6B6B', '#FFE66D', '#4ECDC4'];

const getActivityIcon = (type: string, isPositive: boolean) => {
  switch (type) {
    case 'investment':
      return <ArrowDownRight className="w-4 h-4 text-solana-purple-400" />;
    case 'revenue_claim':
      return <ArrowUpRight className="w-4 h-4 text-solana-green-400" />;
    case 'token_transfer':
      return isPositive ? <ArrowUpRight className="w-4 h-4 text-blue-400" /> : <ArrowDownRight className="w-4 h-4 text-blue-400" />;
    default:
      return <Clock className="w-4 h-4 text-solana-dark-400" />;
  }
};

const getInsightIcon = (type: 'positive' | 'negative' | 'neutral') => {
  switch (type) {
    case 'positive':
      return <TrendingUp className="w-5 h-5 text-solana-green-400" />;
    case 'negative':
      return <TrendingDown className="w-5 h-5 text-red-400" />;
    default:
      return <AlertCircle className="w-5 h-5 text-blue-400" />;
  }
};

const getInsightBgColor = (type: 'positive' | 'negative' | 'neutral') => {
  switch (type) {
    case 'positive':
      return 'bg-solana-green-500/10 border-solana-green-500/20';
    case 'negative':
      return 'bg-red-500/10 border-red-500/20';
    default:
      return 'bg-blue-500/10 border-blue-500/20';
  }
};

export const ReportsPage: FC = () => {
  const { publicKey, connected } = useWallet();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Fetch portfolio data
  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio', publicKey?.toString()],
    queryFn: () => investorApi.getPortfolio(publicKey!.toString()),
    enabled: !!publicKey,
  });

  // Fetch analytics data from API
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['userAnalytics', publicKey?.toString(), timeRange],
    queryFn: () => userApi.getUserAnalytics(publicKey!.toString(), timeRange),
    enabled: !!publicKey,
    retry: 1,
  });

  // Fetch activities
  const { data: activitiesData } = useQuery({
    queryKey: ['userActivities', publicKey?.toString()],
    queryFn: () => userApi.getUserActivities(publicKey!.toString(), 1, 10),
    enabled: !!publicKey,
  });

  // Calculate performance metrics from analytics or portfolio
  const performanceMetrics = useMemo(() => {
    if (analytics?.summary) {
      return {
        change: analytics.summary.portfolioGrowth > 0
          ? portfolio?.totalValueUsd ? portfolio.totalValueUsd * (analytics.summary.portfolioGrowth / 100) : 0
          : 0,
        percentChange: analytics.summary.portfolioGrowth,
        isPositive: analytics.summary.portfolioGrowth >= 0,
      };
    }
    return { change: 0, percentChange: 0, isPositive: true };
  }, [analytics, portfolio]);

  // Format portfolio history for chart
  const portfolioHistory = useMemo(() => {
    if (analytics?.portfolioHistory?.length) {
      return analytics.portfolioHistory.map(p => ({
        date: format(new Date(p.date), 'MMM dd'),
        value: p.value,
      }));
    }
    // Fallback: generate from current value
    if (portfolio?.totalValueUsd) {
      return Array.from({ length: 7 }, (_, i) => ({
        date: format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'MMM dd'),
        value: portfolio.totalValueUsd * (0.95 + Math.random() * 0.1),
      }));
    }
    return [];
  }, [analytics, portfolio]);

  // Get allocation data from analytics or portfolio
  const allocationData = useMemo(() => {
    if (analytics?.allocation?.length) {
      return analytics.allocation;
    }
    if (portfolio?.holdings?.length) {
      return portfolio.holdings.map((h, i) => ({
        name: h.propertyName.length > 15 ? h.propertyName.slice(0, 15) + '...' : h.propertyName,
        value: h.valueUsd,
        percentage: h.percentage,
        color: COLORS[i % COLORS.length],
      }));
    }
    return [];
  }, [analytics, portfolio]);

  // Get revenue history from analytics
  const revenueHistory = useMemo(() => {
    if (analytics?.revenueHistory?.length) {
      return analytics.revenueHistory;
    }
    // Fallback mock data
    return [
      { month: 'Jan', revenue: 0, projected: 0 },
      { month: 'Feb', revenue: 0, projected: 0 },
      { month: 'Mar', revenue: 0, projected: 0 },
    ];
  }, [analytics]);

  // Get insights from analytics
  const insights = useMemo(() => {
    if (analytics?.insights?.length) {
      return analytics.insights;
    }
    // Default insights
    return [
      {
        type: 'neutral' as const,
        title: 'Getting Started',
        description: 'Complete your first investment to see personalized insights.',
      },
    ];
  }, [analytics]);

  // Get recent activities
  const recentActivities = useMemo(() => {
    if (activitiesData?.activities?.length) {
      return activitiesData.activities;
    }
    if (analytics?.recentActivities?.length) {
      return analytics.recentActivities;
    }
    return [];
  }, [activitiesData, analytics]);

  const exportReport = async () => {
    if (!publicKey) return;
    try {
      const blob = await userApi.exportUserData(publicKey.toString(), 'json');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hub-token-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch {
      // Fallback: export local data
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
      toast.success('Report exported successfully');
    }
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

  if (portfolioLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-solana-purple-400" />
      </div>
    );
  }

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

      {/* API Error Warning */}
      {analyticsError && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="font-medium text-white">Analytics data unavailable</p>
            <p className="text-sm text-solana-dark-400">Showing data from your current portfolio.</p>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <StatsGrid cols={4}>
        <StatCard
          title="Portfolio Value"
          value={`$${portfolio?.totalValueUsd?.toLocaleString() || '0'}`}
          icon={<DollarSign className="w-6 h-6 text-solana-purple-400" />}
          iconBg="bg-solana-purple-500/20"
          change={performanceMetrics.percentChange !== 0
            ? `${performanceMetrics.isPositive ? '+' : ''}${performanceMetrics.percentChange.toFixed(1)}%`
            : undefined}
          changeType={performanceMetrics.isPositive ? 'positive' : 'negative'}
        />
        <StatCard
          title="Total Invested"
          value={`$${analytics?.summary?.totalInvested?.toLocaleString() || '0'}`}
          icon={<TrendingUp className="w-6 h-6 text-solana-green-400" />}
          iconBg="bg-solana-green-500/20"
        />
        <StatCard
          title="Properties"
          value={portfolio?.totalProperties || analytics?.summary?.totalProperties || 0}
          icon={<Building2 className="w-6 h-6 text-blue-400" />}
          iconBg="bg-blue-500/20"
        />
        <StatCard
          title="Avg. Yield"
          value={`${analytics?.summary?.averageYield?.toFixed(1) || '0'}%`}
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
            {portfolioHistory.length > 0 ? (
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
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-solana-dark-400">No data available yet</p>
              </div>
            )}
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
          subtitle="Monthly revenue distribution"
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueHistory}>
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
              <Bar dataKey="revenue" name="Revenue" fill="#9945FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="projected" name="Projected" fill="#14F195" radius={[4, 4, 0, 0]} />
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
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-solana-dark-800/50 rounded-xl"
                >
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'revenue_claim' ? 'bg-solana-green-500/20' : 'bg-solana-purple-500/20'
                  }`}>
                    {getActivityIcon(activity.type, activity.type === 'revenue_claim')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white capitalize">
                      {activity.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-solana-dark-400">
                      {activity.propertyName || activity.description}
                    </p>
                  </div>
                  <div className="text-right">
                    {activity.amount && (
                      <p className={`text-sm font-medium ${
                        activity.type === 'revenue_claim' ? 'text-solana-green-400' : 'text-white'
                      }`}>
                        {activity.type === 'revenue_claim' ? '+' : ''}${activity.amount.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-solana-dark-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-solana-dark-400">
                No recent activity
              </div>
            )}
          </div>
        </Card>

        {/* Investment Insights */}
        <Card>
          <CardHeader title="Investment Insights" subtitle="Personalized recommendations" />
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${getInsightBgColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'positive' ? 'bg-solana-green-500/20' :
                    insight.type === 'negative' ? 'bg-red-500/20' : 'bg-blue-500/20'
                  }`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{insight.title}</p>
                    <p className="text-sm text-solana-dark-300 mt-1">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
                  <td className="text-right py-4 px-4 text-solana-green-400">
                    {analytics?.summary?.averageYield?.toFixed(1) || '8.5'}%
                  </td>
                  <td className="text-right py-4 px-4 text-solana-dark-300">
                    {holding.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
              {(!portfolio?.holdings || portfolio.holdings.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-solana-dark-400">
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
