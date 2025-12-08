import type { CSSProperties } from 'react';
import { useCredential } from './CredentialProvider';
import { CredentialType } from './types';

interface CredentialStatusProps {
  /** Show credential type */
  showType?: boolean;
  /** Show expiration date */
  showExpiry?: boolean;
  /** Custom styles */
  style?: CSSProperties;
  /** Custom class name */
  className?: string;
  /** Compact mode */
  compact?: boolean;
}

const statusColors: Record<string, string> = {
  active: '#10b981',
  expired: '#f59e0b',
  revoked: '#ef4444',
  suspended: '#f59e0b',
  none: '#6b7280',
};

const getCredentialTypeLabel = (type?: string): string => {
  switch (type) {
    case CredentialType.KycBasic: return 'Basic KYC';
    case CredentialType.KycFull: return 'Full KYC';
    case CredentialType.AccreditedInvestor: return 'Accredited Investor';
    case CredentialType.QualifiedPurchaser: return 'Qualified Purchaser';
    case CredentialType.BrazilianCpf: return 'CPF Verified';
    case CredentialType.BrazilianCnpj: return 'CNPJ Verified';
    default: return 'Unknown';
  }
};

/**
 * Component that displays the current credential status.
 *
 * @example
 * ```tsx
 * <CredentialStatus showType showExpiry />
 * ```
 */
export function CredentialStatus({
  showType = false,
  showExpiry = false,
  style,
  className,
  compact = false,
}: CredentialStatusProps) {
  const { state } = useCredential();

  const status = state.credential?.status || 'none';
  const statusColor = statusColors[status] || statusColors.none;

  const containerStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: compact ? '6px' : '12px',
    padding: compact ? '6px 12px' : '12px 16px',
    background: `${statusColor}15`,
    borderRadius: compact ? '20px' : '12px',
    fontSize: compact ? '13px' : '14px',
    ...style,
  };

  const dotStyle: CSSProperties = {
    width: compact ? '8px' : '10px',
    height: compact ? '8px' : '10px',
    borderRadius: '50%',
    background: statusColor,
  };

  const textStyle: CSSProperties = {
    color: statusColor,
    fontWeight: 500,
    textTransform: 'capitalize',
  };

  const labelStyle: CSSProperties = {
    color: '#6b7280',
    fontWeight: 400,
  };

  if (!state.credential) {
    return (
      <div style={containerStyle} className={className}>
        <span style={dotStyle} />
        <span style={textStyle}>Not Verified</span>
      </div>
    );
  }

  const expiryDate = new Date(state.credential.expiresAt.toNumber() * 1000);
  const isExpired = expiryDate < new Date();

  return (
    <div style={containerStyle} className={className}>
      <span style={dotStyle} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={textStyle}>
          {isExpired ? 'Expired' : status}
        </span>
        {showType && (
          <span style={labelStyle}>
            {getCredentialTypeLabel(state.credential.credentialType)}
          </span>
        )}
        {showExpiry && !compact && (
          <span style={labelStyle}>
            Expires: {expiryDate.toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
