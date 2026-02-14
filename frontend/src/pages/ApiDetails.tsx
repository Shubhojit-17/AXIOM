import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Zap,
  Activity,
  Clock,
  DollarSign,
  Play,
  Globe,
  Tag,
} from 'lucide-react';
import { getService } from '../lib/api';
import type { ApiService } from '../lib/types';
import Spinner from '../components/ui/Spinner';
import ErrorBox from '../components/ui/ErrorBox';

export default function ApiDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [api, setApi] = useState<ApiService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getService(id)
      .then(setApi)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !api) {
    return <ErrorBox message={error || 'API not found'} />;
  }

  const tags: string[] = Array.isArray(api.tags) ? api.tags : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Back */}
      <button
        onClick={() => navigate('/marketplace')}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </button>

      {/* Header */}
      <div className="glass-card space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-axiom-orange/20 to-axiom-orange/5 flex items-center justify-center">
              <Zap className="w-7 h-7 text-axiom-orange" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{api.name}</h1>
              <p className="text-sm text-white/40">by {api.provider}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/playground/${api.id}`)}
            className="btn-primary flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Open Playground
          </button>
        </div>

        <p className="text-white/60 text-sm leading-relaxed">{api.description}</p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-white/[0.04] text-white/50"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card text-center space-y-1">
          <DollarSign className="w-5 h-5 text-axiom-orange mx-auto" />
          <p className="text-xl font-bold text-axiom-orange">{api.pricePerReq} STX</p>
          <p className="text-xs text-white/40">per request</p>
        </div>
        <div className="glass-card text-center space-y-1">
          <Activity className="w-5 h-5 text-emerald-400 mx-auto" />
          <p className="text-xl font-bold">{api.uptime}%</p>
          <p className="text-xs text-white/40">uptime</p>
        </div>
        <div className="glass-card text-center space-y-1">
          <Clock className="w-5 h-5 text-blue-400 mx-auto" />
          <p className="text-xl font-bold">{api.latency}ms</p>
          <p className="text-xs text-white/40">avg latency</p>
        </div>
        <div className="glass-card text-center space-y-1">
          <Globe className="w-5 h-5 text-glow-violet mx-auto" />
          <p className="text-xl font-bold">{api.totalCalls}</p>
          <p className="text-xs text-white/40">total calls</p>
        </div>
      </div>

      {/* Technical Details */}
      <div className="glass-card space-y-4">
        <h2 className="font-bold text-lg">Technical Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/40">Method</span>
              <span className="font-mono text-axiom-orange">{api.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Input Type</span>
              <span className="font-mono">{api.inputType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Category</span>
              <span>{api.category}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/40">Status</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  api.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                {api.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Success Rate</span>
              <span>{api.stats.successRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Gateway Endpoint</span>
              <span className="font-mono text-xs truncate max-w-[200px]">{api.endpoint}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
