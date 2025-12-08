"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = __importDefault(require("dotenv"));
const bs58_1 = __importDefault(require("bs58"));
dotenv_1.default.config();
function getConnection(network) {
    if (network === 'localnet') {
        return new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'http://localhost:8899', 'confirmed');
    }
    return new web3_js_1.Connection(process.env.SOLANA_RPC_URL || (0, web3_js_1.clusterApiUrl)(network === 'mainnet-beta' ? 'mainnet-beta' : 'devnet'), 'confirmed');
}
function getIssuerKeypair() {
    const privateKey = process.env.ISSUER_PRIVATE_KEY;
    if (!privateKey) {
        console.warn('ISSUER_PRIVATE_KEY not set - credential issuance will be disabled');
        return null;
    }
    try {
        return web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(privateKey));
    }
    catch {
        console.error('Invalid ISSUER_PRIVATE_KEY format');
        return null;
    }
}
exports.config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    solana: {
        network: (process.env.SOLANA_NETWORK || 'localnet'),
        rpcUrl: process.env.SOLANA_RPC_URL || 'http://localhost:8899',
        get connection() {
            return getConnection(this.network);
        },
    },
    program: {
        credentialProgramId: new web3_js_1.PublicKey(process.env.CREDENTIAL_PROGRAM_ID || 'FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt'),
    },
    issuer: {
        get keypair() {
            return getIssuerKeypair();
        },
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    kyc: {
        providerApiKey: process.env.KYC_PROVIDER_API_KEY,
        providerSecret: process.env.KYC_PROVIDER_SECRET,
    },
    cors: {
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
    },
};
//# sourceMappingURL=config.js.map