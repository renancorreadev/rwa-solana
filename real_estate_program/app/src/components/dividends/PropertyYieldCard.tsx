import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, TrendingUp, ArrowRight, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PropertyYield } from '@/services/api/dividends';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface PropertyYieldCardProps {
  yields: PropertyYield[];
  isLoading: boolean;
}

export const PropertyYieldCard: FC<PropertyYieldCardProps> = ({ yields, isLoading }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? ptBR : enUS;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), "dd/MM/yy", { locale: dateLocale });
    } catch {
      return '-';
    }
  };

  const renderHeader = () => (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-solana-green-500/20">
        <Building2 className="w-5 h-5 text-solana-green-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">{t('dividends.yieldByProperty')}</h3>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        {renderHeader()}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-solana-dark-600/50 rounded-lg">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-solana-dark-400/50 rounded" />
                <div className="h-3 w-20 bg-solana-dark-400/30 rounded" />
              </div>
              <div className="h-8 w-24 bg-solana-dark-400/30 rounded" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!yields || yields.length === 0) {
    return (
      <Card>
        {renderHeader()}
        <div className="text-center py-8 text-solana-dark-300">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('dividends.noYieldYet')}</p>
          <p className="text-sm text-solana-dark-400 mt-1">
            {t('dividends.yieldAfterClaim')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {renderHeader()}
      <div className="divide-y divide-solana-dark-600">
        {yields.map((property) => (
          <div
            key={property.propertyMint}
            className="p-4 hover:bg-solana-dark-600/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white">
                    {property.propertyName || property.propertyMint.substring(0, 8)}
                  </h4>
                  {property.investorPercentage > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-solana-purple-500/20 text-solana-purple-400">
                      {property.investorPercentage.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span className="text-solana-green-400">
                    {formatCurrency(property.investorShareBrl)}/{t('dividends.total')}
                  </span>
                  <span className="text-solana-dark-400">
                    {property.investorShareSol.toFixed(4)} SOL
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-solana-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">
                      {property.annualizedYield > 0
                        ? `${property.annualizedYield.toFixed(1)}%`
                        : '-'}
                    </span>
                  </div>
                  <div className="text-xs text-solana-dark-400">{t('dividends.annualYield')}</div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/properties/${property.propertyMint}`)}
                  className="text-solana-dark-300 hover:text-white"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Distribution dates */}
            <div className="flex items-center gap-4 mt-3 text-xs text-solana-dark-400">
              {property.lastDistributionDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{t('dividends.lastDistribution')}: {formatDate(property.lastDistributionDate)}</span>
                </div>
              )}
              {property.nextDistributionDate && (
                <div className="flex items-center gap-1 text-solana-purple-400">
                  <Calendar className="w-3 h-3" />
                  <span>{t('dividends.nextDistribution')}: {formatDate(property.nextDistributionDate)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
