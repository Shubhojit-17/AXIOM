import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import type { Gateway402Response } from '../../lib/types';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceData: Gateway402Response | null;
  onSubmitProof: (txHash: string) => void;
  isSubmitting: boolean;
}

export default function PaymentModal({
  open,
  onClose,
  invoiceData,
  onSubmitProof,
  isSubmitting,
}: PaymentModalProps) {
  const [txHash, setTxHash] = useState('');

  const handleSubmit = () => {
    if (txHash.trim()) {
      onSubmitProof(txHash.trim());
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md">
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
                <button className="p-1 rounded-lg hover:bg-white/[0.05]">
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

              {/* Instructions */}
              <div className="bg-white/[0.03] rounded-xl p-4 text-xs text-white/50 space-y-1">
                <p>1. Send the exact STX amount to the recipient address</p>
                <p>2. Copy your transaction hash</p>
                <p>3. Paste it below and submit</p>
              </div>

              {/* TX Hash Input */}
              <div>
                <label className="text-xs text-white/40 block mb-2">Transaction Hash</label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x..."
                  className="input-glass font-mono text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.08] flex gap-3">
              <button
                onClick={onClose}
                className="btn-secondary flex-1 text-sm py-2.5"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!txHash.trim() || isSubmitting}
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
                    Unlock
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
