import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, TransactionInstruction, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import toast from 'react-hot-toast';

const PROGRAM_ID = new PublicKey('FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om');

// Discriminator for claim_revenue instruction (first 8 bytes of sha256("global:claim_revenue"))
const CLAIM_REVENUE_DISCRIMINATOR = Buffer.from([149, 95, 181, 242, 94, 90, 158, 162]);

export function useClaimRevenue() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyMint,
      epochNumber,
    }: {
      propertyMint: string;
      epochNumber: number;
    }) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      const propertyMintPubkey = new PublicKey(propertyMint);

      // Derive PDAs
      const [propertyState] = PublicKey.findProgramAddressSync(
        [Buffer.from('property'), propertyMintPubkey.toBuffer()],
        PROGRAM_ID
      );

      const [revenueEpoch] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('revenue_epoch'),
          propertyState.toBuffer(),
          new BN(epochNumber).toArrayLike(Buffer, 'le', 8),
        ],
        PROGRAM_ID
      );

      const [claimRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from('claim_record'), revenueEpoch.toBuffer(), wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );

      const [revenueVault] = PublicKey.findProgramAddressSync(
        [Buffer.from('revenue_vault'), revenueEpoch.toBuffer()],
        PROGRAM_ID
      );

      const investorTokenAccount = getAssociatedTokenAddressSync(
        propertyMintPubkey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      console.log('Claiming revenue...');
      console.log('Property Mint:', propertyMint);
      console.log('Epoch Number:', epochNumber);
      console.log('Investor:', wallet.publicKey.toString());
      console.log('Revenue Epoch:', revenueEpoch.toString());
      console.log('Claim Record:', claimRecord.toString());
      console.log('Revenue Vault:', revenueVault.toString());

      // Build instruction manually
      const instruction = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: propertyState, isSigner: false, isWritable: false },
          { pubkey: propertyMintPubkey, isSigner: false, isWritable: false },
          { pubkey: investorTokenAccount, isSigner: false, isWritable: false },
          { pubkey: revenueEpoch, isSigner: false, isWritable: true },
          { pubkey: claimRecord, isSigner: false, isWritable: true },
          { pubkey: revenueVault, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: CLAIM_REVENUE_DISCRIMINATOR,
      });

      // Create and send transaction
      const transaction = new Transaction().add(instruction);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(transaction);
      const txSignature = await connection.sendRawTransaction(signedTx.serialize());

      await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      console.log('Claim successful! Transaction:', txSignature);

      return { signature: txSignature };
    },
    onSuccess: (data) => {
      toast.success(`Revenue claimed! Tx: ${data.signature.slice(0, 8)}...`);

      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['claimable-revenue'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
    onError: (error: Error) => {
      console.error('Claim failed:', error);
      toast.error(error.message || 'Failed to claim revenue');
    },
  });
}
