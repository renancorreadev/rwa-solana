import { FC, useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Building2,
  Plus,
  Coins,
  DollarSign,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Power,
  Image as ImageIcon,
  Loader2,
  HelpCircle,
  Calculator,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ImageUploader } from '@/components/property/ImageUploader';

// Admin API URL (Hub Token API) - empty string means use relative URLs via Kong proxy
const ADMIN_API_URL = import.meta.env.VITE_HUB_API_URL ?? '';

// Admin wallet address (must match keypair in ~/.config/solana/id.json)
const ADMIN_WALLET = 'AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw';

interface PropertyDetails {
  propertyType: string;
  location: string;
  totalValueUsd: number;
  valuePerToken: number;
  annualYieldPercent: number;
  propertyAddress: string;
  metadataUri?: string;
}

interface UploadedImage {
  ipfsHash: string;
  ipfsUri: string;
  gatewayUrl: string;
  file?: File;
  isUploading?: boolean;
  error?: string;
}

interface Property {
  mint: string;
  name: string;
  symbol: string;
  authority: string;
  totalSupply: string;
  circulatingSupply: string;
  status: string; // "active" | "paused"
  details: PropertyDetails;
  createdAt: string;
  currentEpoch?: number;
}

// Tab types
type AdminTab = 'properties' | 'create' | 'mint' | 'revenue';

// Info Tooltip Component
const InfoTooltip: FC<{ text: string }> = ({ text }) => (
  <span className="group relative inline-block ml-1">
    <HelpCircle className="w-4 h-4 text-solana-dark-400 hover:text-solana-purple-400 cursor-help" />
    <span className="absolute z-50 hidden group-hover:block w-64 p-3 text-xs text-white bg-solana-dark-700 rounded-lg shadow-lg border border-solana-dark-600 -translate-x-1/2 left-1/2 bottom-full mb-2">
      {text}
      <span className="absolute w-2 h-2 bg-solana-dark-700 border-r border-b border-solana-dark-600 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1" />
    </span>
  </span>
);

