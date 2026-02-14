import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Zap, Activity } from 'lucide-react';
import { getServices } from '../lib/api';
import type { ApiService } from '../lib/types';
import Spinner from '../components/ui/Spinner';
import ErrorBox from '../components/ui/ErrorBox';

const categories = ['All', 'AI/ML', 'Crypto Data', 'File Utilities', 'Web Scraping'];

export default function Marketplace() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getServices({
        category: category !== 'All' ? category : undefined,
        search: search || undefined,
      });
      setServices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [category]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Marketplace</h1>
        <p className="text-white/50 text-sm mt-1">Discover and use pay-per-request APIs</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center sticky top-20 z-30">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search APIs..."
            className="input-glass pl-10 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                category === cat
                  ? 'bg-axiom-orange text-white'
                  : 'glass text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : error ? (
        <ErrorBox message={error} onRetry={fetchServices} />
      ) : services.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <p className="text-lg">No APIs found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((api, i) => (
            <motion.div
              key={api.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => navigate(`/marketplace/${api.id}`)}
              className="glass-card glass-hover cursor-pointer group space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-axiom-orange/20 to-axiom-orange/5 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-axiom-orange" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm group-hover:text-axiom-orange transition-colors">
                      {api.name}
                    </h3>
                    <p className="text-xs text-white/40">{api.provider}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    api.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {api.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                {api.description}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-white/40">
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>{api.uptime}% uptime</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{api.latency}ms</span>
                </div>
              </div>

              {/* Sparkline placeholder + price */}
              <div className="flex items-end justify-between border-t border-white/[0.05] pt-3">
                <div className="flex gap-[2px] items-end h-6">
                  {Array.from({ length: 12 }, (_, j) => (
                    <div
                      key={j}
                      className="w-1.5 bg-axiom-orange/30 rounded-full"
                      style={{ height: `${Math.random() * 100}%` }}
                    />
                  ))}
                </div>
                <span className="text-axiom-orange font-bold text-base">
                  {api.pricePerReq} STX<span className="text-[10px] font-normal text-white/40"> / req</span>
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/playground/${api.id}`);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-glow-violet to-purple-600 hover:shadow-lg hover:shadow-glow-violet/25 transition-all duration-200 text-center"
                >
                  Try Now
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/marketplace/${api.id}`);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white glass glass-hover transition-all duration-200"
                >
                  Docs
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
