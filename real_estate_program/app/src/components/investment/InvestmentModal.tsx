import { FC, useState, useEffect, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  Wallet,
  X,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Minus,
  Plus,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useHubCredential } from '@/hooks';
import { investApi } from '@/services/api';
import toast from 'react-hot-toast';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyMint: string;
  propertyName: string;
  propertySymbol: string;
  valuePerToken: number;
  availableSupply: number;
  annualYieldPercent: number;
  onInvestmentSuccess?: () => void;
}

type InvestmentStep = 'input' | 'quote' | 'confirm' | 'payment' | 'processing' | 'success' | 'error';

export const InvestmentModal: FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  propertyMint,
  propertyName,
  propertySymbol,
  valuePerToken,
  availableSupply,
  annualYieldPercent,
  onInvestmentSuccess,
}) => {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { isActive, error: credentialError } = useHubCredential();

  const [step, setStep] = useState<InvestmentStep>('input');
  const [tokenAmount, setTokenAmount] = useState<number>(10);
  const [quote, setQuote] = useState<investApi.InvestmentQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [paymentSignature, setPaymentSignature] = useState<string | null>(null);
  const [mintSignature, setMintSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculations
  const calculations = useMemo(() => {
    const totalCost = tokenAmount * valuePerToken;
    const annualRevenue = totalCost * (annualYieldPercent / 100);
    const monthlyRevenue = annualRevenue / 12;
    const ownershipPercent = availableSupply > 0 ? (tokenAmount / availableSupply) * 100 : 0;

    return {
      totalCost,
      annualRevenue,
      monthlyRevenue,
      ownershipPercent,
    };
  }, [tokenAmount, valuePerToken, annualYieldPercent, availableSupply]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setTokenAmount(10);
      setQuote(null);
      setPaymentSignature(null);
      setMintSignature(null);
      setError(null);
    }
  }, [isOpen]);

  // Quick amount buttons
  const quickAmounts = [10, 50, 100, 500, 1000];

  // Fetch quote when proceeding from input
  const handleGetQuote = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoadingQuote(true);
    setError(null);

    try {
      const quoteData = await investApi.getInvestmentQuote(propertyMint, tokenAmount);
      setQuote(quoteData);
      setStep('quote');
    } catch (err) {
      console.error('Error getting quote:', err);
      toast.error('Failed to get investment quote');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Create and send payment transaction
  const handlePayment = async () => {
    if (!publicKey || !signTransaction || !quote) {
      toast.error('Wallet not ready');
      return;
    }

    setStep('payment');
    setError(null);

    try {
      const platformTreasury = new PublicKey(quote.platformTreasury);
      const seller = new PublicKey(quote.seller);

      // Create transaction with transfers
      const transaction = new Transaction();

      // Add platform fee transfer
      const platformFeeLamports = BigInt(quote.breakdown.platformFee.lamports);
      if (platformFeeLamports > 0n) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: platformTreasury,
            lamports: platformFeeLamports,
          })
        );
      }

      // Add seller transfer (escrow + reserve - in production these would go to PDAs)
      const sellerLamports = BigInt(quote.breakdown.seller.lamports) +
                            BigInt(quote.breakdown.reserveFund.lamports);
      if (sellerLamports > 0n) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: seller,
            lamports: sellerLamports,
          })
        );
      }

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign transaction
      const signedTx = await signTransaction(transaction);

      // Send transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      setPaymentSignature(signature);
      console.log('Payment confirmed:', signature);

      // Now process the investment (mint tokens)
      setStep('processing');
      await handleMintTokens(signature);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
      setStep('error');
    }
  };

  // Process investment (mint tokens) after payment
  const handleMintTokens = async (paymentSig: string) => {
    if (!publicKey) return;

    try {
      const result = await investApi.processInvestment(
        propertyMint,
        publicKey.toString(),
        tokenAmount,
        paymentSig
      );

      setMintSignature(result.mintSignature);
      setStep('success');
      toast.success('Investment successful!');
      onInvestmentSuccess?.();
    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.message || 'Failed to mint tokens');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md animate-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-solana-dark-700 sticky top-0 bg-solana-dark-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-solana-green-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-solana-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Invest in Property</h2>
              <p className="text-sm text-solana-dark-400">{propertyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-solana-dark-800 transition-colors"
          >
            <X className="w-5 h-5 text-solana-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step: Input */}
          {step === 'input' && (
            <div className="space-y-5">
              {/* Token Price */}
              <div className="p-4 bg-solana-dark-800/50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-solana-dark-400">Token Price</span>
                  <span className="text-xl font-bold text-white">
                    ${valuePerToken.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-solana-dark-400">Available</span>
                  <span className="text-solana-dark-300">
                    {availableSupply.toLocaleString()} {propertySymbol}
                  </span>
                </div>
              </div>

              {/* Token Amount Selector */}
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-3">
                  How many tokens do you want to buy?
                </label>

                {/* Stepper */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => setTokenAmount(Math.max(1, tokenAmount - 10))}
                    className="w-12 h-12 rounded-xl bg-solana-dark-800 hover:bg-solana-dark-700 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5 text-white" />
                  </button>
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-32 text-center text-3xl font-bold bg-transparent text-white focus:outline-none"
                    min={1}
                    max={availableSupply}
                  />
                  <button
                    onClick={() => setTokenAmount(Math.min(availableSupply, tokenAmount + 10))}
                    className="w-12 h-12 rounded-xl bg-solana-dark-800 hover:bg-solana-dark-700 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Quick Amounts */}
                <div className="flex flex-wrap justify-center gap-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTokenAmount(Math.min(amount, availableSupply))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        tokenAmount === amount
                          ? 'bg-solana-purple-500 text-white'
                          : 'bg-solana-dark-800 text-solana-dark-300 hover:bg-solana-dark-700'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Investment Summary */}
              <div className="p-4 bg-gradient-to-br from-solana-purple-500/10 to-solana-green-500/10 border border-solana-dark-600 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-solana-dark-300">Total Investment</span>
                  <span className="text-xl font-bold text-white">
                    ${calculations.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-solana-dark-400">Est. Annual Revenue</span>
                  <span className="text-solana-green-400">
                    +${calculations.annualRevenue.toFixed(2)}/year
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-solana-dark-400">Ownership</span>
                  <span className="text-solana-dark-300">
                    {calculations.ownershipPercent.toFixed(4)}%
                  </span>
                </div>
              </div>

              {/* KYC Status */}
              <div className="p-4 bg-solana-dark-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <>
                      <ShieldCheck className="w-5 h-5 text-solana-green-400" />
                      <div>
                        <p className="text-sm font-medium text-white">KYC Verified</p>
                        <p className="text-xs text-solana-green-400">Ready to invest</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-5 h-5 text-yellow-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">KYC Required</p>
                        <p className="text-xs text-yellow-400">
                          {credentialError || 'Complete identity verification to invest'}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => window.location.href = '/kyc'}>
                        Verify
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Get Quote Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleGetQuote}
                disabled={!connected || !isActive || tokenAmount <= 0 || tokenAmount > availableSupply || isLoadingQuote}
              >
                {isLoadingQuote ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Getting Quote...
                  </>
                ) : !connected ? (
                  'Connect Wallet'
                ) : !isActive ? (
                  'KYC Required'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step: Quote - Show SOL price and breakdown */}
          {step === 'quote' && quote && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white">Investment Quote</h3>
                <p className="text-sm text-solana-dark-400">Review payment details</p>
              </div>

              {/* SOL Price */}
              <div className="p-4 bg-solana-dark-800/50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-solana-dark-400">SOL Price</span>
                  <span className="text-white font-medium">${quote.solPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-solana-dark-400">Tokens</span>
                  <span className="text-white">{quote.tokenAmount} {propertySymbol}</span>
                </div>
              </div>

              {/* Total in USD and SOL */}
              <div className="p-4 bg-gradient-to-br from-solana-purple-500/10 to-solana-green-500/10 border border-solana-dark-600 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-solana-dark-300">Total USD</span>
                  <span className="text-xl font-bold text-white">
                    ${quote.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-solana-dark-300">Total SOL</span>
                  <span className="text-xl font-bold text-solana-green-400">
                    ◎ {quote.totalSol.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="p-4 bg-solana-dark-800/50 rounded-xl space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-solana-dark-400" />
                  <span className="text-sm font-medium text-white">Fee Breakdown</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-solana-dark-400">Platform Fee ({quote.breakdown.platformFee.percent}%)</span>
                  <span className="text-solana-dark-300">◎ {quote.breakdown.platformFee.sol.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-solana-dark-400">Reserve Fund ({quote.breakdown.reserveFund.percent}%)</span>
                  <span className="text-solana-dark-300">◎ {quote.breakdown.reserveFund.sol.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-solana-dark-700 pt-2">
                  <span className="text-solana-dark-400">To Property Owner ({quote.breakdown.seller.percent}%)</span>
                  <span className="text-solana-dark-300">◎ {quote.breakdown.seller.sol.toFixed(4)}</span>
                </div>
              </div>

              {/* Quote expiry notice */}
              <p className="text-xs text-solana-dark-500 text-center">
                Quote valid for {quote.validFor} seconds. Price may vary.
              </p>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep('input')}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handlePayment}>
                  Pay ◎ {quote.totalSol.toFixed(4)}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Payment - Processing payment */}
          {step === 'payment' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-solana-purple-400 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Processing Payment</h3>
              <p className="text-sm text-solana-dark-400">
                Please approve the transaction in your wallet...
              </p>
            </div>
          )}

          {/* Step: Processing - Minting tokens */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-solana-green-400 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Minting Tokens</h3>
              <p className="text-sm text-solana-dark-400">
                Payment confirmed! Minting your tokens...
              </p>
              {paymentSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${paymentSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-solana-purple-400 hover:text-solana-purple-300 mt-4"
                >
                  View payment
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-solana-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-solana-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Investment Successful!</h3>
              <p className="text-sm text-solana-dark-400 mb-4">
                {tokenAmount.toLocaleString()} {propertySymbol} tokens have been sent to your wallet.
              </p>
              <div className="space-y-2 mb-6">
                {paymentSignature && (
                  <a
                    href={`https://explorer.solana.com/tx/${paymentSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-solana-purple-400 hover:text-solana-purple-300"
                  >
                    View Payment TX
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {mintSignature && (
                  <a
                    href={`https://explorer.solana.com/tx/${mintSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-solana-green-400 hover:text-solana-green-300"
                  >
                    View Mint TX
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <div className="space-y-3">
                <Button className="w-full" onClick={() => window.location.href = '/portfolio'}>
                  View Portfolio
                </Button>
                <Button variant="secondary" className="w-full" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Investment Failed</h3>
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => setStep('input')}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
