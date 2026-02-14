import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Activity,
  Users,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { getDeveloperStats, getDeveloperEarnings, getDeveloperFeed } from '../lib/api';
import type { DeveloperStats, EarningsDataPoint, Transaction } from '../lib/types';
import { useWallet } from '../context/WalletContext';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import ErrorBox from '../components/ui/ErrorBox';

export default function DeveloperDashboard() {
  const { wallet } = useWallet();
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [earnings, setEarnings] = useState<EarningsDataPoint[]>([]);
  const [feed, setFeed] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!wallet) return;
    setLoading(true);
    setError('');
    try {
      const [s, e, f] = await Promise.all([
        getDeveloperStats(wallet),
        getDeveloperEarnings(wallet, period),
        getDeveloperFeed(wallet),
      ]);
      setStats(s);
      setEarnings(e);
      setFeed(f);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [wallet, period]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return <ErrorBox message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Developer Dashboard</h1>
        <p className="text-white/50 text-sm mt-1">Monitor your API performance and earnings</p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Earned"
            value={`${stats.totalRevenue} STX`}
            icon={<DollarSign className="w-5 h-5" />}
            color="orange"
          />
          <StatCard
            label="Total Calls"
            value={stats.totalCalls}
            icon={<Activity className="w-5 h-5" />}
            color="violet"
          />
          <StatCard
            label="Conversion Rate"
            value={`${stats.conversionRate}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Avg Latency"
            value={`${stats.avgLatency}ms`}
            icon={<Clock className="w-5 h-5" />}
            color="blue"
          />
        </div>
      )}

      {/* Revenue Chart */}
      <div className="glass-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Revenue</h2>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                  period === p
                    ? 'bg-axiom-orange text-white'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={earnings}>
              <defs>
                <linearGradient id="colorStx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FC6432" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FC6432" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="stx"
                stroke="#FC6432"
                strokeWidth={2}
                fill="url(#colorStx)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-Time Feed */}
      <div className="glass-card space-y-4">
        <h2 className="font-bold">Real-Time Feed</h2>
        {feed.length === 0 ? (
          <p className="text-white/30 text-sm py-4 text-center">No recent payments</p>
        ) : (
          <div className="space-y-2">
            {feed.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-axiom-orange" />
                  <div>
                    <p className="text-sm">
                      <span className="font-mono text-xs text-white/50">{tx.hash}</span>
                      {' '}paid{' '}
                      <span className="text-axiom-orange font-bold">{tx.amount} STX</span>
                      {' '}for {tx.apiName}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-white/30">{tx.timestamp}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
