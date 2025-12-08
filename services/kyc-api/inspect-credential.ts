import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';

const PROGRAM_ID = new PublicKey('FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt');
const IDL = JSON.parse(fs.readFileSync('./src/credential_program_idl.json', 'utf-8'));

// Get credential type name from Anchor enum object
function getCredentialTypeName(typeEnum: any): string {
  if (typeof typeEnum === 'object' && typeEnum !== null) {
    const key = Object.keys(typeEnum)[0];
    const typeMap: Record<string, string> = {
      kycBasic: 'KYC Basic',
      kycFull: 'KYC Full',
      accreditedInvestor: 'Accredited Investor',
      qualifiedPurchaser: 'Qualified Purchaser',
      brazilianCpf: 'Brazilian CPF',
      brazilianCnpj: 'Brazilian CNPJ',
    };
    return typeMap[key] || key;
  }
  return 'Unknown';
}

// Get credential status name from Anchor enum object
function getCredentialStatusName(statusEnum: any): string {
  if (typeof statusEnum === 'object' && statusEnum !== null) {
    const key = Object.keys(statusEnum)[0];
    const statusMap: Record<string, string> = {
      active: 'Active',
      expired: 'Expired',
      revoked: 'Revoked',
      suspended: 'Suspended',
    };
    return statusMap[key] || key;
  }
  return 'Unknown';
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

async function inspectCredential(holderAddress: string) {
  const connection = new Connection('http://localhost:8899', 'confirmed');
  const holder = new PublicKey(holderAddress);

  // Derive credential PDA
  const [credentialPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('credential'), holder.toBuffer()],
    PROGRAM_ID
  );

  console.log('\n📋 Credential Inspector\n');
  console.log('═'.repeat(80));
  console.log(`Holder Address: ${holder.toString()}`);
  console.log(`Credential PDA: ${credentialPDA.toString()}`);
  console.log('═'.repeat(80));

  try {
    const accountInfo = await connection.getAccountInfo(credentialPDA);

    if (!accountInfo) {
      console.log('\n❌ No credential found for this address\n');
      return;
    }

    console.log(`\nAccount Owner: ${accountInfo.owner.toString()}`);
    console.log(`Account Size: ${accountInfo.data.length} bytes`);
    console.log(`Rent Balance: ${accountInfo.lamports / 1e9} SOL`);

    // Decode account data using IDL
    const provider = new anchor.AnchorProvider(
      connection,
      {} as any,
      { commitment: 'confirmed' }
    );
    const program = new anchor.Program(IDL as any, provider);

    const credentialAccount = await (program.account as any).userCredential.fetch(credentialPDA);

    console.log('\n🔐 Credential Details\n');
    console.log('─'.repeat(80));
    console.log(`Type:        ${getCredentialTypeName(credentialAccount.credentialType)} (raw: ${credentialAccount.credentialType})`);
    console.log(`Status:      ${getCredentialStatusName(credentialAccount.status)} (raw: ${credentialAccount.status})`);
    console.log(`Issued At:   ${formatDate(credentialAccount.issuedAt.toNumber())}`);
    console.log(`Expires At:  ${formatDate(credentialAccount.expiresAt.toNumber())}`);
    console.log(`Holder:      ${credentialAccount.holder.toString()}`);
    console.log(`Issuer:      ${credentialAccount.issuer.toString()}`);

    if (credentialAccount.metadataUri) {
      console.log(`\n📝 Metadata:`);
      try {
        const metadata = JSON.parse(credentialAccount.metadataUri);
        console.log(JSON.stringify(metadata, null, 2));
      } catch {
        console.log(credentialAccount.metadataUri);
      }
    }

    // Check if credential is valid
    const now = Math.floor(Date.now() / 1000);
    const isExpired = credentialAccount.expiresAt.toNumber() < now;
    const statusName = getCredentialStatusName(credentialAccount.status);
    const isActive = statusName === 'Active';
    const isValid = isActive && !isExpired;

    console.log('\n' + '─'.repeat(80));
    console.log(`\n${isValid ? '✅' : '❌'} Credential is ${isValid ? 'VALID' : 'INVALID'}`);
    if (!isActive) console.log('   Reason: Status is not Active');
    if (isExpired) console.log('   Reason: Credential has expired');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Error reading credential:', error.message);
  }
}

async function listAllCredentials() {
  const connection = new Connection('http://localhost:8899', 'confirmed');

  console.log('\n📋 All Credentials on Localnet\n');
  console.log('═'.repeat(80));

  try {
    const provider = new anchor.AnchorProvider(
      connection,
      {} as any,
      { commitment: 'confirmed' }
    );
    const program = new anchor.Program(IDL as any, provider);

    const accounts = await (program.account as any).userCredential.all();

    if (accounts.length === 0) {
      console.log('No credentials found\n');
      return;
    }

    console.log(`Found ${accounts.length} credential(s)\n`);

    accounts.forEach((acc: any, idx: number) => {
      const cred = acc.account;
      console.log(`${idx + 1}. ${acc.publicKey.toString()}`);
      console.log(`   Holder: ${cred.holder.toString()}`);
      console.log(`   Type: ${getCredentialTypeName(cred.credentialType)}`);
      console.log(`   Status: ${getCredentialStatusName(cred.status)}`);
      console.log(`   Expires: ${formatDate(cred.expiresAt.toNumber())}`);
      console.log('');
    });

  } catch (error: any) {
    console.error('Error listing credentials:', error.message);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('\nUsage:');
  console.log('  npx ts-node inspect-credential.ts <wallet-address>  - Inspect specific credential');
  console.log('  npx ts-node inspect-credential.ts --all             - List all credentials');
  console.log('\nExample:');
  console.log('  npx ts-node inspect-credential.ts AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw\n');
  process.exit(0);
}

if (args[0] === '--all') {
  listAllCredentials().catch(console.error);
} else {
  inspectCredential(args[0]).catch(console.error);
}
