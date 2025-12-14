import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  User,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Wallet,
  Copy,
  ExternalLink,
  Check,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Loader2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { investorApi } from '@/services/api';
import * as userApi from '@/services/api/user';
import toast from 'react-hot-toast';

type ThemeMode = 'dark' | 'light' | 'system';
type CurrencyType = 'USD' | 'BRL' | 'EUR';

export const SettingsPage: FC = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { t } = useTranslation();

  // Fetch user preferences from API
  const { data: preferences, isLoading: preferencesLoading, error: preferencesError } = useQuery({
    queryKey: ['userPreferences', publicKey?.toString()],
    queryFn: () => userApi.getUserPreferences(publicKey!.toString()),
    enabled: !!publicKey,
    retry: 1,
  });

  // Fetch portfolio data
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', publicKey?.toString()],
    queryFn: () => investorApi.getPortfolio(publicKey!.toString()),
    enabled: !!publicKey,
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: userApi.UpdatePreferencesInput) =>
      userApi.updateUserPreferences(publicKey!.toString(), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', publicKey?.toString()] });
      toast.success('Preferences updated');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Delete preferences mutation
  const deletePreferencesMutation = useMutation({
    mutationFn: () => userApi.deleteUserPreferences(publicKey!.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', publicKey?.toString()] });
      setShowDeleteConfirm(false);
      toast.success('Account data deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleThemeChange = (theme: ThemeMode) => {
    updatePreferencesMutation.mutate({ theme });
  };

  const handleCurrencyChange = (currency: CurrencyType) => {
    updatePreferencesMutation.mutate({ currency });
  };

  const handleHideBalancesToggle = () => {
    updatePreferencesMutation.mutate({ hideBalances: !preferences?.hideBalances });
  };

  const handleNotificationToggle = (key: keyof userApi.NotificationPreferences) => {
    if (!preferences) return;
    updatePreferencesMutation.mutate({
      notifications: {
        [key]: !preferences.notifications[key],
      },
    });
  };

  const exportData = async () => {
    if (!publicKey) return;
    try {
      const blob = await userApi.exportUserData(publicKey.toString(), 'json');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hub-token-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  if (!connected) {
    return (
      <EmptyState
        icon={<Wallet className="w-10 h-10" />}
        title={t('common.connectWallet')}
        description={t('errors.walletNotConnected')}
      />
    );
  }

  if (preferencesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-solana-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-solana-purple-400" />
          {t('settings.title')}
        </h1>
        <p className="text-solana-dark-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* API Error Warning */}
      {preferencesError && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="font-medium text-white">Could not load preferences</p>
            <p className="text-sm text-solana-dark-400">Using default settings. Changes may not be saved.</p>
          </div>
        </div>
      )}

      {/* Profile Section */}
      <Card>
        <CardHeader title="Profile" subtitle="Your wallet and identity information" />

        <div className="space-y-6">
          {/* Wallet Info */}
          <div className="flex items-center gap-4 p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-solana flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-solana-dark-400">{t('wallet.address')}</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-white font-mono text-sm">
                  {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1.5 rounded-lg hover:bg-solana-dark-700 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-solana-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-solana-dark-400" />
                  )}
                </button>
                <a
                  href={`https://explorer.solana.com/address/${publicKey?.toString()}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-solana-dark-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-solana-dark-400" />
                </a>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => disconnect()}>
              {t('wallet.disconnect')}
            </Button>
          </div>

          {/* KYC Status */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${portfolio?.kycVerified ? 'bg-solana-green-500/20' : 'bg-yellow-500/20'}`}>
                <Shield className={`w-5 h-5 ${portfolio?.kycVerified ? 'text-solana-green-400' : 'text-yellow-400'}`} />
              </div>
              <div>
                <p className="font-medium text-white">{t('kyc.title')}</p>
                <p className="text-sm text-solana-dark-400">
                  Status: <span className={portfolio?.kycVerified ? 'text-solana-green-400' : 'text-yellow-400'}>
                    {portfolio?.kycStatus || 'Not verified'}
                  </span>
                </p>
              </div>
            </div>
            {!portfolio?.kycVerified && (
              <Button variant="primary" size="sm" onClick={() => window.location.href = '/kyc'}>
                {t('kyc.startVerification')}
              </Button>
            )}
          </div>

          {/* Portfolio Summary */}
          {portfolio && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-solana-dark-800/50 rounded-xl text-center">
                <Building className="w-5 h-5 text-solana-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{portfolio.totalProperties}</p>
                <p className="text-xs text-solana-dark-400">Properties</p>
              </div>
              <div className="p-4 bg-solana-dark-800/50 rounded-xl text-center">
                <DollarSign className="w-5 h-5 text-solana-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  ${preferences?.hideBalances ? '••••' : portfolio.totalValueUsd.toLocaleString()}
                </p>
                <p className="text-xs text-solana-dark-400">Total Value</p>
              </div>
              <div className="p-4 bg-solana-dark-800/50 rounded-xl text-center">
                <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{portfolio.holdings?.length || 0}</p>
                <p className="text-xs text-solana-dark-400">Holdings</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader title={t('settings.appearance')} subtitle="Customize how the app looks" />

        <div className="space-y-4">
          {/* Theme Selection */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              {preferences?.theme === 'dark' ? (
                <Moon className="w-5 h-5 text-solana-purple-400" />
              ) : preferences?.theme === 'light' ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Settings className="w-5 h-5 text-solana-dark-400" />
              )}
              <div>
                <p className="font-medium text-white">{t('settings.theme')}</p>
                <p className="text-sm text-solana-dark-400">Choose your preferred theme</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(['dark', 'light', 'system'] as ThemeMode[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  disabled={updatePreferencesMutation.isPending}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences?.theme === theme
                      ? 'bg-solana-purple-500 text-white'
                      : 'bg-solana-dark-700 text-solana-dark-300 hover:bg-solana-dark-600'
                  }`}
                >
                  {t(`settings.${theme}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Hide Balances */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              {preferences?.hideBalances ? (
                <EyeOff className="w-5 h-5 text-solana-dark-400" />
              ) : (
                <Eye className="w-5 h-5 text-solana-green-400" />
              )}
              <div>
                <p className="font-medium text-white">{t('settings.hideBalances')}</p>
                <p className="text-sm text-solana-dark-400">{t('settings.hideBalancesDescription')}</p>
              </div>
            </div>
            <button
              onClick={handleHideBalancesToggle}
              disabled={updatePreferencesMutation.isPending}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences?.hideBalances ? 'bg-solana-purple-500' : 'bg-solana-dark-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences?.hideBalances ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-white">{t('settings.currency')}</p>
                <p className="text-sm text-solana-dark-400">Display values in your preferred currency</p>
              </div>
            </div>
            <select
              value={preferences?.currency || 'USD'}
              onChange={(e) => handleCurrencyChange(e.target.value as CurrencyType)}
              disabled={updatePreferencesMutation.isPending}
              className="bg-solana-dark-700 text-white px-4 py-2 rounded-lg border border-solana-dark-600 focus:outline-none focus:border-solana-purple-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (&#8364;)</option>
              <option value="BRL">BRL (R$)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader title={t('settings.notifications')} subtitle="Manage how you receive updates" />

        <div className="space-y-4">
          {/* Revenue Alerts */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-solana-green-400" />
              <div>
                <p className="font-medium text-white">{t('settings.revenueAlerts')}</p>
                <p className="text-sm text-solana-dark-400">{t('settings.revenueAlertsDescription')}</p>
              </div>
            </div>
            <button
              onClick={() => handleNotificationToggle('revenueAlerts')}
              disabled={updatePreferencesMutation.isPending}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences?.notifications?.revenueAlerts ? 'bg-solana-purple-500' : 'bg-solana-dark-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences?.notifications?.revenueAlerts ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Price Alerts */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-white">{t('settings.priceAlerts')}</p>
                <p className="text-sm text-solana-dark-400">Get notified of significant price changes</p>
              </div>
            </div>
            <button
              onClick={() => handleNotificationToggle('priceAlerts')}
              disabled={updatePreferencesMutation.isPending}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences?.notifications?.priceAlerts ? 'bg-solana-purple-500' : 'bg-solana-dark-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences?.notifications?.priceAlerts ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* New Properties */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-solana-purple-400" />
              <div>
                <p className="font-medium text-white">New Properties</p>
                <p className="text-sm text-solana-dark-400">Get notified when new properties are listed</p>
              </div>
            </div>
            <button
              onClick={() => handleNotificationToggle('newProperties')}
              disabled={updatePreferencesMutation.isPending}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences?.notifications?.newProperties ? 'bg-solana-purple-500' : 'bg-solana-dark-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences?.notifications?.newProperties ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* KYC Reminders */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="font-medium text-white">KYC Reminders</p>
                <p className="text-sm text-solana-dark-400">Reminders about KYC verification status</p>
              </div>
            </div>
            <button
              onClick={() => handleNotificationToggle('kycReminders')}
              disabled={updatePreferencesMutation.isPending}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences?.notifications?.kycReminders ? 'bg-solana-purple-500' : 'bg-solana-dark-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences?.notifications?.kycReminders ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Marketing Emails */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-solana-dark-400" />
              <div>
                <p className="font-medium text-white">Marketing Communications</p>
                <p className="text-sm text-solana-dark-400">Receive updates about new features and offers</p>
              </div>
            </div>
            <button
              onClick={() => handleNotificationToggle('marketingEmails')}
              disabled={updatePreferencesMutation.isPending}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences?.notifications?.marketingEmails ? 'bg-solana-purple-500' : 'bg-solana-dark-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences?.notifications?.marketingEmails ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader title="Data & Privacy" subtitle="Manage your data and account" />

        <div className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-white">Export Data</p>
                <p className="text-sm text-solana-dark-400">Download all your data as JSON</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={exportData}>
              Export
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-medium text-white">Delete Account Data</p>
                <p className="text-sm text-solana-dark-400">Remove all stored preferences (on-chain data remains)</p>
              </div>
            </div>
            {!showDeleteConfirm ? (
              <Button
                variant="secondary"
                size="sm"
                className="!bg-red-500/20 !text-red-400 hover:!bg-red-500/30"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="!bg-red-500 !text-white hover:!bg-red-600"
                  onClick={() => deletePreferencesMutation.mutate()}
                  disabled={deletePreferencesMutation.isPending}
                >
                  {deletePreferencesMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Confirm'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Version Info */}
      <div className="text-center text-sm text-solana-dark-500 py-4">
        <p>Hub Token v1.0.0</p>
        <p className="mt-1">Built on Solana | Powered by RWA Technology</p>
      </div>
    </div>
  );
};
