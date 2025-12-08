import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';

const PROGRAM_ID = new PublicKey('FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt');
const IDL = JSON.parse(fs.readFileSync('./src/credential_program_idl.json', 'utf-8'));

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

async function monitorProgram() {
  const connection = new Connection('http://localhost:8899', 'confirmed');

  console.log('🔴 Hub Credential Program Monitor');
  console.log('═'.repeat(80));
  console.log(`Program ID: ${PROGRAM_ID.toString()}`);
  console.log(`RPC: http://localhost:8899`);
  console.log('═'.repeat(80));
  console.log('\n👀 Watching for program logs and account changes...\n');

  // Subscribe to program logs
  connection.onLogs(
    PROGRAM_ID,
    (logs, ctx) => {
      console.log(`\n📝 [Slot ${ctx.slot}] Transaction: ${logs.signature}`);

      if (logs.err) {
        console.log('❌ Status: Failed');
        console.log(`Error: ${JSON.stringify(logs.err)}`);
      } else {
        console.log('✅ Status: Success');
      }

      // Parse logs for events
      logs.logs.forEach(log => {
        if (log.includes('Program log:')) {
          console.log(`   ${log}`);
        }
      });
    },
    'confirmed'
  );

  // Subscribe to program account changes
  const provider = new anchor.AnchorProvider(
    connection,
    {} as any,
    { commitment: 'confirmed' }
  );
  const program = new anchor.Program(IDL as any, provider);

  connection.onProgramAccountChange(
    PROGRAM_ID,
    async (accountInfo, ctx) => {
      try {
        const accountData = accountInfo.accountInfo.data;

        // Try to decode as UserCredential
        if (accountData.length === 508) { // UserCredential size
          try {
            const credentialAccount = (program.coder.accounts as any).decode(
              'UserCredential',
              accountData
            );

            console.log(`\n🔐 [Slot ${ctx.slot}] Credential Account Updated`);
            console.log(`PDA: ${accountInfo.accountId.toString()}`);
            console.log(`Holder: ${credentialAccount.holder.toString()}`);
            console.log(`Type: ${getCredentialTypeName(credentialAccount.credentialType)}`);
            console.log(`Status: ${getCredentialStatusName(credentialAccount.status)}`);
            console.log(`Expires: ${new Date(credentialAccount.expiresAt.toNumber() * 1000).toLocaleString('pt-BR')}`);

            if (credentialAccount.metadataUri) {
              try {
                const metadata = JSON.parse(credentialAccount.metadataUri);
                console.log(`Metadata: ${JSON.stringify(metadata)}`);
              } catch {
                // Ignore parse errors
              }
            }
          } catch (err) {
            // Not a UserCredential, ignore
          }
        }
      } catch (err) {
        // Ignore decode errors
      }
    },
    'confirmed'
  );

  console.log('Press Ctrl+C to stop monitoring\n');

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n\n👋 Monitor stopped');
    process.exit(0);
  });

  // Print periodic status
  let count = 0;
  setInterval(() => {
    count++;
    if (count % 12 === 0) { // Every minute
      console.log(`[${new Date().toLocaleTimeString('pt-BR')}] Still monitoring...`);
    }
  }, 5000);
}

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    Hub Credential Protocol Monitor                         ║
║                                                                            ║
║  This tool monitors real-time events from the Hub Credential Program      ║
║  on your localnet. It will display:                                       ║
║                                                                            ║
║  • Program transactions and their logs                                    ║
║  • Credential creation and updates                                        ║
║  • Account state changes                                                  ║
║                                                                            ║
║  Perfect for debugging and watching your KYC flow in real-time!           ║
╚════════════════════════════════════════════════════════════════════════════╝
\n`);

monitorProgram().catch(console.error);
