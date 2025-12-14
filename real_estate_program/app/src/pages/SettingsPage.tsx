import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
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
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Download,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { investorApi } from '@/services/api';
import toast from 'react-hot-toast';

type ThemeMode = 'dark' | 'light' | 'system';
type NotificationSetting = 'all' | 'important' | 'none';

interface UserPreferences {
  theme: ThemeMode;
  notifications: NotificationSetting;
  emailNotifications: boolean;
  pushNotifications: boolean;
  hideBalances: boolean;
  currency: string;
  language: string;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  notifications: 'all',
  emailNotifications: true,
  pushNotifications: false,
  hideBalances: false,
  currency: 'USD',
  language: 'en',
};

export const SettingsPage: FC = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', publicKey?.toString()],
    queryFn: () => investorApi.getPortfolio(publicKey!.toString()),
    enabled: !!publicKey,
  });

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePreferenceChange = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    toast.success('Preference updated');
  };

  const exportData = () => {
    const data = {
      wallet: publicKey?.toString(),
      portfolio: portfolio,
      preferences: preferences,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hub-token-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  if (!connected) {
    return (
      <EmptyState
        icon={<Wallet className="w-10 h-10" />}
        title="Connect Your Wallet"
        description="Connect your Solana wallet to access settings and preferences."
      />
    );
  }

  return (
    <div className="space-y-6 animate-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-solana-purple-400" />
          Settings
        </h1>
        <p className="text-solana-dark-400 mt-1">Manage your account and preferences</p>
      </div>

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
              <p className="text-sm text-solana-dark-400">Wallet Address</p>
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
              Disconnect
            </Button>
          </div>

          {/* KYC Status */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${portfolio?.kycVerified ? 'bg-solana-green-500/20' : 'bg-yellow-500/20'}`}>
                <Shield className={`w-5 h-5 ${portfolio?.kycVerified ? 'text-solana-green-400' : 'text-yellow-400'}`} />
              </div>
              <div>
                <p className="font-medium text-white">KYC Verification</p>
                <p className="text-sm text-solana-dark-400">
                  Status: <span className={portfolio?.kycVerified ? 'text-solana-green-400' : 'text-yellow-400'}>
                    {portfolio?.kycStatus || 'Not verified'}
                  </span>
                </p>
              </div>
            </div>
            {!portfolio?.kycVerified && (
              <Button variant="primary" size="sm" onClick={() => window.location.href = '/kyc'}>
                Verify Now
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader title="Appearance" subtitle="Customize how the app looks" />

        <div className="space-y-4">
          {/* Theme Selection */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              {preferences.theme === 'dark' ? (
                <Moon className="w-5 h-5 text-solana-purple-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
              <div>
                <p className="font-medium text-white">Theme</p>
                <p className="text-sm text-solana-dark-400">Choose your preferred theme</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(['dark', 'light', 'system'] as ThemeMode[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handlePreferenceChange('theme', theme)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences.theme === theme
                      ? 'bg-solana-purple-500 text-white'
                      : 'bg-solana-dark-700 text-solana-dark-300 hover:bg-solana-dark-600'
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Hide Balances */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              {preferences.hideBalances ? (
                <EyeOff className="w-5 h-5 text-solana-dark-400" />
              ) : (
                <Eye className="w-5 h-5 text-solana-green-400" />
              )}
              <div>
                <p className="font-medium text-white">Hide Balances</p>
                <p className="text-sm text-solana-dark-400">Hide your portfolio values for privacy</p>
              </div>
            </div>
            <button
              onClick={() => handlePreferenceChange('hideBalances', !preferences.hideBalances)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.hideBalances ? 'bg-solana-purple-500' : 'bg-solana-dark-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences.hideBalances ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-white">Currency</p>
                <p className="text-sm text-solana-dark-400">Display values in your preferred currency</p>
              </div>
            </div>
            <select
              value={preferences.currency}
              onChange={(e) => handlePreferenceChange('currency', e.target.value)}
              className="bg-solana-dark-700 text-white px-4 py-2 rounded-lg border border-solana-dark-600 focus:outline-none focus:border-solana-purple-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="BRL">BRL (R$)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader title="Notifications" subtitle="Manage how you receive updates" />

        <div className="space-y-4">
          {/* Notification Level */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-solana-purple-400" />
              <div>
                <p className="font-medium text-white">Notification Level</p>
                <p className="text-sm text-solana-dark-400">Choose which notifications to receive</p>
              </div>
            </div>
            <select
              value={preferences.notifications}
              onChange={(e) => handlePreferenceChange('notifications', e.target.value as NotificationSetting)}
              className="bg-solana-dark-700 text-white px-4 py-2 rounded-lg border border-solana-dark-600 focus:outline-none focus:border-solana-purple-500"
            >
              <option value="all">All notifications</option>
              <option value="important">Important only</option>
              <option value="none">None</option>
            </select>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-solana-dark-400" />
              <div>
                <p className="font-medium text-white">Email Notifications</p>
                <p className="text-sm text-solana-dark-400">Receive updates via email</p>
              </div>
            </div>
            <button
              onClick={() => handlePreferenceChange('emailNotifications', !preferences.emailNotifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.emailNotifications ? 'bg-solana-purple-500' : 'bg-solana-dark-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences.emailNotifications ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 bg-solana-dark-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-solana-dark-400" />
              <div>
                <p className="font-medium text-white">Push Notifications</p>
                <p className="text-sm text-solana-dark-400">Receive push notifications on your device</p>
              </div>
            </div>
            <button
              onClick={() => handlePreferenceChange('pushNotifications', !preferences.pushNotifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.pushNotifications ? 'bg-solana-purple-500' : 'bg-solana-dark-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences.pushNotifications ? 'translate-x-7' : 'translate-x-1'
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
                  onClick={() => {
                    setPreferences(defaultPreferences);
                    setShowDeleteConfirm(false);
                    toast.success('Account data deleted');
                  }}
                >
                  Confirm
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
