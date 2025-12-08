import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import { CredentialProvider } from './context/CredentialContext';
import { CredentialModal, CredentialGate } from './components';
import { CredentialType } from './types/credential';

import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

function AppContent() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
            <path d="M10 16l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Hub Credential</span>
        </div>
        <WalletMultiButton />
      </header>

      <main className="app-main">
        <section className="hero">
          <h1>Hub Credential Protocol</h1>
          <p>On-chain identity verification for real estate tokenization</p>
        </section>

        <section className="demo-section">
          <h2>Demo: Protected Content</h2>
          <div className="demo-card">
            <CredentialGate requiredType={CredentialType.KycBasic}>
              <div className="protected-content">
                <h3>Premium Investment Opportunity</h3>
                <p>This content is only visible to verified users with KYC credentials.</p>
                <div className="investment-details">
                  <div className="detail">
                    <span className="label">Property</span>
                    <span className="value">Luxury Apartment - São Paulo</span>
                  </div>
                  <div className="detail">
                    <span className="label">Token Price</span>
                    <span className="value">$100 USDC</span>
                  </div>
                  <div className="detail">
                    <span className="label">Expected Return</span>
                    <span className="value">12% APY</span>
                  </div>
                </div>
                <button className="invest-btn">Invest Now</button>
              </div>
            </CredentialGate>
          </div>
        </section>

        <section className="features">
          <h2>Why Hub Credential?</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <h3>On-Chain Privacy</h3>
              <p>Your credentials are stored on Solana blockchain without exposing personal data.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Regulatory Compliance</h3>
              <p>Meet KYC/AML requirements for tokenized securities and real estate.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
              <h3>Cross-Platform</h3>
              <p>Use your credential across multiple marketplaces in the Hub ecosystem.</p>
            </div>
          </div>
        </section>
      </main>

      <CredentialModal />
    </div>
  );
}

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => {
    // Use localnet for development
    if (import.meta.env.DEV) {
      return 'http://localhost:8899';
    }
    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  const credentialConfig = {
    network: import.meta.env.DEV ? 'localnet' as const : 'devnet' as const,
    programId: 'FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt',
    requiredCredentialType: CredentialType.KycBasic,
    theme: 'light' as const,
    onSuccess: (credential: any) => {
      console.log('Credential verified:', credential);
    },
    onError: (error: Error) => {
      console.error('Credential error:', error);
    },
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <CredentialProvider config={credentialConfig}>
            <AppContent />
          </CredentialProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
