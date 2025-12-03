# @hub/credential-react

React SDK for Hub Credential Protocol - On-chain KYC/Verifiable Credentials for Solana.

## Installation

```bash
npm install @hub/credential-react
# or
yarn add @hub/credential-react
```

## Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install @solana/web3.js @solana/wallet-adapter-react @coral-xyz/anchor react react-dom
```

## Quick Start

### 1. Wrap your app with the provider

```tsx
import { CredentialProvider } from '@hub/credential-react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';

function App() {
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={[]} autoConnect>
        <CredentialProvider
          config={{
            network: 'devnet',
            theme: 'dark',
            onSuccess: (credential) => {
              console.log('Credential verified!', credential);
            },
          }}
        >
          <YourApp />
        </CredentialProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

### 2. Gate content with CredentialGate

```tsx
import { CredentialGate, CredentialType } from '@hub/credential-react';

function ProtectedPage() {
  return (
    <CredentialGate requiredType={CredentialType.KycBasic}>
      <h1>Welcome, verified user!</h1>
      <p>This content is only visible to KYC-verified users.</p>
    </CredentialGate>
  );
}
```

### 3. Use the hook for custom logic

```tsx
import { useCredential, CredentialType } from '@hub/credential-react';

function MyComponent() {
  const { state, hasValidCredential, openModal } = useCredential();

  if (state.loading) {
    return <div>Loading...</div>;
  }

  if (!hasValidCredential(CredentialType.KycBasic)) {
    return (
      <div>
        <p>You need to verify your identity to continue.</p>
        <button onClick={openModal}>Start Verification</button>
      </div>
    );
  }

  return (
    <div>
      <p>Welcome! Your credential type: {state.credential?.credentialType}</p>
      <p>Expires: {new Date(state.credential?.expiresAt.toNumber() * 1000).toLocaleDateString()}</p>
    </div>
  );
}
```

## Components

### `<CredentialProvider>`

The main provider that wraps your app and manages credential state.

**Props:**
- `config` - Configuration object (see below)
- `children` - React children

**Config options:**
```ts
interface CredentialConfig {
  network: 'localnet' | 'devnet' | 'mainnet-beta';
  programId?: string; // defaults to Hub Credential Protocol
  requiredCredentialType?: CredentialType;
  theme?: 'light' | 'dark';
  rpcEndpoint?: string;
  onSuccess?: (credential: UserCredential) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}
```

### `<CredentialGate>`

Gates content behind credential verification.

```tsx
<CredentialGate
  requiredType={CredentialType.KycBasic}
  fallback={<CustomFallback />}
  loadingComponent={<CustomSpinner />}
>
  <ProtectedContent />
</CredentialGate>
```

### `<CredentialButton>`

Ready-to-use verification button.

```tsx
<CredentialButton
  label="Get Verified"
  verifiedLabel="Verified!"
  variant="primary" // 'primary' | 'secondary' | 'outline'
/>
```

### `<CredentialStatus>`

Displays current credential status.

```tsx
<CredentialStatus showType showExpiry compact />
```

## Hook: `useCredential()`

Returns credential state and helper functions.

```ts
const {
  state,           // { credential, loading, error, isVerified }
  config,          // Current config
  fetchCredential, // Refresh credential data
  verifyCredential,// Verify on-chain
  hasValidCredential, // Check if user has valid credential
  openModal,       // Open verification modal
  closeModal,      // Close modal
  isModalOpen,     // Modal state
} = useCredential();
```

## Credential Types

```ts
import { CredentialType } from '@hub/credential-react';

CredentialType.KycBasic           // Basic KYC
CredentialType.KycFull            // Full KYC with enhanced due diligence
CredentialType.AccreditedInvestor // US SEC Rule 501
CredentialType.QualifiedPurchaser // Qualified purchaser status
CredentialType.BrazilianCpf       // Brazilian individual tax ID
CredentialType.BrazilianCnpj      // Brazilian company tax ID
```

## Program ID

The default program ID for Hub Credential Protocol is:

```
FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt
```

You can override this by passing a custom `programId` in the config.

## License

MIT
