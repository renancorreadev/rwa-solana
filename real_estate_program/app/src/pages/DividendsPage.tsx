import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Wallet, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DividendStats,
  DividendCalendar,
  PropertyYieldCard,
  DividendHistoryTable,
  UpcomingDistributions,
} from '@/components/dividends';
import * as dividendsApi from '@/services/api/dividends';
import { useNavigate } from 'react-router-dom';

export const DividendsPage: FC = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 10;

  // Fetch dividend stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dividendStats', publicKey?.toString()],
    queryFn: () => dividendsApi.getDividendStats(publicKey!.toString()),
    enabled: !!publicKey,
    retry: 1,
  });

  // Fetch calendar data
  const {
    data: calendar,
    isLoading: calendarLoading,
  } = useQuery({
    queryKey: ['dividendCalendar', publicKey?.toString()],
    queryFn: () => dividendsApi.getDividendCalendar(publicKey!.toString()),
    enabled: !!publicKey,
    retry: 1,
  });

  // Fetch property yields
  const {
    data: yields,
    isLoading: yieldsLoading,
  } = useQuery({
    queryKey: ['propertyYields', publicKey?.toString()],
    queryFn: () => dividendsApi.getPropertyYields(publicKey!.toString()),
    enabled: !!publicKey,
    retry: 1,
  });

  // Fetch claim history
  const {
    data: historyData,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ['claimHistory', publicKey?.toString(), historyPage],
    queryFn: () => dividendsApi.getClaimHistory(publicKey!.toString(), historyPage, historyLimit),
    enabled: !!publicKey,
    retry: 1,
  });

  // Fetch upcoming distributions
  const {
    data: upcoming,
    isLoading: upcomingLoading,
  } = useQuery({
    queryKey: ['upcomingDistributions'],
    queryFn: () => dividendsApi.getUpcomingDistributions(10),
    retry: 1,
  });

  const handleRefresh = () => {
    refetchStats();
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={<Wallet className="w-12 h-12" />}
          title={t('common.connectWallet')}
          description={t('errors.walletNotConnected')}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('dividends.title')}</h1>
          <p className="text-solana-dark-300 mt-1">
            {t('dividends.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('dividends.update')}
          </Button>
          <Button
            onClick={() => navigate('/revenue')}
            className="flex items-center gap-2"
          >
            {t('dividends.makeClaim')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8">
        <DividendStats stats={stats} isLoading={statsLoading} />
      </div>

      {/* Calendar */}
      <div className="mb-8">
        <DividendCalendar
          pastClaims={calendar?.pastClaims || []}
          upcomingDistributions={calendar?.upcomingDistributions || []}
          isLoading={calendarLoading}
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Property Yields */}
        <PropertyYieldCard yields={yields || []} isLoading={yieldsLoading} />

        {/* Upcoming Distributions */}
        <UpcomingDistributions
          distributions={upcoming || []}
          isLoading={upcomingLoading}
        />
      </div>

      {/* History Table */}
      <div className="mb-8">
        <DividendHistoryTable
          claims={historyData?.claims || []}
          total={historyData?.total || 0}
          page={historyPage}
          limit={historyLimit}
          hasMore={historyData?.hasMore || false}
          isLoading={historyLoading}
          onPageChange={setHistoryPage}
        />
      </div>
    </div>
  );
};
