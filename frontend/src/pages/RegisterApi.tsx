import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { createService } from '../lib/api';
import { useWallet } from '../context/WalletContext';
import type { CreateServicePayload } from '../lib/types';

const categories = ['AI/ML', 'Crypto Data', 'File Utilities', 'Web Scraping'];
const inputTypes = ['text', 'pdf', 'json', 'form', 'none'] as const;
const methods = ['GET', 'POST'] as const;

export default function RegisterApi() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'AI/ML',
    tags: '',
    upstreamUrl: '',
    method: 'POST' as 'GET' | 'POST',
    pricePerReq: 0.1,
    providerName: '',
    status: 'active' as 'active' | 'paused' | 'draft',
    inputType: 'text' as 'text' | 'pdf' | 'json' | 'form' | 'none',
    authHeader: '',
  });

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!wallet) return;
    setSubmitting(true);
    setError('');
    try {
      const payload: CreateServicePayload = {
        name: form.name,
        description: form.description,
        category: form.category,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        upstreamUrl: form.upstreamUrl,
        method: form.method,
        pricePerReq: form.pricePerReq,
        providerWallet: wallet,
        providerName: form.providerName || undefined,
        status: form.status,
        inputType: form.inputType,
        authHeader: form.authHeader || undefined,
      };
      await createService(payload);
      navigate('/developer/manage');
    } catch (err: any) {
      setError(err.message || 'Failed to register API');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: 'Basic Info',
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/40 block mb-2">API Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., AI Text Summarizer"
              className="input-glass"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe what your API does..."
              rows={3}
              className="input-glass resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-2">Provider Name (optional)</label>
            <input
              type="text"
              value={form.providerName}
              onChange={(e) => updateField('providerName', e.target.value)}
              placeholder="Your name or org"
              className="input-glass"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Configuration',
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/40 block mb-2">Upstream URL</label>
            <input
              type="url"
              value={form.upstreamUrl}
              onChange={(e) => updateField('upstreamUrl', e.target.value)}
              placeholder="https://your-api.com/endpoint"
              className="input-glass font-mono text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 block mb-2">Method</label>
              <div className="flex gap-2">
                {methods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateField('method', m)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      form.method === m
                        ? 'bg-axiom-orange text-white'
                        : 'glass text-white/60 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="input-glass text-sm"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-obsidian">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 block mb-2">Price per Request (STX)</label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                value={form.pricePerReq}
                onChange={(e) => updateField('pricePerReq', parseFloat(e.target.value) || 0)}
                className="input-glass"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                placeholder="ai, nlp, text"
                className="input-glass"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-2">Auth Header (optional)</label>
            <input
              type="text"
              value={form.authHeader}
              onChange={(e) => updateField('authHeader', e.target.value)}
              placeholder="Bearer sk-..."
              className="input-glass font-mono text-sm"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Playground Schema',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-white/50">
            Choose the input type for users in the API Playground.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {inputTypes.map((it) => (
              <button
                key={it}
                type="button"
                onClick={() => updateField('inputType', it)}
                className={`glass-card p-4 text-center transition-all duration-200 cursor-pointer ${
                  form.inputType === it
                    ? 'border-axiom-orange/50 bg-axiom-orange/5'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                <p className="font-bold text-sm capitalize">{it}</p>
                <p className="text-xs text-white/40 mt-1">
                  {it === 'text' && 'Textarea with line numbers'}
                  {it === 'pdf' && 'Drag & drop file upload'}
                  {it === 'json' && 'JSON body editor'}
                  {it === 'form' && 'Image upload field'}
                  {it === 'none' && 'No input required'}
                </p>
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-white/40 block mb-2">Initial Status</label>
            <div className="flex gap-2">
              {(['active', 'draft'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateField('status', s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                    form.status === s
                      ? s === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'glass text-white/60 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Register API</h1>
        <p className="text-white/50 text-sm mt-1">Publish your API to the AXIOM marketplace</p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                i < step
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : i === step
                  ? 'bg-axiom-orange text-white'
                  : 'glass text-white/30'
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs ${i === step ? 'text-white' : 'text-white/30'}`}>
              {s.title}
            </span>
            <div
              className={`w-full h-0.5 rounded-full ${
                i < step ? 'bg-emerald-500/40' : i === step ? 'bg-axiom-orange/40' : 'bg-white/[0.06]'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Step content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card"
      >
        <h2 className="font-bold text-lg mb-4">{steps[step].title}</h2>
        {steps[step].content}
      </motion.div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="btn-secondary flex items-center gap-2 disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="btn-primary flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.name || !form.upstreamUrl}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Publishing...' : (
              <>
                <PlusCircle className="w-4 h-4" />
                Publish API
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