export const AdminPage: FC = () => {
  const { t } = useTranslation();
  const { publicKey, connected } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; signature?: string } | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    propertyType: 'residential',
    location: '',
    totalValueUsd: '',
    valuePerToken: '',
    monthlyRent: '',
    annualYieldPercent: '',
    propertyAddress: '',
    description: '',
    sellerWallet: '',
  });

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isCreatingMetadata, setIsCreatingMetadata] = useState(false);

  const [mintForm, setMintForm] = useState({
    propertyMint: '',
    investorWallet: '',
    amount: '',
  });

  const [revenueForm, setRevenueForm] = useState({
    propertyMint: '',
    epochNumber: '',
    amountSol: '',
    amountBrl: '',
  });

  // SOL price oracle state
  const [solPrice, setSolPrice] = useState<{ brl: number; usd: number; lastUpdated: Date | null }>({
    brl: 0,
    usd: 0,
    lastUpdated: null,
  });
  const [isFetchingSolPrice, setIsFetchingSolPrice] = useState(false);

  // Auto-calculated values
  const calculations = useMemo(() => {
    const totalValue = parseFloat(createForm.totalValueUsd) || 0;
    const valuePerToken = parseFloat(createForm.valuePerToken) || 0;
    const monthlyRent = parseFloat(createForm.monthlyRent) || 0;
    const manualYield = parseFloat(createForm.annualYieldPercent) || 0;

    // Calculate annual rent from monthly
    const annualRent = monthlyRent * 12;

    // Calculate yield from monthly rent (if provided)
    const calculatedYield = totalValue > 0 && monthlyRent > 0
      ? (annualRent / totalValue) * 100
      : 0;

    // Use calculated yield if monthly rent is provided, otherwise use manual input
    const annualYield = monthlyRent > 0 ? calculatedYield : manualYield;

    // Calculate total supply
    const totalSupply = valuePerToken > 0 ? Math.floor(totalValue / valuePerToken) : 0;

    // Calculate annual revenue
    const annualRevenue = monthlyRent > 0 ? annualRent : (totalValue * (annualYield / 100));

    // Calculate revenue per token
    const revenuePerToken = totalSupply > 0 ? annualRevenue / totalSupply : 0;

    // Calculate monthly revenue
    const monthlyRevenue = annualRevenue / 12;
    const monthlyPerToken = revenuePerToken / 12;

    return {
      totalSupply,
      annualRevenue,
      revenuePerToken,
      monthlyRevenue,
      monthlyPerToken,
      calculatedYield,
      annualYield,
      isValid: totalValue > 0 && valuePerToken > 0 && (annualYield > 0 || monthlyRent > 0),
      hasMonthlyRent: monthlyRent > 0,
    };
  }, [createForm.totalValueUsd, createForm.valuePerToken, createForm.monthlyRent, createForm.annualYieldPercent]);

  // Auto-update total supply and yield when values change
  useEffect(() => {
    if (calculations.totalSupply > 0) {
      setCreateForm(prev => ({ ...prev, totalSupply: calculations.totalSupply.toString() }));
    }
  }, [calculations.totalSupply]);

  // Auto-update yield when monthly rent changes
  useEffect(() => {
    if (calculations.hasMonthlyRent && calculations.calculatedYield > 0) {
      setCreateForm(prev => ({ ...prev, annualYieldPercent: calculations.calculatedYield.toFixed(2) }));
    }
  }, [calculations.calculatedYield, calculations.hasMonthlyRent]);

  // Check if connected wallet is admin (local check)
  useEffect(() => {
    if (!connected || !publicKey) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    // Check against admin wallet locally
    const walletIsAdmin = publicKey.toString() === ADMIN_WALLET;
    setIsAdmin(walletIsAdmin);
    setIsLoading(false);
  }, [connected, publicKey]);

  // Fetch properties when admin
  useEffect(() => {
    if (isAdmin) {
      fetchProperties();
    }
  }, [isAdmin]);

  // Fetch SOL price when revenue tab is active
  useEffect(() => {
    if (activeTab === 'revenue') {
      fetchSolPrice();
    }
  }, [activeTab]);

  // Fetch SOL price from CoinGecko
  const fetchSolPrice = async () => {
    setIsFetchingSolPrice(true);
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=brl,usd'
      );
      const data = await response.json();
      if (data.solana) {
        setSolPrice({
          brl: data.solana.brl,
          usd: data.solana.usd,
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error('Error fetching SOL price:', error);
    } finally {
      setIsFetchingSolPrice(false);
    }
  };

  // Auto-calculate SOL amount when BRL changes
  useEffect(() => {
    if (revenueForm.amountBrl && solPrice.brl > 0) {
      const brlAmount = parseFloat(revenueForm.amountBrl);
      if (!isNaN(brlAmount)) {
        const solAmount = brlAmount / solPrice.brl;
        setRevenueForm(prev => ({ ...prev, amountSol: solAmount.toFixed(6) }));
      }
    }
  }, [revenueForm.amountBrl, solPrice.brl]);

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/v1/properties`);
      const data = await response.json();
      // API returns { success: true, data: [...], count: N }
      setProperties(data.data || data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  // Build explorer URL
  const getExplorerUrl = (type: 'tx' | 'address', value: string) => {
    const network = (import.meta.env.VITE_SOLANA_NETWORK || 'localnet') as string;
    const rpcUrl = (import.meta.env.VITE_SOLANA_RPC_URL || 'http://localhost:8899') as string;
    const baseUrl = 'https://explorer.solana.com';

    if (network === 'mainnet-beta') return `${baseUrl}/${type}/${value}`;
    if (network === 'devnet') return `${baseUrl}/${type}/${value}?cluster=devnet`;
    if (network === 'testnet') return `${baseUrl}/${type}/${value}?cluster=testnet`;
    return `${baseUrl}/${type}/${value}?cluster=custom&customUrl=${encodeURIComponent(rpcUrl)}`;
  };

  // Create Metadata on IPFS
  const createMetadataOnIpfs = async (): Promise<string | null> => {
    // Skip if no images uploaded
    if (uploadedImages.length === 0) {
      return null;
    }

    // Check all images are uploaded (no pending uploads)
    const pendingUploads = uploadedImages.filter((img) => img.isUploading || img.error);
    if (pendingUploads.length > 0) {
      throw new Error('Please wait for all images to finish uploading');
    }

    setIsCreatingMetadata(true);

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/v1/ipfs/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': publicKey!.toString(),
        },
        body: JSON.stringify({
          name: createForm.name,
          symbol: createForm.symbol,
          description: createForm.description || `${createForm.name} - Tokenized real estate property`,
          propertyType: createForm.propertyType,
          location: createForm.location,
          propertyAddress: createForm.propertyAddress,
          totalValueUsd: parseFloat(createForm.totalValueUsd),
          pricePerToken: parseFloat(createForm.valuePerToken),
          annualYieldPercent: parseFloat(createForm.annualYieldPercent),
          totalSupply: parseInt(createForm.totalSupply),
          status: 'active',
          images: uploadedImages.map((img) => img.ipfsUri),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create metadata');
      }

      return data.ipfsUri;
    } finally {
      setIsCreatingMetadata(false);
    }
  };

  // Create Property
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLastResult(null);

    try {
      // First, create metadata on IPFS if we have images
      let metadataUri: string | null = null;
      if (uploadedImages.length > 0) {
        metadataUri = await createMetadataOnIpfs();
      }

      // Then create the property on-chain
      const response = await fetch(`${ADMIN_API_URL}/api/v1/admin/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': publicKey!.toString(),
        },
        body: JSON.stringify({
          name: createForm.name,
          symbol: createForm.symbol,
          totalSupply: parseInt(createForm.totalSupply),
          sellerWallet: createForm.sellerWallet,
          details: {
            propertyType: createForm.propertyType,
            location: createForm.location,
            totalValueUsd: parseFloat(createForm.totalValueUsd),
            valuePerToken: parseFloat(createForm.valuePerToken),
            annualYieldPercent: parseFloat(createForm.annualYieldPercent),
            propertyAddress: createForm.propertyAddress,
            metadataUri: metadataUri || undefined,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLastResult({
          success: true,
          message: `Property created! Mint: ${data.mint}${metadataUri ? ' | Metadata stored on IPFS' : ''}`,
          signature: data.signature,
        });
        setCreateForm({
          name: '',
          symbol: '',
          totalSupply: '',
          propertyType: 'residential',
          location: '',
          totalValueUsd: '',
          valuePerToken: '',
          monthlyRent: '',
          annualYieldPercent: '',
          propertyAddress: '',
          description: '',
          sellerWallet: '',
        });
        setUploadedImages([]);
        fetchProperties();
      } else {
        setLastResult({ success: false, message: data.error || 'Failed to create property' });
      }
    } catch (error: any) {
      setLastResult({ success: false, message: error.message || 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mint Tokens
  const handleMintTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLastResult(null);

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/v1/admin/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': publicKey!.toString(),
        },
        body: JSON.stringify({
          propertyMint: mintForm.propertyMint,
          investorWallet: mintForm.investorWallet,
          amount: parseInt(mintForm.amount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLastResult({
          success: true,
          message: `Tokens minted! Token Account: ${data.tokenAccount}`,
          signature: data.signature,
        });
        setMintForm({ propertyMint: '', investorWallet: '', amount: '' });
        fetchProperties();
      } else {
        setLastResult({ success: false, message: data.error || 'Failed to mint tokens' });
      }
    } catch (error: any) {
      setLastResult({ success: false, message: error.message || 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deposit Revenue
  const handleDepositRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLastResult(null);

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/v1/admin/revenue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': publicKey!.toString(),
        },
        body: JSON.stringify({
          propertyMint: revenueForm.propertyMint,
          epochNumber: parseInt(revenueForm.epochNumber),
          amountSol: parseFloat(revenueForm.amountSol),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLastResult({
          success: true,
          message: `Revenue deposited! Vault: ${data.revenueVault}`,
          signature: data.signature,
        });
        setRevenueForm({ propertyMint: '', epochNumber: '', amountSol: '', amountBrl: '' });
      } else {
        // Check for epoch already exists error
        let errorMessage = data.error || 'Failed to deposit revenue';
        if (errorMessage.includes('already in use') || errorMessage.includes('0x0')) {
          errorMessage = `Epoch #${revenueForm.epochNumber} já existe! Use a próxima epoch disponível.`;
        }
        setLastResult({ success: false, message: errorMessage });
      }
    } catch (error: any) {
      let errorMessage = error.message || 'Network error';
      if (errorMessage.includes('already in use') || errorMessage.includes('0x0')) {
        errorMessage = `Epoch #${revenueForm.epochNumber} já existe! Use a próxima epoch disponível.`;
      }
      setLastResult({ success: false, message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle property status
  const handleToggleStatus = async (mint: string) => {
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/v1/admin/properties/${mint}/toggle`, {
        method: 'POST',
        headers: { 'x-wallet-address': publicKey!.toString() },
      });

      if (response.ok) {
        fetchProperties();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // Not connected
  if (!connected) {
    return (
      <EmptyState
        icon={<Shield className="w-10 h-10" />}
        title={t('admin.connectAdminWallet')}
        description={t('admin.connectAdminDescription')}
      />
    );
  }

  if (isLoading) return <PageLoading />;

  // Not admin
  if (!isAdmin) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-10 h-10 text-red-400" />}
        title={t('admin.unauthorizedAccess')}
        description={`${t('admin.unauthorizedDescription')} ${ADMIN_WALLET.slice(0, 8)}...${ADMIN_WALLET.slice(-8)}`}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">{t('admin.title')}</h1>
          <p className="text-solana-dark-400">{t('admin.subtitle')}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchProperties}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          {t('admin.refresh')}
        </Button>
      </div>

      {/* Result Message */}
      {lastResult && (
        <Card className={`p-4 ${lastResult.success ? 'bg-solana-green-500/10 border-solana-green-500/30' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="flex items-start gap-3">
            {lastResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-solana-green-400 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={lastResult.success ? 'text-solana-green-400' : 'text-red-400'}>
                {lastResult.message}
              </p>
              {lastResult.signature && (
                <a
                  href={getExplorerUrl('tx', lastResult.signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-solana-purple-400 hover:text-solana-purple-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t('admin.viewOnExplorer')}
                </a>
              )}
            </div>
            <button onClick={() => setLastResult(null)} className="text-solana-dark-400 hover:text-white">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-solana-dark-700 pb-2">
        {[
          { id: 'properties', label: t('admin.properties'), icon: Building2 },
          { id: 'create', label: t('admin.createProperty'), icon: Plus },
          { id: 'mint', label: t('admin.mintTokens'), icon: Coins },
          { id: 'revenue', label: t('admin.depositRevenue'), icon: DollarSign },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-solana-purple-500/20 text-solana-purple-400'
                : 'text-solana-dark-400 hover:text-white hover:bg-solana-dark-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Properties List */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          {properties.length === 0 ? (
            <Card className="p-8 text-center">
              <Building2 className="w-12 h-12 text-solana-dark-400 mx-auto mb-4" />
              <p className="text-solana-dark-400">{t('admin.noPropertiesYet')}</p>
              <Button className="mt-4" onClick={() => setActiveTab('create')}>
                {t('admin.createFirstProperty')}
              </Button>
            </Card>
          ) : (
            properties.map((property) => (
              <Card key={property.mint} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{property.name}</h3>
                      <Badge variant="default">{property.symbol}</Badge>
                      <Badge variant={property.status === 'active' ? 'success' : 'warning'}>
                        {property.status === 'active' ? t('admin.active') : t('admin.paused')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-solana-dark-400">{t('admin.totalSupply')}</p>
                        <p className="text-white font-medium">{parseInt(property.totalSupply).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-solana-dark-400">{t('admin.circulatingSupply')}</p>
                        <p className="text-white font-medium">{parseInt(property.circulatingSupply).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-solana-dark-400">{t('admin.totalValue')}</p>
                        <p className="text-white font-medium">${property.details.totalValueUsd.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-solana-dark-400">{t('admin.yield')}</p>
                        <p className="text-white font-medium">{property.details.annualYieldPercent}%</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="text-xs font-mono text-solana-dark-400">
                        {property.mint.slice(0, 12)}...{property.mint.slice(-12)}
                      </code>
                      <a
                        href={getExplorerUrl('address', property.mint)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-solana-purple-400 hover:text-solana-purple-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(property.mint)}
                      leftIcon={<Power className="w-4 h-4" />}
                    >
                      {property.status === 'active' ? t('admin.pause') : t('admin.activate')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMintForm({ ...mintForm, propertyMint: property.mint });
                        setActiveTab('mint');
                      }}
                      leftIcon={<Coins className="w-4 h-4" />}
                    >
                      Mint
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRevenueForm({ ...revenueForm, propertyMint: property.mint });
                        setActiveTab('revenue');
                      }}
                      leftIcon={<DollarSign className="w-4 h-4" />}
                    >
                      Revenue
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Property Form */}
      {activeTab === 'create' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">{t('admin.createProperty')}</h3>
          <form onSubmit={handleCreateProperty} className="space-y-6">
            {/* Property Images */}
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {t('admin.propertyImages')}
                </span>
              </label>
              <ImageUploader
                images={uploadedImages}
                onImagesChange={setUploadedImages}
                maxImages={10}
                adminWallet={publicKey!.toString()}
                apiBaseUrl={ADMIN_API_URL}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2">{t('admin.propertyName')}</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                  placeholder="Edifício Centro SP"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2">{t('admin.propertySymbol')}</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none uppercase"
                  placeholder="CENTRO"
                  value={createForm.symbol}
                  onChange={(e) => setCreateForm({ ...createForm, symbol: e.target.value.toUpperCase() })}
                  required
                  maxLength={10}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-solana-dark-300 mb-2">{t('admin.description')}</label>
                <textarea
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none resize-none"
                  placeholder="A detailed description of the property, its features, and investment highlights..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  maxLength={2000}
                />
                <p className="mt-1 text-xs text-solana-dark-500">
                  {createForm.description.length}/2000 characters
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2 flex items-center">
                  {t('admin.totalSupply')}
                  <InfoTooltip text="Calculado automaticamente: Valor Total ÷ Preço por Token. Este é o número total de tokens que representam o imóvel." />
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-solana-dark-700 border border-solana-dark-600 rounded-lg text-solana-dark-300 cursor-not-allowed"
                  placeholder="Auto-calculado"
                  value={createForm.totalSupply}
                  readOnly
                  required
                />
                <p className="mt-1 text-xs text-solana-dark-500">
                  ⚡ Calculado automaticamente
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2">{t('admin.propertyType')}</label>
                <select
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                  value={createForm.propertyType}
                  onChange={(e) => setCreateForm({ ...createForm, propertyType: e.target.value })}
                >
                  <option value="residential">{t('admin.residential')}</option>
                  <option value="commercial">{t('admin.commercial')}</option>
                  <option value="industrial">{t('admin.industrial')}</option>
                  <option value="mixed">{t('admin.mixedUse')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2">{t('admin.location')}</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                  placeholder="São Paulo, SP"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2">{t('admin.propertyAddress')}</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                  placeholder="Av. Paulista, 1000"
                  value={createForm.propertyAddress}
                  onChange={(e) => setCreateForm({ ...createForm, propertyAddress: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-solana-dark-300 mb-2 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1 text-solana-green-400" />
                  {t('admin.sellerWallet')}
                  <InfoTooltip text={t('admin.sellerWalletDescription')} />
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none font-mono"
                  placeholder="Ex: 7XxW...uCJw (endereço Solana)"
                  value={createForm.sellerWallet}
                  onChange={(e) => setCreateForm({ ...createForm, sellerWallet: e.target.value })}
                  required
                  minLength={32}
                  maxLength={44}
                />
                <p className="mt-1 text-xs text-solana-dark-400">
                  💰 {t('admin.sellerWalletHelp')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2 flex items-center">
                  {t('admin.totalValueUsd')}
                  <InfoTooltip text={t('admin.totalValueTooltip')} />
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                  placeholder="600000"
                  value={createForm.totalValueUsd}
                  onChange={(e) => setCreateForm({ ...createForm, totalValueUsd: e.target.value })}
                  required
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2 flex items-center">
                  {t('admin.valuePerToken')}
                  <InfoTooltip text={t('admin.valuePerTokenTooltip')} />
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                  placeholder="5.00"
                  value={createForm.valuePerToken}
                  onChange={(e) => setCreateForm({ ...createForm, valuePerToken: e.target.value })}
                  required
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2 flex items-center">
                  {t('admin.monthlyRent')}
                  <InfoTooltip text={t('admin.monthlyRentTooltip')} />
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                  placeholder="4250.00"
                  value={createForm.monthlyRent}
                  onChange={(e) => setCreateForm({ ...createForm, monthlyRent: e.target.value })}
                  min={0}
                />
                <p className="mt-1 text-xs text-solana-dark-500">
                  💡 {t('admin.monthlyRentHelp')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2 flex items-center">
                  {t('admin.annualYield')}
                  <InfoTooltip text={t('admin.annualYieldTooltip')} />
                </label>
                <input
                  type="number"
                  step="0.1"
                  className={`w-full px-4 py-3 border border-solana-dark-600 rounded-lg focus:outline-none ${
                    calculations.hasMonthlyRent
                      ? 'bg-solana-dark-700 text-solana-dark-300 cursor-not-allowed'
                      : 'bg-solana-dark-800 text-white focus:border-solana-purple-500'
                  }`}
                  placeholder="8.5"
                  value={createForm.annualYieldPercent}
                  onChange={(e) => setCreateForm({ ...createForm, annualYieldPercent: e.target.value })}
                  readOnly={calculations.hasMonthlyRent}
                  required
                  min={0}
                  max={100}
                />
                {calculations.hasMonthlyRent && (
                  <p className="mt-1 text-xs text-solana-green-400">
                    ⚡ Calculado: ${createForm.monthlyRent} × 12 ÷ ${createForm.totalValueUsd} = {calculations.calculatedYield.toFixed(2)}%
                  </p>
                )}
              </div>
            </div>

            {/* Calculated Summary */}
            {calculations.isValid && (
              <div className="bg-solana-dark-800/50 border border-solana-dark-600 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-solana-purple-400" />
                  <h4 className="text-white font-medium">{t('admin.autoCalculations')}</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-solana-dark-700/50 rounded-lg p-3">
                    <p className="text-xs text-solana-dark-400 mb-1 flex items-center">
                      {t('admin.totalTokens')}
                    </p>
                    <p className="text-lg font-bold text-white">{calculations.totalSupply.toLocaleString()}</p>
                  </div>
                  <div className="bg-solana-dark-700/50 rounded-lg p-3">
                    <p className="text-xs text-solana-dark-400 mb-1 flex items-center">
                      {t('admin.annualRevenue')}
                    </p>
                    <p className="text-lg font-bold text-solana-green-400">${calculations.annualRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="bg-solana-dark-700/50 rounded-lg p-3">
                    <p className="text-xs text-solana-dark-400 mb-1 flex items-center">
                      {t('admin.revenuePerTokenYear')}
                    </p>
                    <p className="text-lg font-bold text-solana-green-400">${calculations.revenuePerToken.toFixed(2)}</p>
                  </div>
                  <div className="bg-solana-dark-700/50 rounded-lg p-3">
                    <p className="text-xs text-solana-dark-400 mb-1 flex items-center">
                      {t('admin.revenuePerTokenMonth')}
                    </p>
                    <p className="text-lg font-bold text-solana-green-400">${calculations.monthlyPerToken.toFixed(3)}</p>
                  </div>
                </div>
                <p className="text-xs text-solana-dark-400 mt-3 text-center">
                  💡 {t('admin.exampleInvestment', { tokens: 10, value: (parseFloat(createForm.valuePerToken) * 10).toFixed(2), monthly: (calculations.monthlyPerToken * 10).toFixed(2) })}
                </p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting || isCreatingMetadata}
              disabled={uploadedImages.some((img) => img.isUploading || img.error)}
            >
              {isCreatingMetadata ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t('admin.creatingMetadata')}
                </>
              ) : isSubmitting ? (
                t('admin.creating')
              ) : (
                t('admin.create')
              )}
            </Button>
            {uploadedImages.some((img) => img.isUploading) && (
              <p className="text-xs text-center text-solana-dark-400">
                {t('admin.waitImagesUpload')}
              </p>
            )}
          </form>
        </Card>
      )}

      {/* Mint Tokens Form */}
      {activeTab === 'mint' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">{t('admin.mintTokens')}</h3>
          <form onSubmit={handleMintTokens} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">{t('admin.selectProperty')}</label>
              <select
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                value={mintForm.propertyMint}
                onChange={(e) => setMintForm({ ...mintForm, propertyMint: e.target.value })}
                required
              >
                <option value="">{t('admin.selectProperty')}</option>
                {properties.map((p) => (
                  <option key={p.mint} value={p.mint}>
                    {p.name} ({p.symbol}) - {parseInt(p.circulatingSupply).toLocaleString()}/{parseInt(p.totalSupply).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">{t('admin.recipientWallet')}</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none font-mono"
                placeholder="7XxW...uCJw"
                value={mintForm.investorWallet}
                onChange={(e) => setMintForm({ ...mintForm, investorWallet: e.target.value })}
                required
              />
              <p className="mt-1 text-xs text-solana-dark-400">
                {t('admin.investorKycRequired')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-solana-dark-300 mb-2">{t('admin.tokenAmount')}</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                placeholder="10000"
                value={mintForm.amount}
                onChange={(e) => setMintForm({ ...mintForm, amount: e.target.value })}
                required
                min={1}
              />
            </div>
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              {isSubmitting ? t('admin.minting_action') : t('admin.mint')}
            </Button>
          </form>
        </Card>
      )}

      {/* Deposit Revenue Form */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Info Card */}
          <Card className="p-6 bg-gradient-to-r from-solana-purple-500/10 to-solana-green-500/10 border-solana-purple-500/30">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-solana-purple-500/20 rounded-xl">
                <DollarSign className="w-6 h-6 text-solana-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{t('admin.revenueDistributionTitle')}</h3>
                <div className="text-sm text-solana-dark-300 space-y-2">
                  <p><strong>1. {t('admin.revenueDistributionEpoch')}</strong></p>
                  <p><strong>2. {t('admin.revenueDistributionSnapshot')}</strong></p>
                  <p><strong>3. {t('admin.revenueDistributionProportional')}</strong>: <code className="bg-solana-dark-800 px-1 rounded">(tokens_investidor / supply_total) × valor_depositado</code></p>
                  <p><strong>4. {t('admin.revenueDistributionClaim')}</strong></p>
                </div>
              </div>
            </div>
          </Card>

          {/* Form */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">{t('admin.depositRevenue')}</h3>
            <form onSubmit={handleDepositRevenue} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2">{t('admin.property')}</label>
                <select
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                  value={revenueForm.propertyMint}
                  onChange={(e) => setRevenueForm({ ...revenueForm, propertyMint: e.target.value })}
                  required
                >
                  <option value="">{t('admin.selectAProperty')}</option>
                  {properties.map((p) => (
                    <option key={p.mint} value={p.mint}>
                      {p.name} ({p.symbol}) - {parseInt(p.circulatingSupply).toLocaleString()} {t('admin.tokensInCirculation')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Property Info */}
              {revenueForm.propertyMint && (() => {
                const selectedProperty = properties.find(p => p.mint === revenueForm.propertyMint);
                if (!selectedProperty) return null;
                const circulatingSupply = parseInt(selectedProperty.circulatingSupply);
                const amountSol = parseFloat(revenueForm.amountSol) || 0;
                const perToken = circulatingSupply > 0 ? amountSol / circulatingSupply : 0;

                return (
                  <div className="bg-solana-dark-800/50 border border-solana-dark-600 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-solana-dark-300 mb-3">{t('admin.propertyDetails')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-solana-dark-400">{t('admin.totalSupply')}</p>
                        <p className="text-white font-medium">{parseInt(selectedProperty.totalSupply).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-solana-dark-400">{t('admin.circulatingSupply')}</p>
                        <p className="text-white font-medium">{circulatingSupply.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-solana-dark-400">{t('admin.totalValue')}</p>
                        <p className="text-white font-medium">${selectedProperty.details.totalValueUsd.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-solana-dark-400">{t('admin.yield')}</p>
                        <p className="text-white font-medium">{selectedProperty.details.annualYieldPercent}%</p>
                      </div>
                    </div>
                    {amountSol > 0 && circulatingSupply > 0 && (
                      <div className="mt-4 pt-4 border-t border-solana-dark-600">
                        <div className="flex items-center justify-between">
                          <span className="text-solana-dark-400">{t('admin.valuePerTokenLabel')}</span>
                          <span className="text-solana-green-400 font-bold">{perToken.toFixed(8)} SOL</span>
                        </div>
                        <p className="text-xs text-solana-dark-500 mt-1">
                          {t('admin.investorExample', { tokens: '10,000', amount: (perToken * 10000).toFixed(4) })}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2 flex items-center">
                  {t('admin.epochNumber')}
                  <InfoTooltip text={t('admin.epochTooltip')} />
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                  placeholder="1"
                  value={revenueForm.epochNumber}
                  onChange={(e) => setRevenueForm({ ...revenueForm, epochNumber: e.target.value })}
                  required
                  min={1}
                />
                {revenueForm.propertyMint && (() => {
                  const selectedProperty = properties.find(p => p.mint === revenueForm.propertyMint);
                  const nextEpoch = (selectedProperty?.currentEpoch || 0) + 1;
                  return (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-xs text-solana-dark-400">
                        💡 {t('admin.nextEpochSuggestion')} <span className="text-solana-purple-400 font-bold">#{nextEpoch}</span>
                      </p>
                      <button
                        type="button"
                        className="text-xs text-solana-purple-400 hover:text-solana-purple-300 underline"
                        onClick={() => setRevenueForm({ ...revenueForm, epochNumber: nextEpoch.toString() })}
                      >
                        {t('admin.useEpoch', { number: nextEpoch })}
                      </button>
                    </div>
                  );
                })()}
                <p className="mt-1 text-xs text-yellow-400">
                  ⚠️ {t('admin.epochWarning')}
                </p>
              </div>

              {/* SOL Price Oracle Card */}
              <div className="bg-gradient-to-r from-solana-purple-500/10 to-solana-green-500/10 border border-solana-purple-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-solana flex items-center justify-center">
                      <span className="text-white font-bold text-xs">◎</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t('admin.solQuote')}</p>
                      <p className="text-xs text-solana-dark-400">{t('admin.viaCoinGecko')}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchSolPrice}
                    disabled={isFetchingSolPrice}
                    leftIcon={<RefreshCw className={`w-3 h-3 ${isFetchingSolPrice ? 'animate-spin' : ''}`} />}
                  >
                    {t('admin.update')}
                  </Button>
                </div>
                {solPrice.brl > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-solana-dark-800/50 rounded-lg p-3">
                      <p className="text-xs text-solana-dark-400">1 SOL =</p>
                      <p className="text-xl font-bold text-solana-green-400">R$ {solPrice.brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-solana-dark-800/50 rounded-lg p-3">
                      <p className="text-xs text-solana-dark-400">1 SOL =</p>
                      <p className="text-xl font-bold text-white">$ {solPrice.usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 text-solana-dark-400">
                    {isFetchingSolPrice ? t('admin.fetchingQuote') : t('admin.clickToFetch')}
                  </div>
                )}
                {solPrice.lastUpdated && (
                  <p className="text-xs text-solana-dark-500 mt-2 text-center">
                    {t('admin.lastUpdate')} {solPrice.lastUpdated.toLocaleTimeString('pt-BR')}
                  </p>
                )}
              </div>

              {/* BRL to SOL Calculator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-solana-dark-300 mb-2 flex items-center">
                    💰 {t('admin.rentValueBrl')}
                    <InfoTooltip text={t('admin.rentValueBrlTooltip')} />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none"
                    placeholder="2000.00"
                    value={revenueForm.amountBrl}
                    onChange={(e) => setRevenueForm({ ...revenueForm, amountBrl: e.target.value })}
                    min={0}
                  />
                  <p className="mt-1 text-xs text-solana-dark-400">
                    {t('admin.originalRentValue')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-solana-dark-300 mb-2 flex items-center">
                    ◎ {t('admin.valueSol')}
                    <InfoTooltip text={t('admin.valueSolTooltip')} />
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    className={`w-full px-4 py-3 border border-solana-dark-600 rounded-lg text-white focus:border-solana-purple-500 focus:outline-none ${
                      revenueForm.amountBrl && solPrice.brl > 0
                        ? 'bg-solana-dark-700'
                        : 'bg-solana-dark-800'
                    }`}
                    placeholder="0.1"
                    value={revenueForm.amountSol}
                    onChange={(e) => setRevenueForm({ ...revenueForm, amountSol: e.target.value, amountBrl: '' })}
                    required
                    min={0.000001}
                  />
                  {revenueForm.amountBrl && solPrice.brl > 0 && (
                    <p className="mt-1 text-xs text-solana-green-400">
                      ⚡ {t('admin.calculatedValue')} R$ {parseFloat(revenueForm.amountBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ÷ R$ {solPrice.brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-solana-dark-400">
                    ⚠️ {t('admin.transferWarning')}
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting} variant="success">
                {isSubmitting ? t('admin.depositing') : `${t('admin.deposit')} ${revenueForm.amountSol || '0'} SOL`}
              </Button>
            </form>
          </Card>

          {/* Recent Deposits Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{t('admin.flowExample')}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-solana-dark-800/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-solana-purple-500/20 flex items-center justify-center text-solana-purple-400 font-bold">1</div>
                <div>
                  <p className="text-white">{t('admin.flowStep1', { amount: '0.1', epoch: '1' })}</p>
                  <p className="text-solana-dark-400">{t('admin.flowStep1Detail', { supply: '250,000' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-solana-dark-800/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-solana-green-500/20 flex items-center justify-center text-solana-green-400 font-bold">2</div>
                <div>
                  <p className="text-white">{t('admin.flowStep2', { tokens: '125,000', percent: '50' })}</p>
                  <p className="text-solana-dark-400">{t('admin.flowStep2Detail', { amount: '0.05' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-solana-dark-800/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">3</div>
                <div>
                  <p className="text-white">{t('admin.flowStep3')}</p>
                  <p className="text-solana-dark-400">{t('admin.flowStep3Detail')}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
