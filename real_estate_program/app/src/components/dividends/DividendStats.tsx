import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, Calendar, Wallet } from 'lucide-react';
import { StatCard, StatsGrid } from '@/components/ui/Stats';
import { InvestorDividendStats } from '@/services/api/dividends';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface DividendStatsProps {
  stats: InvestorDividendStats | undefined;
  isLoading: boolean;
}

export const DividendStats: FC<DividendStatsProps> = ({ stats, isLoading }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? ptBR : enUS;

  const formatCurrency = (value: number, currency: 'SOL' | 'BRL' = 'BRL') => {
    if (currency === 'SOL') {
      return `${value.toFixed(4)} SOL`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), "dd MMM", { locale: dateLocale });
    } catch {
      return '-';
    }
  };

  return (
    <StatsGrid cols={4}>
      <StatCard
        title={t('dividends.totalReceived')}
        value={isLoading ? '-' : formatCurrency(stats?.totalClaimedBrl || 0)}
        subtitle={isLoading ? '' : `${(stats?.totalClaimedSol || 0).toFixed(4)} SOL`}
        icon={<DollarSign className="w-5 h-5 text-solana-purple-400" />}
        iconBg="bg-solana-purple-500/20"
      />
      <StatCard
        title={t('dividends.avgMonthlyYield')}
        value={isLoading ? '-' : formatCurrency(stats?.averageMonthlyYield || 0, 'SOL')}
        subtitle={t('dividends.lastMonths')}
        icon={<TrendingUp className="w-5 h-5 text-solana-green-400" />}
        iconBg="bg-solana-green-500/20"
      />
      <StatCard
        title={t('dividends.totalClaims')}
        value={isLoading ? '-' : String(stats?.totalClaims || 0)}
        subtitle={stats?.lastClaimDate ? `${t('dividends.lastClaim')}: ${formatDate(stats.lastClaimDate)}` : t('dividends.noClaims')}
        icon={<Wallet className="w-5 h-5 text-blue-400" />}
        iconBg="bg-blue-500/20"
      />
      <StatCard
        title={t('dividends.nextPayment')}
        value={stats?.nextDistribution ? formatDate(stats.nextDistribution.date) : '-'}
        subtitle={stats?.nextDistribution?.propertyName || t('dividends.awaitingSchedule')}
        icon={<Calendar className="w-5 h-5 text-cyan-400" />}
        iconBg="bg-cyan-500/20"
      />
    </StatsGrid>
  );
};
