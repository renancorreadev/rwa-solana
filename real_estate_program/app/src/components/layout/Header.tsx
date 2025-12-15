import { FC, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, Shield, Building2, MapPin, X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { LanguageSwitcher } from './LanguageSwitcher';
import { WalletConnectButton } from '../wallet/WalletConnectButton';
import { propertiesApi } from '@/services/api';

// Admin wallet address
const ADMIN_WALLET = 'AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw';

export const Header: FC = () => {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Fetch properties for search
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll(),
  });

  // Filter properties based on search term
  const filteredProperties = properties?.filter((property) => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.toLowerCase();
    return (
      property.name.toLowerCase().includes(term) ||
      property.symbol.toLowerCase().includes(term) ||
      property.details.location.toLowerCase().includes(term) ||
      property.details.propertyType.toLowerCase().includes(term)
    );
  }).slice(0, 5); // Limit to 5 results

  // Check if connected wallet is admin
  useEffect(() => {
    if (connected && publicKey) {
      setIsAdmin(publicKey.toString() === ADMIN_WALLET);
    } else {
      setIsAdmin(false);
    }
  }, [connected, publicKey]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setIsMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePropertyClick = (mint: string) => {
    setSearchTerm('');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    navigate(`/properties/${mint}`);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
    if (!isMobileSearchOpen) {
      setSearchTerm('');
    }
  };

  // Search results component (shared between mobile and desktop)
  const SearchResults = () => (
    <div className="absolute top-full left-0 right-0 mt-2 bg-solana-dark-800 border border-solana-dark-700 rounded-xl shadow-xl overflow-hidden z-50">
      {filteredProperties && filteredProperties.length > 0 ? (
        <div className="py-2">
          {filteredProperties.map((property) => (
            <button
              key={property.mint}
              onClick={() => handlePropertyClick(property.mint)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-solana-dark-700 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-solana-dark-700 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-solana-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{property.name}</p>
                <div className="flex items-center gap-1 text-xs text-solana-dark-400">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{property.details.location}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-solana-green-400 font-medium text-sm">
                  {property.details.annualYieldPercent}% yield
                </p>
                <p className="text-xs text-solana-dark-400">{property.symbol}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center">
          <Building2 className="w-8 h-8 text-solana-dark-500 mx-auto mb-2" />
          <p className="text-solana-dark-400 text-sm">{t('properties.noProperties')}</p>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo - Responsive */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile: Icon only */}
            <div className="lg:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-solana-green-500 to-solana-purple-500 flex items-center justify-center shadow-lg shadow-solana-green-500/20">
              <span className="text-lg font-bold text-white">K</span>
            </div>
            {/* Desktop: Full logo */}
            <img src="/kota-logo.svg" alt="Kota Logo" className="hidden lg:block h-10" />
          </Link>

          {/* Search - Desktop only */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8" ref={searchRef}>
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-solana-dark-400" />
              <input
                type="text"
                placeholder={t('properties.searchPlaceholder')}
                className="input pl-12 pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-solana-dark-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isSearchFocused && searchTerm && <SearchResults />}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Button */}
            <button
              onClick={toggleMobileSearch}
              className="lg:hidden p-2 rounded-xl bg-solana-dark-800/50 hover:bg-solana-dark-700/50 transition-colors"
            >
              <Search className="w-5 h-5 text-solana-dark-300" />
            </button>

            {/* Language Switcher - Hidden on very small screens */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Admin Button - Only show for admin wallet */}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-solana-purple-500/20 hover:bg-solana-purple-500/30 transition-colors border border-solana-purple-500/30"
              >
                <Shield className="w-4 h-4 text-solana-purple-400" />
                <span className="text-sm font-medium text-solana-purple-400 hidden sm:inline">{t('nav.admin')}</span>
              </button>
            )}

            {/* Notifications - Hidden on mobile */}
            {connected && (
              <button className="hidden sm:flex p-2.5 rounded-xl bg-solana-dark-800/50 hover:bg-solana-dark-700/50 transition-colors relative">
                <Bell className="w-5 h-5 text-solana-dark-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-solana-green-500 rounded-full" />
              </button>
            )}

            {/* Wallet Button */}
            <WalletConnectButton />
          </div>
        </div>

        {/* Mobile Search Bar - Expandable */}
        {isMobileSearchOpen && (
          <div className="lg:hidden pb-3" ref={mobileSearchRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-solana-dark-400" />
              <input
                type="text"
                placeholder={t('properties.searchPlaceholder')}
                className="input pl-12 pr-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-solana-dark-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {searchTerm && <SearchResults />}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
