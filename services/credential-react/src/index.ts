// Components
export { CredentialProvider, useCredential } from './CredentialProvider';
export { CredentialGate } from './CredentialGate';
export { CredentialButton } from './CredentialButton';
export { CredentialStatus } from './CredentialStatus';

// Types
export {
  CredentialType,
  CredentialStatus as CredentialStatusEnum,
  type UserCredential,
  type CredentialIssuer,
  type CredentialNetwork,
  type CredentialConfig,
  type CredentialState,
  type UseCredentialReturn,
} from './types';

// Constants
export const HUB_CREDENTIAL_PROGRAM_ID = 'FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt';
