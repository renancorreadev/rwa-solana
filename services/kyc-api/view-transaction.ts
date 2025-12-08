import { Connection, PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt');

async function viewTransaction(signature: string) {
  const connection = new Connection('http://localhost:8899', 'confirmed');

  console.log('\n🔍 Transaction Inspector\n');
  console.log('═'.repeat(80));
  console.log(`Signature: ${signature}`);
  console.log('═'.repeat(80));

  try {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      console.log('\n❌ Transaction not found\n');
      console.log('Note: On localnet, transactions may be pruned after finalization.');
      console.log('To keep transaction history, run solana-test-validator with --limit-ledger-size flag.\n');
      return;
    }

    console.log(`\nSlot: ${tx.slot}`);
    console.log(`Block Time: ${tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString('pt-BR') : 'N/A'}`);
    console.log(`Status: ${tx.meta?.err ? '❌ Failed' : '✅ Success'}`);

    if (tx.meta?.err) {
      console.log(`Error: ${JSON.stringify(tx.meta.err)}`);
    }

    console.log(`\nFee: ${(tx.meta?.fee || 0) / 1e9} SOL`);
    console.log(`Compute Units: ${tx.meta?.computeUnitsConsumed || 'N/A'}`);

    console.log('\n📝 Instructions:\n');
    tx.transaction.message.compiledInstructions.forEach((ix, idx) => {
      const programId = tx.transaction.message.staticAccountKeys[ix.programIdIndex];
      console.log(`${idx + 1}. Program: ${programId.toString()}`);
      if (programId.equals(PROGRAM_ID)) {
        console.log('   → Hub Credential Program');
      }
    });

    if (tx.meta?.logMessages && tx.meta.logMessages.length > 0) {
      console.log('\n📜 Program Logs:\n');
      tx.meta.logMessages
        .filter(log => log.includes('Program log:') || log.includes('Program data:'))
        .forEach(log => {
          console.log(`   ${log}`);
        });
    }

    console.log('\n' + '═'.repeat(80));
  } catch (error: any) {
    console.error('\n❌ Error fetching transaction:', error.message);
  }
}

async function getProgramTransactions(limit: number = 10) {
  const connection = new Connection('http://localhost:8899', 'confirmed');

  console.log('\n📋 Recent Hub Credential Program Transactions\n');
  console.log('═'.repeat(80));

  try {
    const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, { limit });

    if (signatures.length === 0) {
      console.log('No transactions found\n');
      return;
    }

    console.log(`Found ${signatures.length} transaction(s)\n`);

    signatures.forEach((sig, idx) => {
      console.log(`${idx + 1}. ${sig.signature}`);
      console.log(`   Slot: ${sig.slot}`);
      console.log(`   Time: ${sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`   Status: ${sig.err ? '❌ Failed' : '✅ Success'}`);
      console.log('');
    });

    console.log('Use: npx ts-node view-transaction.ts <signature> to see details\n');
  } catch (error: any) {
    console.error('Error fetching program transactions:', error.message);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('\nUsage:');
  console.log('  npx ts-node view-transaction.ts <signature>  - View transaction details');
  console.log('  npx ts-node view-transaction.ts --recent     - List recent program transactions');
  console.log('\nExample:');
  console.log('  npx ts-node view-transaction.ts 5q3hnwhtRzwD7rfhyGNcX7CnPHpLtiPCsszUdZ9jNZycG3qiVwupDycAdGP2TV544T3asztXjMPUwZ6R2wS7caa\n');
  process.exit(0);
}

if (args[0] === '--recent') {
  const limit = args[1] ? parseInt(args[1]) : 10;
  getProgramTransactions(limit).catch(console.error);
} else {
  viewTransaction(args[0]).catch(console.error);
}
