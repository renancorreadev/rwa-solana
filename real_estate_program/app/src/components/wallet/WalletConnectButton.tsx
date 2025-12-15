import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base';
import {
  Wallet,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Check,
  X,
  Loader2
} from 'lucide-react';

export const WalletConnectButton: FC = () => {
  const {
    wallet,
    wallets,
    publicKey,
    connected,
    connecting,
    disconnect,
    select
  } = useWallet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleWalletSelect = useCallback(async (walletName: WalletName) => {
    select(walletName);
    setIsModalOpen(false);
  }, [select]);

  const handleCopyAddress = useCallback(async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [publicKey]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setIsDropdownOpen(false);
  }, [disconnect]);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Filter and sort wallets
  const installedWallets = wallets.filter(
    w => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable
  );
  const otherWallets = wallets.filter(
    w => w.readyState !== WalletReadyState.Installed && w.readyState !== WalletReadyState.Loadable
  );

  // Connected state - show dropdown
  if (connected && publicKey) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 h-10 px-3 sm:px-4 rounded-xl
                     bg-solana-dark-800 border border-solana-dark-700
                     hover:bg-solana-dark-700 hover:border-solana-dark-600
                     transition-all duration-200 group"
        >
          {/* Wallet icon */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-solana-green-500 to-solana-purple-500
                          flex items-center justify-center">
            {wallet?.adapter.icon ? (
              <img
                src={wallet.adapter.icon}
                alt={wallet.adapter.name}
                className="w-4 h-4 rounded-full"
              />
            ) : (
              <Wallet className="w-3 h-3 text-white" />
            )}
          </div>

          {/* Address - hidden on mobile */}
          <span className="hidden sm:block text-sm font-medium text-white">
            {shortenAddress(publicKey.toString())}
          </span>

          <ChevronDown className={`w-4 h-4 text-solana-dark-400 transition-transform duration-200
                                   ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 py-2
                          bg-solana-dark-800 border border-solana-dark-700
                          rounded-xl shadow-2xl shadow-black/50
                          animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            {/* Address display */}
            <div className="px-4 py-3 border-b border-solana-dark-700">
              <p className="text-xs text-solana-dark-400 mb-1">Conectado como</p>
              <p className="text-sm font-mono text-white truncate">
                {publicKey.toString()}
              </p>
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={handleCopyAddress}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                           hover:bg-solana-dark-700 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-solana-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-solana-dark-400" />
                )}
                <span className="text-sm text-white">
                  {copied ? 'Copiado!' : 'Copiar endereço'}
                </span>
              </button>

              <a
                href={`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                           hover:bg-solana-dark-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-solana-dark-400" />
                <span className="text-sm text-white">Ver no Explorer</span>
              </a>

              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                           hover:bg-solana-dark-700 transition-colors text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Desconectar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Connecting state
  if (connecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 h-10 px-4 rounded-xl
                   bg-gradient-to-r from-solana-green-500 to-solana-purple-500
                   text-white font-medium text-sm opacity-80"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="hidden sm:block">Conectando...</span>
      </button>
    );
  }

  // Disconnected state - show connect button
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 h-10 px-4 rounded-xl
                   bg-gradient-to-r from-solana-green-500 to-solana-purple-500
                   hover:from-solana-green-400 hover:to-solana-purple-400
                   text-white font-medium text-sm
                   shadow-lg shadow-solana-purple-500/25
                   hover:shadow-xl hover:shadow-solana-purple-500/30
                   transition-all duration-200 hover:scale-[1.02]"
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:block">Conectar</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              maxHeight: '85vh',
              backgroundColor: '#1a1a2e',
              border: '1px solid #2d2d44',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-solana-dark-800">
                <div>
                  <h2 className="text-xl font-semibold text-white">Conectar Carteira</h2>
                  <p className="text-sm text-solana-dark-400 mt-0.5">
                    Escolha sua carteira preferida
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-solana-dark-800 transition-colors"
                >
                  <X className="w-5 h-5 text-solana-dark-400" />
                </button>
              </div>

              {/* Wallet List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Installed Wallets */}
                {installedWallets.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-solana-dark-400 uppercase tracking-wider px-1 mb-3">
                      Detectadas
                    </p>
                    {installedWallets.map((w) => (
                      <button
                        key={w.adapter.name}
                        onClick={() => handleWalletSelect(w.adapter.name)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl
                                 bg-solana-dark-800/50 border border-solana-dark-700
                                 hover:bg-solana-dark-800 hover:border-solana-dark-600
                                 transition-all duration-200 group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-solana-dark-700
                                      flex items-center justify-center overflow-hidden
                                      group-hover:scale-105 transition-transform">
                          {w.adapter.icon ? (
                            <img
                              src={w.adapter.icon}
                              alt={w.adapter.name}
                              className="w-8 h-8"
                            />
                          ) : (
                            <Wallet className="w-6 h-6 text-solana-dark-400" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-white group-hover:text-solana-green-400
                                      transition-colors">
                            {w.adapter.name}
                          </p>
                          <p className="text-xs text-solana-green-500">Instalada</p>
                        </div>
                        <ChevronDown className="w-5 h-5 text-solana-dark-500 -rotate-90
                                              group-hover:text-solana-green-400
                                              group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Other Wallets */}
                {otherWallets.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-medium text-solana-dark-400 uppercase tracking-wider px-1 mb-3">
                      Outras Opções
                    </p>
                    {otherWallets.slice(0, 4).map((w) => (
                      <button
                        key={w.adapter.name}
                        onClick={() => handleWalletSelect(w.adapter.name)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl
                                 bg-solana-dark-800/30 border border-solana-dark-800
                                 hover:bg-solana-dark-800/50 hover:border-solana-dark-700
                                 transition-all duration-200 group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-solana-dark-800
                                      flex items-center justify-center overflow-hidden
                                      group-hover:scale-105 transition-transform">
                          {w.adapter.icon ? (
                            <img
                              src={w.adapter.icon}
                              alt={w.adapter.name}
                              className="w-8 h-8 opacity-70 group-hover:opacity-100 transition-opacity"
                            />
                          ) : (
                            <Wallet className="w-6 h-6 text-solana-dark-500" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-solana-dark-300 group-hover:text-white
                                      transition-colors">
                            {w.adapter.name}
                          </p>
                          <p className="text-xs text-solana-dark-500">Clique para instalar</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-solana-dark-600
                                               group-hover:text-solana-dark-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {wallets.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-solana-dark-800
                                  flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-solana-dark-500" />
                    </div>
                    <p className="text-solana-dark-400">
                      Nenhuma carteira encontrada
                    </p>
                    <p className="text-sm text-solana-dark-500 mt-1">
                      Instale Phantom ou outra carteira Solana
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-solana-dark-800 bg-solana-dark-900/50">
                <p className="text-xs text-solana-dark-500 text-center">
                  Ao conectar, você concorda com os{' '}
                  <a href="#" className="text-solana-purple-400 hover:underline">
                    Termos de Uso
                  </a>
                </p>
              </div>
          </div>
        </div>
      )}
    </>
  );
};
