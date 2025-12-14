import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarEntry } from '@/services/api/dividends';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface DividendCalendarProps {
  pastClaims: CalendarEntry[];
  upcomingDistributions: CalendarEntry[];
  isLoading: boolean;
}

interface MonthData {
  month: Date;
  label: string;
  claims: CalendarEntry[];
  scheduled: CalendarEntry[];
  totalSol: number;
  totalBrl: number;
  isPast: boolean;
  isCurrent: boolean;
}

export const DividendCalendar: FC<DividendCalendarProps> = ({
  pastClaims,
  upcomingDistributions,
  isLoading,
}) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? ptBR : enUS;

  const months = useMemo(() => {
    const now = new Date();
    const start = subMonths(startOfMonth(now), 5);
    const end = addMonths(endOfMonth(now), 6);

    const monthsRange = eachMonthOfInterval({ start, end });

    return monthsRange.map((month): MonthData => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const currentMonth = startOfMonth(now);

      // Filter claims for this month
      const monthClaims = pastClaims.filter(c => {
        const claimDate = new Date(c.date);
        return claimDate >= monthStart && claimDate <= monthEnd;
      });

      // Filter scheduled for this month
      const monthScheduled = upcomingDistributions.filter(s => {
        const schedDate = new Date(s.date);
        return schedDate >= monthStart && schedDate <= monthEnd;
      });

      return {
        month,
        label: format(month, 'MMM', { locale: dateLocale }),
        claims: monthClaims,
        scheduled: monthScheduled,
        totalSol: monthClaims.reduce((sum, c) => sum + (c.amountSol || 0), 0),
        totalBrl: monthClaims.reduce((sum, c) => sum + (c.amountBrl || 0), 0),
        isPast: month < currentMonth,
        isCurrent: month.getTime() === currentMonth.getTime(),
      };
    });
  }, [pastClaims, upcomingDistributions, dateLocale]);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$${(value / 1000).toFixed(1)}k`;
    }
    return `R$${value.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-solana-purple-500/20">
            <Clock className="w-5 h-5 text-solana-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">{t('dividends.calendarTitle')}</h3>
        </div>
        <div className="px-0">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-20 animate-pulse">
                <div className="h-4 bg-solana-dark-400/50 rounded mb-2" />
                <div className="h-12 bg-solana-dark-400/30 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-solana-purple-500/20">
          <Clock className="w-5 h-5 text-solana-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">{t('dividends.calendarTitle')}</h3>
      </div>
      <div className="p-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-solana-dark-400 scrollbar-track-transparent">
          {months.map((monthData) => (
            <div
              key={monthData.month.toISOString()}
              className={`flex-shrink-0 w-20 text-center ${
                monthData.isCurrent ? 'ring-2 ring-solana-purple-500 rounded-lg' : ''
              }`}
            >
              <div className={`text-xs font-medium mb-2 uppercase ${
                monthData.isCurrent
                  ? 'text-solana-purple-400'
                  : monthData.isPast
                  ? 'text-solana-dark-400'
                  : 'text-solana-dark-300'
              }`}>
                {monthData.label}
              </div>

              <div className={`rounded-lg p-2 transition-all ${
                monthData.claims.length > 0
                  ? 'bg-solana-green-500/20 border border-solana-green-500/30'
                  : monthData.scheduled.length > 0
                  ? 'bg-solana-purple-500/20 border border-solana-purple-500/30'
                  : 'bg-solana-dark-600/50 border border-solana-dark-500/30'
              }`}>
                {/* Status indicator */}
                <div className="flex justify-center mb-1">
                  {monthData.claims.length > 0 ? (
                    <CheckCircle className="w-5 h-5 text-solana-green-400" />
                  ) : monthData.scheduled.length > 0 ? (
                    <Clock className="w-5 h-5 text-solana-purple-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-dashed border-solana-dark-400" />
                  )}
                </div>

                {/* Amount */}
                <div className={`text-xs font-medium ${
                  monthData.claims.length > 0
                    ? 'text-solana-green-400'
                    : monthData.scheduled.length > 0
                    ? 'text-solana-purple-400'
                    : 'text-solana-dark-500'
                }`}>
                  {monthData.claims.length > 0
                    ? formatCurrency(monthData.totalBrl)
                    : monthData.scheduled.length > 0
                    ? t('dividends.scheduled')
                    : '-'}
                </div>
              </div>

              {/* Properties count */}
              {(monthData.claims.length > 0 || monthData.scheduled.length > 0) && (
                <div className="text-xs text-solana-dark-400 mt-1">
                  {monthData.claims.length > 0
                    ? `${monthData.claims.length} ${t('dividends.claims')}`
                    : `${monthData.scheduled.length} ${t('dividends.prop')}`}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-solana-dark-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-solana-green-400" />
            <span className="text-xs text-solana-dark-300">{t('dividends.received')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-solana-purple-400" />
            <span className="text-xs text-solana-dark-300">{t('dividends.scheduled')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-dashed border-solana-dark-400" />
            <span className="text-xs text-solana-dark-300">{t('dividends.noPayment')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
