import type { ReactNode } from 'react';
import { useCredential } from '../context/CredentialContext';
import { CredentialType } from '../types/credential';

interface CredentialGateProps {
  children: ReactNode;
  requiredType?: CredentialType;
  fallback?: ReactNode;
}

export function CredentialGate({ children, requiredType, fallback }: CredentialGateProps) {
  const { state, hasValidCredential, openModal } = useCredential();

  if (state.loading) {
    return (
      <div className="hcp-gate-loading">
        <div className="hcp-spinner" />
        <p>Checking credentials...</p>
      </div>
    );
  }

  if (!hasValidCredential(requiredType)) {
    return fallback || (
      <div className="hcp-gate-blocked">
        <div className="hcp-gate-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M24 14v8M24 26v2" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h3>Verification Required</h3>
        <p>You need to verify your identity to access this content.</p>
        <button className="hcp-btn hcp-btn-primary" onClick={openModal}>
          Start Verification
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
