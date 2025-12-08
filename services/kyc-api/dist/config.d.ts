import { PublicKey, Keypair, Connection } from '@solana/web3.js';
export type Network = 'localnet' | 'devnet' | 'mainnet-beta';
export declare const config: {
    port: number;
    nodeEnv: string;
    solana: {
        network: Network;
        rpcUrl: string;
        readonly connection: Connection;
    };
    program: {
        credentialProgramId: PublicKey;
    };
    issuer: {
        readonly keypair: Keypair | null;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    kyc: {
        providerApiKey: string | undefined;
        providerSecret: string | undefined;
    };
    cors: {
        allowedOrigins: string[];
    };
};
//# sourceMappingURL=config.d.ts.map