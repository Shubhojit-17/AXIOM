import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';
import { User, Wallet, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const { wallet, role } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyWallet = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-white/50 text-sm mt-1">Your AXIOM developer profile</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card space-y-6"
      >
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-glow-violet/20 to-glow-violet/5 flex items-center justify-center">
            <User className="w-8 h-8 text-glow-violet" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{role === 'developer' ? 'Developer' : 'User'}</h2>
            <p className="text-xs text-white/40">Connected via Stacks Wallet</p>
          </div>
        </div>

        {/* Wallet */}
        <div className="space-y-2">
          <label className="text-xs text-white/40">Wallet Address</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 font-mono text-sm break-all">
              {wallet}
            </div>
            <button
              onClick={copyWallet}
              className="p-3 rounded-xl glass glass-hover transition-all"
              title="Copy"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-white/40" />
              )}
            </button>
          </div>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <label className="text-xs text-white/40">Current Role</label>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm capitalize">
            {role}
          </div>
        </div>

        {/* Info */}
        <div className="bg-glow-violet/5 border border-glow-violet/10 rounded-xl p-4 text-sm text-white/50 space-y-1">
          <p className="font-medium text-glow-violet">AXIOM Web3 Identity</p>
          <p>Your identity on AXIOM is tied to your Stacks wallet address. All API registrations and payments are associated with this address.</p>
        </div>
      </motion.div>
    </div>
  );
}
