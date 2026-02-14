import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Play,
  Zap,
  ExternalLink,
  FileText,
  Type,
  Image as ImageIcon,
  Shield,
} from 'lucide-react';
import { getServices } from '../lib/api';
import type { ApiService } from '../lib/types';
import Spinner from '../components/ui/Spinner';

const tourSteps = [
  {
    icon: Wallet,
    title: 'Connect Wallet',
    desc: 'Authenticate with your Leather wallet via Stacks Connect',
    color: 'text-glow-violet',
    bg: 'bg-glow-violet/10',
  },
  {
    icon: AlertTriangle,
    title: 'Trigger 402',
    desc: 'Execute an API call without payment to see HTTP 402 in action',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: CheckCircle2,
    title: 'Verify 200',
    desc: 'Submit payment proof and receive the 200 OK response',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
];

const inputTypeIcon: Record<string, typeof Type> = {
  text: Type,
  pdf: FileText,
  form: ImageIcon,
  json: Zap,
};

export default function JudgePage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-axiom-orange font-medium mb-4">
          <Zap className="w-3 h-3" />
          Hackathon Demo Mode
        </div>
        <h1 className="text-3xl font-bold">Judge Quick Test</h1>
        <p className="text-white/50 text-sm max-w-lg mx-auto">
          Experience the full AXIOM 402 payment flow in 3 minutes. Connect wallet, trigger a payment-required response, and verify success.
        </p>
      </div>

      {/* Section 1: 30-second Tour Cards */}
      <div>
        <h2 className="font-bold text-lg mb-4">30-Second Tour</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tourSteps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="glass-card text-center space-y-3"
            >
              <div className={`w-12 h-12 mx-auto rounded-2xl ${step.bg} flex items-center justify-center`}>
                <step.icon className={`w-6 h-6 ${step.color}`} />
              </div>
              <div className="text-xs text-white/30 font-bold">Step {i + 1}</div>
              <h3 className="font-bold">{step.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section 2: Ready-to-Test Endpoints */}
      <div>
        <h2 className="font-bold text-lg mb-4">Ready-to-Test Endpoints</h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size={28} />
          </div>
        ) : services.length === 0 ? (
          <div className="glass-card text-center py-8 text-white/40 text-sm">
            No APIs available. Make sure the backend is running and seeded.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((api, i) => {
              const Icon = inputTypeIcon[api.inputType] || Zap;
              return (
                <motion.div
                  key={api.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-axiom-orange/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-axiom-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{api.name}</h3>
                      <p className="text-xs text-white/40">{api.category}</p>
                    </div>
                    <span className="text-axiom-orange font-bold text-sm">{api.pricePerReq} STX</span>
                  </div>
                  <p className="text-xs text-white/50 line-clamp-2">{api.description}</p>
                  <button
                    onClick={() => navigate(`/playground/${api.id}`)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-axiom-orange to-orange-600 hover:shadow-lg hover:shadow-axiom-orange/20 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Test {api.name}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: Technical Integrity */}
      <div>
        <h2 className="font-bold text-lg mb-4">Technical Integrity</h2>
        <div className="glass-card space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-glow-violet mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Smart Contract</h3>
              <p className="text-xs text-white/40 mt-1 font-mono">
                SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.axiom-gateway-v1
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-glow-violet mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Stacks Explorer</h3>
              <a
                href="https://explorer.stacks.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-axiom-orange hover:underline mt-1 block"
              >
                View on Stacks Explorer →
              </a>
            </div>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4 text-xs text-white/40 space-y-1">
            <p>• Every API call is logged with caller wallet, response code, and latency</p>
            <p>• Payment proofs (tx hashes) are validated and marked as single-use</p>
            <p>• Platform takes 10% fee, 90% goes directly to the API provider</p>
            <p>• All data stored in SQLite via Prisma ORM (production: PostgreSQL)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
