import { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  Wallet,
  TrendingUp,
  Shield,
  Settings,
  HelpCircle,
  BarChart3,
  CircleDollarSign,
  BookOpen,
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard', requiresAuth: false },
  { to: '/properties', icon: Building2, labelKey: 'nav.properties', requiresAuth: false },
  { to: '/portfolio', icon: Wallet, labelKey: 'nav.portfolio', requiresAuth: true },
  { to: '/dividends', icon: CircleDollarSign, labelKey: 'nav.dividends', requiresAuth: true },
  { to: '/revenue', icon: TrendingUp, labelKey: 'nav.revenue', requiresAuth: true },
  { to: '/reports', icon: BarChart3, labelKey: 'nav.reports', requiresAuth: true },
  { to: '/kyc', icon: Shield, labelKey: 'nav.kyc', requiresAuth: true },
];

const bottomItems = [
  { to: '/docs', icon: BookOpen, labelKey: 'nav.docs' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
  { to: '/help', icon: HelpCircle, labelKey: 'nav.help' },
];

export const Sidebar: FC = () => {
  const { connected } = useWallet();
  const { t } = useTranslation();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:flex lg:flex-col bg-solana-dark-950/80 backdrop-blur-xl border-r border-solana-dark-800/50 pt-20">
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isDisabled = item.requiresAuth && !connected;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-solana text-white shadow-lg shadow-solana-purple-500/25'
                    : 'text-solana-dark-400 hover:text-white hover:bg-solana-dark-800/60',
                  isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{t(item.labelKey)}</span>
              {isDisabled && (
                <span className="ml-auto text-xs text-solana-dark-500">{t('common.connect')}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 py-4 border-t border-solana-dark-800/50">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 px-4 py-2.5 text-solana-dark-500 hover:text-solana-dark-300 rounded-xl transition-all duration-200 hover:bg-solana-dark-800/40"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};
