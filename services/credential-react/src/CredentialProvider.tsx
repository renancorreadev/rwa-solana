import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, setProvider } from '@coral-xyz/anchor';
import type { CredentialConfig, CredentialState, UserCredential, UseCredentialReturn } from './types';
import { CredentialType } from './types';

// Default Program ID for Hub Credential Protocol
const DEFAULT_PROGRAM_ID = new PublicKey('FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt');

// IDL for the credential program
const IDL = {
  version: '0.1.0',
  name: 'credential_program',
  address: 'FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt',
  instructions: [],
  accounts: [
    {
      name: 'userCredential',
      discriminator: [32, 75, 63, 68, 96, 181, 255, 188],
    },
  ],
  types: [],
};

const CredentialContext = createContext<UseCredentialReturn | undefined>(undefined);

interface CredentialProviderProps {
  children: ReactNode;
  config: CredentialConfig;
}

const defaultState: CredentialState = {
  credential: null,
  loading: false,
  error: null,
  isVerified: false,
};

/**
 * Provider component that manages credential state and operations.
 * Wrap your app with this provider to enable credential functionality.
 *
 * @example
 * ```tsx
 * <CredentialProvider config={{
 *   network: 'devnet',
 *   theme: 'dark',
 *   onSuccess: (credential) => console.log('Verified!', credential)
 * }}>
 *   <App />
 * </CredentialProvider>
 * ```
 */
export function CredentialProvider({ children, config }: CredentialProviderProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [state, setState] = useState<CredentialState>(defaultState);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getProgramId = useCallback(() => {
    return config.programId ? new PublicKey(config.programId) : DEFAULT_PROGRAM_ID;
  }, [config.programId]);

  const getProgram = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }

    const provider = new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      },
      { commitment: 'confirmed' }
    );
    setProvider(provider);

    return new Program(IDL as any, provider);
  }, [connection, wallet]);

  const getCredentialPda = useCallback((holder: PublicKey) => {
    const programId = getProgramId();
    const [credentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('credential'), holder.toBuffer()],
      programId
    );
    return credentialPda;
  }, [getProgramId]);

  const fetchCredential = useCallback(async () => {
    if (!wallet.publicKey) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const program = getProgram();
      if (!program) {
        throw new Error('Program not initialized');
      }

      const credentialPda = getCredentialPda(wallet.publicKey);

      try {
        const credentialAccount = await (program.account as any).userCredential.fetch(credentialPda);

        const credential: UserCredential = {
          holder: credentialAccount.holder,
          issuer: credentialAccount.issuer,
          credentialType: Object.keys(credentialAccount.credentialType)[0] as CredentialType,
          status: Object.keys(credentialAccount.status)[0] as any,
          issuedAt: credentialAccount.issuedAt,
          expiresAt: credentialAccount.expiresAt,
          lastVerifiedAt: credentialAccount.lastVerifiedAt,
          metadataUri: credentialAccount.metadataUri,
          revocationReason: credentialAccount.revocationReason,
          bump: credentialAccount.bump,
        };

        // Check if expired
        const now = Math.floor(Date.now() / 1000);
        const isExpired = credential.expiresAt.toNumber() < now;
        const isActive = credential.status === 'active' && !isExpired;

        setState({
          credential,
          loading: false,
          error: null,
          isVerified: isActive,
        });

        if (isActive && config.onSuccess) {
          config.onSuccess(credential);
        }
      } catch {
        // Account doesn't exist - user has no credential
        setState({
          credential: null,
          loading: false,
          error: null,
          isVerified: false,
        });
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      if (config.onError) {
        config.onError(error);
      }
    }
  }, [wallet.publicKey, getProgram, getCredentialPda, config]);

  const verifyCredential = useCallback(async (): Promise<boolean> => {
    if (!wallet.publicKey || !state.credential) {
      return false;
    }

    try {
      const program = getProgram();
      if (!program) {
        return false;
      }

      const credentialPda = getCredentialPda(wallet.publicKey);

      await program.methods
        .verifyCredential()
        .accounts({
          holder: wallet.publicKey,
          credential: credentialPda,
        })
        .rpc();

      await fetchCredential();
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [wallet.publicKey, state.credential, getProgram, getCredentialPda, fetchCredential]);

  const hasValidCredential = useCallback((type?: CredentialType): boolean => {
    if (!state.credential || !state.isVerified) {
      return false;
    }

    if (type && state.credential.credentialType !== type) {
      return false;
    }

    return true;
  }, [state.credential, state.isVerified]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    if (config.onClose) {
      config.onClose();
    }
  }, [config]);

  // Auto-fetch credential when wallet connects
  useEffect(() => {
    if (wallet.publicKey) {
      fetchCredential();
    } else {
      setState(defaultState);
    }
  }, [wallet.publicKey, fetchCredential]);

  return (
    <CredentialContext.Provider
      value={{
        state,
        config,
        fetchCredential,
        verifyCredential,
        hasValidCredential,
        openModal,
        closeModal,
        isModalOpen,
      }}
    >
      {children}
    </CredentialContext.Provider>
  );
}

/**
 * Hook to access credential state and operations.
 * Must be used within a CredentialProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { state, openModal, hasValidCredential } = useCredential();
 *
 *   if (state.loading) return <Spinner />;
 *   if (!hasValidCredential()) return <button onClick={openModal}>Verify</button>;
 *
 *   return <div>Welcome, verified user!</div>;
 * }
 * ```
 */
export function useCredential(): UseCredentialReturn {
  const context = useContext(CredentialContext);
  if (!context) {
    throw new Error('useCredential must be used within a CredentialProvider');
  }
  return context;
}
