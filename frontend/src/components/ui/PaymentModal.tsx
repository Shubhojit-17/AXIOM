import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { X, AlertTriangle, CheckCircle, Loader2, Wallet, RefreshCw } from 'lucide-react';
import type { Gateway402Response } from '../../lib/types';
import { useWallet } from '../../context/WalletContext';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceData: Gateway402Response | null;
  onSubmitProof: (txHash: string) => void;
  isSubmitting: boolean;
}

type PaymentStep = 'confirm' | 'signing' | 'error';

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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep('confirm');
      setError('');
    }
  }, [open]);

  const handlePay = async () => {
    if (!invoiceData) return;

    if (!isConnected) {
      connectWallet();
      return;
    }

    try {
      setStep('signing');
      setError('');

      const txId = await sendSTX(
        invoiceData.recipient,
        invoiceData.price,
        `axiom:${invoiceData.apiId}`
      );

      // Transaction signed — submit proof to backend
      onSubmitProof(txId);
    } catch (err: any) {
      if (err.message === 'Transaction cancelled by user') {
        setStep('confirm');
      } else {
        setError(err.message || 'Transaction failed');
        setStep('error');
      }
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Don't close while verifying payment on backend
    setStep('confirm');
    setError('');
    onClose();
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
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Recipient</span>
                    <span className="font-mono text-xs break-all">{invoiceData.recipient}</span>
                  </div>
                </>
              )}

              {/* Step-specific content */}
              {step === 'confirm' && !isSubmitting && (
                <div className="bg-white/[0.03] rounded-xl p-4 text-xs text-white/50 space-y-1">
                  <p>Click <strong className="text-white/70">Pay with Wallet</strong> below to open your Stacks wallet.</p>
                  <p>Approve the transaction in your wallet to unlock this API.</p>
                </div>
              )}

              {step === 'signing' && !isSubmitting && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-300 font-medium">Waiting for wallet approval...</p>
                      <p className="text-xs text-white/40 mt-1">Confirm the transaction in your Stacks wallet</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/30">
                    Don't see the wallet popup?{' '}
                    <button
                      onClick={() => setStep('confirm')}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Go back
                    </button>{' '}
                    and try again.
                  </p>
                </div>
              )}

              {isSubmitting && (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-violet-400 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm text-violet-300 font-medium">Verifying payment...</p>
                    <p className="text-xs text-white/40 mt-1">Unlocking API access</p>
                  </div>
                </div>
              )}

              {step === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-sm text-red-300">{error}</p>
                  <button
                    onClick={() => { setStep('confirm'); setError(''); }}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Try again
                  </button>
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
              <button
                onClick={handlePay}
                disabled={isSubmitting}
                className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 'signing' && !isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Retry Payment
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
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
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
