import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { X, AlertTriangle, Loader2, Wallet, RefreshCw, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import type { Gateway402Response } from '../../lib/types';
import { useWallet } from '../../context/WalletContext';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceData: Gateway402Response | null;
  onSubmitProof: (txHash: string) => void;
  isSubmitting: boolean;
}

type PaymentStep = 'confirm' | 'wallet-opened' | 'manual' | 'error';

export default function PaymentModal({
  open,
  onClose,
  invoiceData,
  onSubmitProof,
  isSubmitting,
}: PaymentModalProps) {
  const { sendSTX, isConnected, connectWallet } = useWallet();
  const [step, setStep] = useState<PaymentStep>('confirm');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [showManualFallback, setShowManualFallback] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep('confirm');
      setError('');
      setTxHash('');
      setShowManualFallback(false);
    }
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [open]);

  const handlePay = async () => {
    if (!invoiceData) return;

    if (!isConnected) {
      connectWallet();
      return;
    }

    setStep('wallet-opened');
    setError('');
    setShowManualFallback(false);

    // Show manual fallback after 5 seconds in case wallet callback doesn't fire
    fallbackTimerRef.current = setTimeout(() => {
      setShowManualFallback(true);
    }, 5000);

    try {
      const txId = await sendSTX(
        invoiceData.recipient,
        invoiceData.price,
        `axiom:${invoiceData.apiId}`
      );

      // Wallet callback worked! Clear timer and submit
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      onSubmitProof(txId);
    } catch (err: any) {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (err.message === 'Transaction cancelled by user') {
        setStep('confirm');
        setShowManualFallback(false);
      } else {
        // Wallet opened but callback failed — show manual input
        setStep('manual');
        setShowManualFallback(false);
      }
    }
  };

  const handleManualSubmit = () => {
    const hash = txHash.trim();
    if (hash.length >= 10) {
      onSubmitProof(hash);
    }
  };

  const handleSwitchToManual = () => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    setStep('manual');
    setShowManualFallback(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    setStep('confirm');
    setError('');
    setTxHash('');
    setShowManualFallback(false);
    onClose();
  };

  const copyRecipient = () => {
    if (invoiceData?.recipient) {
      navigator.clipboard.writeText(invoiceData.recipient);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fade-in" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md"
          aria-describedby={undefined}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>Payment Required</Dialog.Title>
          </VisuallyHidden.Root>
          <div className="glass-card rounded-2xl p-0 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-amber-300">402 Payment Required</h3>
                  <p className="text-xs text-white/50">Pay-per-request via HTTP 402</p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  className="p-1 rounded-lg hover:bg-white/[0.05]"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </Dialog.Close>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {invoiceData && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">API</span>
                    <span className="font-medium">{invoiceData.apiName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Cost</span>
                    <span className="text-axiom-orange font-bold text-lg">
                      {invoiceData.price} {invoiceData.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-start">
                    <span className="text-white/50">Recipient</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs break-all text-right max-w-[250px]">
                        {invoiceData.recipient}
                      </span>
                      <button
                        onClick={copyRecipient}
                        className="p-1 hover:bg-white/[0.05] rounded flex-shrink-0"
                        title="Copy address"
                      >
                        <Copy className="w-3 h-3 text-white/30" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* STEP: Confirm — initial state */}
              {step === 'confirm' && !isSubmitting && (
                <div className="bg-white/[0.03] rounded-xl p-4 text-xs text-white/50 space-y-1">
                  <p>Click <strong className="text-white/70">Pay with Wallet</strong> to open your Stacks wallet.</p>
                  <p>Approve the transaction to unlock this API.</p>
                </div>
              )}

              {/* STEP: Wallet opened — waiting for callback */}
              {step === 'wallet-opened' && !isSubmitting && (
                <div className="space-y-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-300 font-medium">Wallet opened</p>
                        <p className="text-xs text-white/40 mt-1">Confirm the transaction in your Leather wallet</p>
                      </div>
                    </div>
                  </div>

                  {/* Fallback appears after 5 seconds */}
                  {showManualFallback && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
                      <p className="text-xs text-amber-300/80">
                        Already confirmed in your wallet? The auto-detection may not work with some wallet versions.
                      </p>
                      <button
                        onClick={handleSwitchToManual}
                        className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Enter transaction hash manually
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: Manual tx hash input */}
              {step === 'manual' && !isSubmitting && (
                <div className="space-y-3">
                  <div className="bg-white/[0.03] rounded-xl p-4 text-xs text-white/50 space-y-2">
                    <p className="text-white/70 font-medium">Paste your transaction hash</p>
                    <p>After confirming in your wallet, copy the transaction ID from your wallet's activity and paste it below.</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-2">Transaction Hash</label>
                    <input
                      type="text"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder="0x..."
                      className="input-glass font-mono text-sm"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Verifying after submit */}
              {isSubmitting && (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-violet-400 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm text-violet-300 font-medium">Verifying payment...</p>
                    <p className="text-xs text-white/40 mt-1">Unlocking API access</p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {step === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-sm text-red-300">{error}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setStep('confirm'); setError(''); }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Try again
                    </button>
                    <button
                      onClick={handleSwitchToManual}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Enter hash manually
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.08] flex gap-3">
              <button
                onClick={handleClose}
                className="btn-secondary flex-1 text-sm py-2.5"
                disabled={isSubmitting}
              >
                Cancel
              </button>

              {/* Main action button changes based on step */}
              {step === 'manual' ? (
                <button
                  onClick={handleManualSubmit}
                  disabled={txHash.trim().length < 10 || isSubmitting}
                  className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit & Unlock
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={isSubmitting}
                  className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : step === 'wallet-opened' ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Retry Wallet
                    </>
                  ) : !isConnected ? (
                    <>
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Pay with Wallet
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
