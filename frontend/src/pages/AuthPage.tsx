import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import { Wallet, ShieldCheck, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function AuthPage() {
  const { isConnected, connectWallet } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/marketplace';

  // Redirect after wallet connection
  useEffect(() => {
    if (isConnected) {
      navigate(from, { replace: true });
    }
  }, [isConnected, navigate, from]);

  return (
    <div className="min-h-screen bg-obsidian relative overflow-hidden">
      <Navbar />

      {/* Background elements */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-glow-violet/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="glass-card max-w-md w-full text-center space-y-8 p-10 rounded-3xl glow-violet"
        >
          {/* Logo */}
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-axiom-orange to-orange-600 flex items-center justify-center text-3xl font-black">
            A
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Connect Your Wallet</h1>
            <p className="text-white/50 text-sm leading-relaxed">
              AXIOM uses Stacks blockchain for pay-per-request API monetization. Connect your Leather wallet to continue.
            </p>
          </div>

          <button
            onClick={connectWallet}
            className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base"
          >
            <Wallet className="w-5 h-5" />
            Connect with Leather
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 text-xs text-white/30 justify-center">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure connection via Stacks Connect</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
