import { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Building2, Wallet, BarChart3, CircleDollarSign } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.home' },
  { to: '/properties', icon: Building2, labelKey: 'nav.properties' },
  { to: '/portfolio', icon: Wallet, labelKey: 'nav.portfolio', requiresAuth: true },
  { to: '/dividends', icon: CircleDollarSign, labelKey: 'nav.dividends', requiresAuth: true },
  { to: '/reports', icon: BarChart3, labelKey: 'nav.reports', requiresAuth: true },
];

export const MobileNav: FC = () => {
  const { connected } = useWallet();
  const { t } = useTranslation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-solana-dark-950/95 backdrop-blur-xl border-t border-solana-dark-800/50 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isDisabled = item.requiresAuth && !connected;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-solana-green-400'
                    : 'text-solana-dark-500',
                  isDisabled && 'opacity-40 pointer-events-none'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={clsx(
                      'p-2 rounded-xl transition-all duration-200',
                      isActive && 'bg-solana-green-500/15 shadow-lg shadow-solana-green-500/10'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
