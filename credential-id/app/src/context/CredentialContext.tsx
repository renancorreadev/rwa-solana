import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, setProvider } from '@coral-xyz/anchor';
import { CredentialType, type CredentialState, type UserCredential, type CredentialModalConfig } from '../types/credential';
import IDL from '../credential_program.json';

const PROGRAM_ID = new PublicKey('FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt');

interface CredentialContextType {
  state: CredentialState;
  config: CredentialModalConfig | null;
  fetchCredential: () => Promise<void>;
  verifyCredential: () => Promise<boolean>;
  hasValidCredential: (type?: CredentialType) => boolean;
  openModal: () => void;
  closeModal: () => void;
  isModalOpen: boolean;
}

const defaultState: CredentialState = {
  credential: null,
  loading: false,
  error: null,
  isVerified: false,
};

const CredentialContext = createContext<CredentialContextType | undefined>(undefined);

interface CredentialProviderProps {
  children: ReactNode;
  config: CredentialModalConfig;
}

export function CredentialProvider({ children, config }: CredentialProviderProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [state, setState] = useState<CredentialState>(defaultState);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

// Program ID is derived from IDL
    return new Program(IDL as any, provider);
  }, [connection, wallet, config.programId]);

  const getCredentialPda = useCallback((holder: PublicKey) => {
    const programId = config.programId ? new PublicKey(config.programId) : PROGRAM_ID;
    const [credentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('credential'), holder.toBuffer()],
      programId
    );
    return credentialPda;
  }, [config.programId]);

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
      } catch (e: any) {
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
  }, [wallet.publicKey]);

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

export function useCredential() {
  const context = useContext(CredentialContext);
  if (!context) {
    throw new Error('useCredential must be used within a CredentialProvider');
  }
  return context;
}
