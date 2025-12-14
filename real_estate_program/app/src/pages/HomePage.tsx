import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  TrendingUp,
  Shield,
  ArrowRight,
  Sparkles,
  Globe,
  Lock,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard, StatsGrid } from '@/components/ui/Stats';
import { Badge } from '@/components/ui/Badge';
import { propertiesApi, statsApi } from '@/services/api';

export const HomePage: FC = () => {
  const { connected } = useWallet();
  const { t } = useTranslation();

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll(),
  });

  const { data: platformStats } = useQuery({
    queryKey: ['platformStats'],
    queryFn: () => statsApi.getPlatformStats(),
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 60000, // Refetch every minute
  });

  // Format number with locale (e.g., 2450 -> "2,450")
  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <div className="space-y-8 animate-in">
      {/* Hero Section */}
      <section className="relative py-8 lg:py-16">
        <div className="max-w-4xl">
          <Badge variant="purple" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            {t('home.poweredBy')}
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            {t('home.heroTitle1')}
            <span className="gradient-text">{t('home.heroTitle2')}</span>
          </h1>
          <p className="text-lg text-solana-dark-300 mb-8 max-w-2xl">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/properties">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                {t('home.exploreProperties')}
              </Button>
            </Link>
            {!connected && (
              <Button variant="secondary" size="lg">
                {t('common.connectWallet')}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <StatsGrid cols={3}>
        <StatCard
          title={t('home.propertiesListed')}
          value={platformStats?.totalProperties || 0}
          icon={<Building2 className="w-6 h-6 text-solana-green-400" />}
          iconBg="bg-solana-green-500/20"
        />
        <StatCard
          title={t('dashboard.activeInvestors')}
          value={formatNumber(platformStats?.activeInvestors || 0)}
          icon={<Users className="w-6 h-6 text-blue-400" />}
          iconBg="bg-blue-500/20"
        />
        <StatCard
          title={t('home.avgAnnualYield')}
          value={`${(platformStats?.avgAnnualYield || 0).toFixed(1)}%`}
          icon={<TrendingUp className="w-6 h-6 text-yellow-400" />}
          iconBg="bg-yellow-500/20"
        />
      </StatsGrid>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:border-solana-purple-500/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-solana-purple-500/20 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-solana-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{t('home.globalAccessTitle')}</h3>
          <p className="text-solana-dark-400">
            {t('home.globalAccessDesc')}
          </p>
        </Card>

        <Card className="p-6 hover:border-solana-green-500/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-solana-green-500/20 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-solana-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{t('home.kycProtectedTitle')}</h3>
          <p className="text-solana-dark-400">
            {t('home.kycProtectedDesc')}
          </p>
        </Card>

        <Card className="p-6 hover:border-blue-500/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{t('home.revenueDistTitle')}</h3>
          <p className="text-solana-dark-400">
            {t('home.revenueDistDesc')}
          </p>
        </Card>
      </section>

      {/* Featured Properties */}
      {properties && properties.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{t('dashboard.featuredProperties')}</h2>
              <p className="text-solana-dark-400">{t('home.topInvestments')}</p>
            </div>
            <Link to="/properties">
              <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
                {t('home.viewAll')}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.slice(0, 3).map((property) => (
              <Link key={property.mint} to={`/properties/${property.mint}`}>
                <Card variant="hover" padding="none">
                  <div className="h-48 bg-gradient-to-br from-solana-purple-500/20 to-solana-green-500/20 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-solana-dark-400" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{property.name}</h3>
                        <p className="text-sm text-solana-dark-400">{property.details.location}</p>
                      </div>
                      <Badge variant={property.status === 'active' ? 'success' : 'warning'}>
                        {property.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-solana-dark-800">
                      <div>
                        <p className="text-xs text-solana-dark-400">{t('home.tokenPrice')}</p>
                        <p className="font-semibold text-white">
                          ${property.details.valuePerToken.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-solana-dark-400">{t('home.annualYield')}</p>
                        <p className="font-semibold text-solana-green-400">
                          {property.details.annualYieldPercent}%
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      {!connected && (
        <Card className="p-8 text-center bg-gradient-to-r from-solana-purple-500/10 to-solana-green-500/10">
          <Shield className="w-12 h-12 text-solana-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{t('home.readyToInvest')}</h2>
          <p className="text-solana-dark-300 mb-6 max-w-md mx-auto">
            {t('home.ctaDescription')}
          </p>
          <Button size="lg">{t('common.connectWallet')}</Button>
        </Card>
      )}
    </div>
  );
};
