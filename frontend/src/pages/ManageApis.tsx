import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Trash2, Play, Pause, Eye, ExternalLink } from 'lucide-react';
import { getDeveloperServices, updateServiceStatus, deleteService } from '../lib/api';
import type { ApiService } from '../lib/types';
import { useWallet } from '../context/WalletContext';
import Spinner from '../components/ui/Spinner';
import ErrorBox from '../components/ui/ErrorBox';

export default function ManageApis() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchServices = async () => {
    if (!wallet) return;
    setLoading(true);
    setError('');
    try {
      const data = await getDeveloperServices(wallet);
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [wallet]);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await updateServiceStatus(id, newStatus);
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API?')) return;
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage APIs</h1>
          <p className="text-white/50 text-sm mt-1">Control your published API services</p>
        </div>
        <button
          onClick={() => navigate('/developer/register')}
          className="btn-primary text-sm"
        >
          + Register New
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : error ? (
        <ErrorBox message={error} onRetry={fetchServices} />
      ) : services.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No APIs registered</p>
          <p className="text-sm mt-1">Register your first API to start earning</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((api, i) => (
            <motion.div
              key={api.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-sm">{api.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      api.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : api.status === 'paused'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-white/[0.05] text-white/40'
                    }`}
                  >
                    {api.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                  <span>{api.category}</span>
                  <span>{api.pricePerReq} STX/req</span>
                  <span>{api.totalCalls} calls</span>
                  <span>{api.method}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/playground/${api.id}`)}
                  className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                  title="Open Playground"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleStatusToggle(api.id, api.status)}
                  className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                  title={api.status === 'active' ? 'Pause' : 'Activate'}
                >
                  {api.status === 'active' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(api.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
