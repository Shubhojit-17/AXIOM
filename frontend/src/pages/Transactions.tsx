import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getTransactions } from '../lib/api';
import type { Transaction } from '../lib/types';
import { useWallet } from '../context/WalletContext';
import Spinner from '../components/ui/Spinner';
import ErrorBox from '../components/ui/ErrorBox';

export default function Transactions() {
  const { wallet } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTx = () => {
    setLoading(true);
    setError('');
    getTransactions(wallet || undefined)
      .then(setTransactions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTx();
  }, [wallet]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-white/50 text-sm mt-1">Your payment history on AXIOM</p>
        </div>
        <button onClick={fetchTx} className="btn-secondary text-sm px-4 py-2">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : error ? (
        <ErrorBox message={error} onRetry={fetchTx} />
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No transactions yet</p>
          <p className="text-sm mt-1">Execute an API call from the Playground to get started</p>
        </div>
      ) : (
        <div className="glass-card p-0 overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-6 py-4">
                    API
                  </th>
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-6 py-4">
                    Amount
                  </th>
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-6 py-4">
                    TX Hash
                  </th>
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-6 py-4">
                    Time
                  </th>
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-6 py-4">
                    Response
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {statusIcon(tx.status)}
                        <span className="text-xs capitalize">{tx.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">{tx.apiName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-axiom-orange font-bold">{tx.amount} STX</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-white/50">{tx.hash}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-white/40">{tx.timestamp}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-mono ${
                          tx.responseCode === 200 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {tx.responseCode || '—'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
