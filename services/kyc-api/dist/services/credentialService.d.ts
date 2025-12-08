import { IssueCredentialInput, RefreshCredentialInput, RevokeCredentialInput, CredentialResponse, VerificationResponse } from '../types/credential.js';
export declare class CredentialService {
    private connection;
    private programId;
    private getProgram;
    private findCredentialPDA;
    private findNetworkPDA;
    private findIssuerPDA;
    issueCredential(input: IssueCredentialInput): Promise<CredentialResponse>;
    verifyCredential(userWallet: string, requiredType?: string): Promise<VerificationResponse>;
    refreshCredential(input: RefreshCredentialInput): Promise<CredentialResponse>;
    revokeCredential(input: RevokeCredentialInput): Promise<CredentialResponse>;
    getCredential(userWallet: string): Promise<CredentialResponse>;
}
export declare const credentialService: CredentialService;
//# sourceMappingURL=credentialService.d.ts.map