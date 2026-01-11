import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { History, ExternalLink, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClaimHistory } from '@/services/api/dividends';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface DividendHistoryTableProps {
  claims: ClaimHistory[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export const DividendHistoryTable: FC<DividendHistoryTableProps> = ({
  claims,
  total,
  page,
  limit,
  hasMore,
  isLoading,
  onPageChange,
}) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? ptBR : enUS;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: dateLocale });
    } catch {
      return '-';
    }
  };

  const shortenSignature = (sig: string | undefined) => {
    if (!sig) return '-';
    return `${sig.substring(0, 8)}...${sig.substring(sig.length - 8)}`;
  };

  const getSolscanUrl = (sig: string | undefined) => {
    if (!sig) return '#';
    return `https://solscan.io/tx/${sig}?cluster=devnet`;
  };

  const renderHeader = (showCount?: boolean) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-solana-purple-500/20">
          <History className="w-5 h-5 text-solana-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">{t('dividends.paymentHistory')}</h3>
      </div>
      {showCount && (
        <span className="text-sm text-solana-dark-400">
          {total} {t('dividends.payments')}
        </span>
      )}
    </div>
  );

  if (isLoading && claims.length === 0) {
    return (
      <Card>
        {renderHeader()}
        <div className="px-0">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-solana-dark-600">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-solana-dark-400/50 rounded" />
                  <div className="h-3 w-32 bg-solana-dark-400/30 rounded" />
                </div>
                <div className="h-5 w-20 bg-solana-dark-400/30 rounded" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!claims || claims.length === 0) {
    return (
      <Card>
        {renderHeader()}
        <div className="px-0">
          <div className="text-center py-8 text-solana-dark-300">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('dividends.noPaymentsYet')}</p>
            <p className="text-sm text-solana-dark-400 mt-1">
              {t('dividends.paymentsAfterClaim')}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {renderHeader(true)}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-solana-dark-400 border-b border-solana-dark-600">
              <th className="px-6 py-3 font-medium">{t('portfolio.date')}</th>
              <th className="px-6 py-3 font-medium">{t('dividends.property')}</th>
              <th className="px-6 py-3 font-medium text-right">{t('dividends.valueSol')}</th>
              <th className="px-6 py-3 font-medium text-right">{t('dividends.valueBrl')}</th>
              <th className="px-6 py-3 font-medium text-right">{t('dividends.propertyPercent')}</th>
              <th className="px-6 py-3 font-medium">{t('dividends.transaction')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-solana-dark-600">
            {claims.map((claim) => (
              <tr
                key={`${claim.propertyMint}-${claim.epochNumber}`}
                className="hover:bg-solana-dark-600/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-solana-green-400" />
                    <span className="text-sm text-white">
                      {formatDate(claim.claimedAt)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-white">
                    {claim.propertyName || claim.propertyMint.substring(0, 12) + '...'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-solana-green-400">
                    +{claim.amountSol.toFixed(6)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-solana-dark-200">
                    {claim.amountBrl ? formatCurrency(claim.amountBrl) : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-solana-dark-300">
                    {claim.percentageOfProperty
                      ? `${claim.percentageOfProperty.toFixed(4)}%`
                      : '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {claim.txSignature ? (
                    <a
                      href={getSolscanUrl(claim.txSignature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-solana-purple-400 hover:text-solana-purple-300 transition-colors"
                    >
                      {shortenSignature(claim.txSignature)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-solana-dark-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-solana-dark-600">
          <div className="text-sm text-solana-dark-400">
            {t('common.showing')} {(page - 1) * limit + 1} - {Math.min(page * limit, total)} {t('common.of')} {total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-solana-dark-300 px-2">
              {t('common.page')} {page}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={!hasMore || isLoading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
