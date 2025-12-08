import type { CSSProperties, ReactNode } from 'react';
import { useCredential } from './CredentialProvider';

interface CredentialButtonProps {
  /** Button label when not verified */
  label?: string;
  /** Button label when verified */
  verifiedLabel?: string;
  /** Custom children (overrides labels) */
  children?: ReactNode;
  /** Additional styles */
  style?: CSSProperties;
  /** Custom class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
}

const baseButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px 24px',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: 'none',
};

const variants: Record<string, CSSProperties> = {
  primary: {
    background: '#6366f1',
    color: 'white',
  },
  secondary: {
    background: '#f3f4f6',
    color: '#1f2937',
  },
  outline: {
    background: 'transparent',
    color: '#6366f1',
    border: '2px solid #6366f1',
  },
};

const verifiedStyle: CSSProperties = {
  background: '#10b981',
  color: 'white',
};

const StatusIcon = ({ verified }: { verified: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    {verified ? (
      <>
        <circle cx="9" cy="9" r="8" fill="currentColor" fillOpacity="0.2" />
        <path d="M5 9l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      <>
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 5v4M9 12v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    )}
  </svg>
);

/**
 * Button component for credential verification.
 * Shows different states based on credential status.
 *
 * @example
 * ```tsx
 * <CredentialButton />
 * ```
 *
 * @example With custom labels
 * ```tsx
 * <CredentialButton
 *   label="Get Verified"
 *   verifiedLabel="Verified!"
 *   variant="outline"
 * />
 * ```
 */
export function CredentialButton({
  label = 'Verify Identity',
  verifiedLabel = 'Verified',
  children,
  style,
  className,
  disabled,
  variant = 'primary',
}: CredentialButtonProps) {
  const { state, openModal, hasValidCredential } = useCredential();
  const isVerified = hasValidCredential();

  const buttonStyle: CSSProperties = {
    ...baseButtonStyle,
    ...(isVerified ? verifiedStyle : variants[variant]),
    ...style,
    ...(disabled || state.loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
  };

  const handleClick = () => {
    if (!disabled && !state.loading && !isVerified) {
      openModal();
    }
  };

  return (
    <button
      style={buttonStyle}
      className={className}
      onClick={handleClick}
      disabled={disabled || state.loading}
      type="button"
    >
      {state.loading ? (
        <>
          <span
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'hcp-spin 0.8s linear infinite',
            }}
          />
          Checking...
        </>
      ) : children ? (
        children
      ) : (
        <>
          <StatusIcon verified={isVerified} />
          {isVerified ? verifiedLabel : label}
        </>
      )}
    </button>
  );
}
