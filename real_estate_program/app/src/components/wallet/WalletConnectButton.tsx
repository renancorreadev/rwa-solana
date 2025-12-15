import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

// Modal rendered via Portal to escape stacking context
const WalletModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  installedWallets: any[];
  otherWallets: any[];
  onSelect: (name: WalletName) => void;
}> = ({ isOpen, onClose, installedWallets, otherWallets, onSelect }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
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
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          maxHeight: 'calc(100vh - 64px)',
          backgroundColor: '#0a0a14',
          borderRadius: '20px',
          border: '1px solid rgba(45, 45, 68, 0.8)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: '1px solid rgba(45, 45, 68, 0.5)',
          }}
        >
          <div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>
              Conectar Carteira
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px', margin: '6px 0 0' }}>
              Escolha sua carteira preferida
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(45, 45, 68, 0.5)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(45, 45, 68, 0.8)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(45, 45, 68, 0.5)')}
          >
            <X style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
          </button>
        </div>

        {/* Wallet List */}
        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {installedWallets.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '12px',
                  paddingLeft: '4px',
                }}
              >
                Detectadas
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {installedWallets.map((w) => (
                  <button
                    key={w.adapter.name}
                    onClick={() => onSelect(w.adapter.name)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(26, 26, 46, 0.6)',
                      border: '1px solid rgba(45, 45, 68, 0.8)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(26, 26, 46, 0.9)';
                      e.currentTarget.style.borderColor = 'rgba(20, 241, 149, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(26, 26, 46, 0.6)';
                      e.currentTarget.style.borderColor = 'rgba(45, 45, 68, 0.8)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(45, 45, 68, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {w.adapter.icon ? (
                        <img
                          src={w.adapter.icon}
                          alt={w.adapter.name}
                          style={{ width: '28px', height: '28px' }}
                        />
                      ) : (
                        <Wallet style={{ width: '22px', height: '22px', color: '#6b7280' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ color: '#fff', fontWeight: 500, fontSize: '15px', margin: 0 }}>
                        {w.adapter.name}
                      </p>
                      <p style={{ color: '#14f195', fontSize: '12px', marginTop: '4px', margin: '4px 0 0' }}>
                        Instalada
                      </p>
                    </div>
                    <ChevronDown
                      style={{
                        width: '20px',
                        height: '20px',
                        color: '#6b7280',
                        transform: 'rotate(-90deg)',
                        flexShrink: 0,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {otherWallets.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '12px',
                  paddingLeft: '4px',
                }}
              >
                Outras Opções
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {otherWallets.slice(0, 4).map((w) => (
                  <button
                    key={w.adapter.name}
                    onClick={() => onSelect(w.adapter.name)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(26, 26, 46, 0.3)',
                      border: '1px solid rgba(26, 26, 46, 0.6)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(26, 26, 46, 0.5)';
                      e.currentTarget.style.borderColor = 'rgba(45, 45, 68, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(26, 26, 46, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(26, 26, 46, 0.6)';
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(26, 26, 46, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {w.adapter.icon ? (
                        <img
                          src={w.adapter.icon}
                          alt={w.adapter.name}
                          style={{ width: '28px', height: '28px', opacity: 0.6 }}
                        />
                      ) : (
                        <Wallet style={{ width: '22px', height: '22px', color: '#4b5563' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ color: '#9ca3af', fontWeight: 500, fontSize: '15px', margin: 0 }}>
                        {w.adapter.name}
                      </p>
                      <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', margin: '4px 0 0' }}>
                        Clique para instalar
                      </p>
                    </div>
                    <ExternalLink style={{ width: '16px', height: '16px', color: '#4b5563', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {installedWallets.length === 0 && otherWallets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(26, 26, 46, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <Wallet style={{ width: '36px', height: '36px', color: '#4b5563' }} />
              </div>
              <p style={{ color: '#9ca3af', fontSize: '16px', margin: 0 }}>Nenhuma carteira encontrada</p>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
                Instale Phantom ou outra carteira Solana
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(45, 45, 68, 0.5)',
            backgroundColor: 'rgba(10, 10, 20, 0.5)',
          }}
        >
          <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
            Ao conectar, você concorda com os{' '}
            <a href="#" style={{ color: '#9945ff', textDecoration: 'none' }}>
              Termos de Uso
            </a>
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWalletSelect = useCallback((walletName: WalletName) => {
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

  const shortenAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

  const installedWallets = wallets.filter(
    w => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable
  );
  const otherWallets = wallets.filter(
    w => w.readyState !== WalletReadyState.Installed && w.readyState !== WalletReadyState.Loadable
  );

  if (connected && publicKey) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 h-10 px-3 sm:px-4 rounded-xl
                     bg-solana-dark-800 border border-solana-dark-700
                     hover:bg-solana-dark-700 hover:border-solana-dark-600
                     transition-all duration-200"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-solana-green-500 to-solana-purple-500 flex items-center justify-center">
            {wallet?.adapter.icon ? (
              <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-4 h-4 rounded-full" />
            ) : (
              <Wallet className="w-3 h-3 text-white" />
            )}
          </div>
          <span className="hidden sm:block text-sm font-medium text-white">
            {shortenAddress(publicKey.toString())}
          </span>
          <ChevronDown className={`w-4 h-4 text-solana-dark-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 py-2 bg-solana-dark-800 border border-solana-dark-700 rounded-xl shadow-2xl z-[100]">
            <div className="px-4 py-3 border-b border-solana-dark-700">
              <p className="text-xs text-solana-dark-400 mb-1">Conectado como</p>
              <p className="text-sm font-mono text-white truncate">{publicKey.toString()}</p>
            </div>
            <div className="py-1">
              <button onClick={handleCopyAddress} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-solana-dark-700 transition-colors">
                {copied ? <Check className="w-4 h-4 text-solana-green-400" /> : <Copy className="w-4 h-4 text-solana-dark-400" />}
                <span className="text-sm text-white">{copied ? 'Copiado!' : 'Copiar endereço'}</span>
              </button>
              <a
                href={`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-solana-dark-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-solana-dark-400" />
                <span className="text-sm text-white">Ver no Explorer</span>
              </a>
              <button onClick={handleDisconnect} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-solana-dark-700 transition-colors text-red-400">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Desconectar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (connecting) {
    return (
      <button disabled className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-solana-green-500 to-solana-purple-500 text-white font-medium text-sm opacity-80">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="hidden sm:block">Conectando...</span>
      </button>
    );
  }

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

      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        installedWallets={installedWallets}
        otherWallets={otherWallets}
        onSelect={handleWalletSelect}
      />
    </>
  );
};
