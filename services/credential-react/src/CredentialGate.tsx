import type { ReactNode, CSSProperties } from 'react';
import { useCredential } from './CredentialProvider';
import type { CredentialType } from './types';

interface CredentialGateProps {
  /** Content to show when credential is valid */
  children: ReactNode;
  /** Required credential type (optional) */
  requiredType?: CredentialType;
  /** Custom fallback content when not verified */
  fallback?: ReactNode;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Custom styles for the gate container */
  style?: CSSProperties;
  /** Custom class name */
  className?: string;
}

const defaultStyles: Record<string, CSSProperties> = {
  container: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  icon: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '8px',
    color: 'inherit',
  },
  description: {
    color: '#666',
    marginBottom: '24px',
    fontSize: '14px',
  },
  button: {
    padding: '14px 32px',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e5e5',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'hcp-spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
};

/**
 * Component that gates content behind credential verification.
 * Shows the children only when the user has a valid credential.
 *
 * @example
 * ```tsx
 * <CredentialGate requiredType={CredentialType.KycBasic}>
 *   <SecretContent />
 * </CredentialGate>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <CredentialGate
 *   fallback={<CustomVerificationPrompt />}
 * >
 *   <ProtectedContent />
 * </CredentialGate>
 * ```
 */
export function CredentialGate({
  children,
  requiredType,
  fallback,
  loadingComponent,
  style,
  className,
}: CredentialGateProps) {
  const { state, hasValidCredential, openModal } = useCredential();

  if (state.loading) {
    return loadingComponent || (
      <div style={{ ...defaultStyles.container, ...style }} className={className}>
        <div style={defaultStyles.spinner} />
        <p style={defaultStyles.description}>Checking credentials...</p>
      </div>
    );
  }

  if (!hasValidCredential(requiredType)) {
    return fallback || (
      <div style={{ ...defaultStyles.container, ...style }} className={className}>
        <div style={defaultStyles.icon}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M24 14v8M24 26v2" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h3 style={defaultStyles.title}>Verification Required</h3>
        <p style={defaultStyles.description}>
          You need to verify your identity to access this content.
        </p>
        <button style={defaultStyles.button} onClick={openModal}>
          Start Verification
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
