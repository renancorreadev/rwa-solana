import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import fs from 'fs';

const PROGRAM_ID = new PublicKey('FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt');
const IDL = JSON.parse(fs.readFileSync('../../target/idl/credential_program.json', 'utf-8'));

async function main() {
  const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://solana-devnet.g.alchemy.com/v2/bctNGkPdumegFbmG338QD', 'confirmed');
  const keypairData = JSON.parse(fs.readFileSync(process.env.HOME + '/.config/solana/id.json', 'utf-8'));
  const admin = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  
  const wallet = new anchor.Wallet(admin);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new anchor.Program(IDL as any, provider);

  console.log('Admin:', admin.publicKey.toString());

  const [networkPDA] = PublicKey.findProgramAddressSync([Buffer.from('credential_network')], PROGRAM_ID);
  const networkAccount = await connection.getAccountInfo(networkPDA);
  
  if (!networkAccount) {
    console.log('Initializing network...');
    const tx = await program.methods
      .initializeNetwork('Hub Network', new anchor.BN(1000000))
      .accounts({ admin: admin.publicKey, network: networkPDA, systemProgram: SystemProgram.programId })
      .signers([admin])
      .rpc();
    console.log('Network initialized:', tx);
  } else {
    console.log('Network already initialized');
  }

  const [issuerPDA] = PublicKey.findProgramAddressSync([Buffer.from('issuer'), admin.publicKey.toBuffer()], PROGRAM_ID);
  const issuerAccount = await connection.getAccountInfo(issuerPDA);
  
  if (!issuerAccount) {
    console.log('Registering issuer...');
    const tx = await program.methods
      .registerIssuer('Hub KYC', 'https://hub.kyc')
      .accounts({ admin: admin.publicKey, network: networkPDA, issuerAuthority: admin.publicKey, issuer: issuerPDA, systemProgram: SystemProgram.programId })
      .signers([admin])
      .rpc();
    console.log('Issuer registered:', tx);
  } else {
    console.log('Issuer already registered');
  }

  console.log('✅ Setup complete!');
}

main().catch(console.error);
