import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, ArrowRight, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScheduledDistribution } from '@/services/api/dividends';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface UpcomingDistributionsProps {
  distributions: ScheduledDistribution[];
  isLoading: boolean;
}

export const UpcomingDistributions: FC<UpcomingDistributionsProps> = ({
  distributions,
  isLoading,
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? ptBR : enUS;

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTimeDistance = (dateStr: string) => {
    try {
      const distance = formatDistanceToNow(new Date(dateStr), {
        locale: dateLocale,
      });
      return `${t('dividends.inTime')} ${distance}`;
    } catch {
      return '';
    }
  };

  const renderHeader = (showAction?: boolean) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-solana-purple-500/20">
          <Calendar className="w-5 h-5 text-solana-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">{t('dividends.upcomingDistributions')}</h3>
      </div>
      {showAction && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/revenue')}
          className="text-solana-purple-400 hover:text-solana-purple-300"
        >
          {t('dividends.viewClaims')}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        {renderHeader()}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-solana-dark-600/50 rounded-lg">
              <div className="w-12 h-12 bg-solana-dark-400/50 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-solana-dark-400/50 rounded" />
                <div className="h-3 w-20 bg-solana-dark-400/30 rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!distributions || distributions.length === 0) {
    return (
      <Card>
        {renderHeader()}
        <div className="text-center py-8 text-solana-dark-300">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('dividends.noDistributions')}</p>
          <p className="text-sm text-solana-dark-400 mt-1">
            {t('dividends.distributionsAnnounced')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {renderHeader(true)}
      <div className="divide-y divide-solana-dark-600">
        {distributions.map((dist) => (
          <div
            key={dist.id}
            className="p-4 hover:bg-solana-dark-600/30 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Date badge */}
              <div className="flex-shrink-0 w-14 h-14 bg-solana-purple-500/20 rounded-lg flex flex-col items-center justify-center border border-solana-purple-500/30">
                <span className="text-xs text-solana-purple-400 uppercase">
                  {format(new Date(dist.scheduledDate), 'MMM', { locale: dateLocale })}
                </span>
                <span className="text-lg font-bold text-white">
                  {format(new Date(dist.scheduledDate), 'd')}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-solana-dark-400" />
                  <h4 className="font-medium text-white truncate">
                    {dist.propertyName || dist.propertyMint.substring(0, 16) + '...'}
                  </h4>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-solana-green-400">
                    {dist.estimatedAmountSol
                      ? `~${dist.estimatedAmountSol.toFixed(4)} SOL`
                      : t('dividends.amountTbd')}
                  </span>
                  {dist.estimatedAmountBrl && (
                    <span className="text-sm text-solana-dark-400">
                      ({formatCurrency(dist.estimatedAmountBrl)})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-3 h-3 text-solana-dark-400" />
                  <span className="text-xs text-solana-dark-400">
                    {getTimeDistance(dist.scheduledDate)}
                  </span>
                  {dist.notes && (
                    <>
                      <span className="text-solana-dark-500">|</span>
                      <span className="text-xs text-solana-dark-400 truncate">
                        {dist.notes}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  dist.status === 'scheduled'
                    ? 'bg-solana-purple-500/20 text-solana-purple-400'
                    : dist.status === 'deposited'
                    ? 'bg-solana-green-500/20 text-solana-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {dist.status === 'scheduled'
                    ? t('dividends.scheduled')
                    : dist.status === 'deposited'
                    ? t('admin.deposited')
                    : t('admin.cancelled')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
