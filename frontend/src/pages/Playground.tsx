import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Type,
  Code2,
  Image,
  Loader2,
} from 'lucide-react';
import { getService, executeGateway } from '../lib/api';
import type { ApiService, Gateway402Response, GatewayExecuteResponse } from '../lib/types';
import PaymentModal from '../components/ui/PaymentModal';
import Spinner from '../components/ui/Spinner';
import ErrorBox from '../components/ui/ErrorBox';
import { useWallet } from '../context/WalletContext';

type ConsoleState = 'idle' | '402' | 'loading' | '200' | 'error';

export default function Playground() {
  const { id } = useParams<{ id: string }>();
  const { wallet } = useWallet();
  const [api, setApi] = useState<ApiService | null>(null);
  const [loadingApi, setLoadingApi] = useState(true);
  const [apiError, setApiError] = useState('');

  // Request state
  const [textInput, setTextInput] = useState('');
  const [jsonInput, setJsonInput] = useState('{\n  \n}');
  const [fileInput, setFileInput] = useState<File | null>(null);

  // Console state
  const [consoleState, setConsoleState] = useState<ConsoleState>('idle');
  const [invoiceData, setInvoiceData] = useState<Gateway402Response | null>(null);
  const [response, setResponse] = useState<GatewayExecuteResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [latency, setLatency] = useState(0);

  // Payment modal
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);

  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoadingApi(true);
    getService(id)
      .then(setApi)
      .catch((err) => setApiError(err.message))
      .finally(() => setLoadingApi(false));
  }, [id]);

  const getPayload = () => {
    if (!api) return null;
    switch (api.inputType) {
      case 'text':
        return { text: textInput };
      case 'pdf':
        return { filename: fileInput?.name || 'document.pdf', text: textInput || 'PDF content placeholder' };
      case 'json':
        try {
          return JSON.parse(jsonInput);
        } catch {
          return { raw: jsonInput };
        }
      default:
        return { text: textInput };
    }
  };

  const handleExecute = async () => {
    if (!api || !id) return;
    setConsoleState('loading');
    setErrorMsg('');
    setResponse(null);
    const startTime = Date.now();

    try {
      const result = await executeGateway(id, getPayload());
      setLatency(Date.now() - startTime);
      setResponse(result);
      setConsoleState('200');
    } catch (err: any) {
      setLatency(Date.now() - startTime);
      if (err.status === 402) {
        setInvoiceData(err.data);
        setConsoleState('402');
        setPaymentOpen(true);
      } else {
        setErrorMsg(err.message || 'Request failed');
        setConsoleState('error');
      }
    }
  };

  const handleSubmitProof = async (txHash: string) => {
    if (!api || !id) return;
    setSubmittingProof(true);
    const startTime = Date.now();

    try {
      const result = await executeGateway(id, getPayload(), txHash);
      setLatency(Date.now() - startTime);
      setResponse(result);
      setConsoleState('200');
      setPaymentOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment verification failed');
      setConsoleState('error');
      setPaymentOpen(false);
    } finally {
      setSubmittingProof(false);
    }
  };

  if (loadingApi) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (apiError || !api) {
    return <ErrorBox message={apiError || 'API not found'} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-axiom-orange/20 to-axiom-orange/5 flex items-center justify-center">
          <Code2 className="w-5 h-5 text-axiom-orange" />
        </div>
        <div>
          <h1 className="text-xl font-bold">API Playground</h1>
          <p className="text-xs text-white/40">{api.name} — {api.method} {api.endpoint}</p>
        </div>
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px]">
        {/* Left Pane: Request Builder */}
        <div className="glass-card space-y-4 flex flex-col">
          {/* Endpoint bar */}
          <div className="flex items-center gap-2 font-mono text-sm bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]">
            <span className="text-axiom-orange font-bold">{api.method}</span>
            <span className="text-white/60 truncate">https://axiom.gateway{api.endpoint}</span>
          </div>

          {/* Dynamic input */}
          <div className="flex-1 flex flex-col">
            <label className="text-xs text-white/40 mb-2 flex items-center gap-2">
              {api.inputType === 'text' && <><Type className="w-3 h-3" /> Text Input</>}
              {api.inputType === 'pdf' && <><FileText className="w-3 h-3" /> PDF Upload</>}
              {api.inputType === 'json' && <><Code2 className="w-3 h-3" /> JSON Body</>}
              {api.inputType === 'form' && <><Image className="w-3 h-3" /> Form Input</>}
            </label>

            {api.inputType === 'text' && (
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text to process..."
                className="input-glass flex-1 min-h-[200px] resize-none font-mono text-sm leading-relaxed"
              />
            )}

            {api.inputType === 'pdf' && (
              <div className="flex-1 flex flex-col gap-3">
                <div
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="flex-1 border-2 border-dashed border-white/[0.08] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-axiom-orange/30 transition-colors min-h-[120px]"
                >
                  <FileText className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-sm text-white/40">
                    {fileInput ? fileInput.name : 'Click to upload PDF'}
                  </p>
                  <p className="text-xs text-white/20 mt-1">or drag and drop</p>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                  />
                </div>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Or paste text content..."
                  className="input-glass min-h-[100px] resize-none font-mono text-sm"
                />
              </div>
            )}

            {api.inputType === 'json' && (
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{ "key": "value" }'
                className="input-glass flex-1 min-h-[200px] resize-none font-mono text-sm leading-relaxed"
                spellCheck={false}
              />
            )}

            {api.inputType === 'form' && (
              <div className="flex-1 flex flex-col gap-3">
                <div
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="border-2 border-dashed border-white/[0.08] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-axiom-orange/30 transition-colors min-h-[120px]"
                >
                  <Image className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-sm text-white/40">
                    {fileInput ? fileInput.name : 'Click to upload image'}
                  </p>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                  />
                </div>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Additional input..."
                  className="input-glass min-h-[80px] resize-none font-mono text-sm"
                />
              </div>
            )}
          </div>

          {/* Execute */}
          <button
            onClick={handleExecute}
            disabled={consoleState === 'loading'}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {consoleState === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Execute Request
              </>
            )}
          </button>
        </div>

        {/* Right Pane: Gateway Console */}
        <div ref={consoleRef} className="glass-card flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
            <h3 className="font-semibold text-sm">Gateway Console</h3>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  consoleState === 'idle'
                    ? 'bg-white/20'
                    : consoleState === '402'
                    ? 'bg-amber-400 animate-pulse'
                    : consoleState === '200'
                    ? 'bg-emerald-400'
                    : consoleState === 'loading'
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-red-400'
                }`}
              />
              <span className="text-xs text-white/40">
                {consoleState === 'idle' && 'Ready'}
                {consoleState === 'loading' && 'Processing...'}
                {consoleState === '402' && '402 Payment Required'}
                {consoleState === '200' && '200 OK'}
                {consoleState === 'error' && 'Error'}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* IDLE */}
            {consoleState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.03] flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-white/30 text-sm animate-pulse">Waiting for input...</p>
                </div>
              </motion.div>
            )}

            {/* LOADING */}
            {consoleState === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center"
              >
                <Spinner size={40} />
              </motion.div>
            )}

            {/* 402 */}
            {consoleState === '402' && invoiceData && (
              <motion.div
                key="402"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center space-y-4"
              >
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center space-y-3 w-full max-w-sm">
                  <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                  <div className="text-3xl font-black text-amber-300">402</div>
                  <p className="text-amber-400/80 font-medium">Payment Required</p>
                  <p className="text-sm text-white/50">
                    This request costs <span className="text-axiom-orange font-bold">{invoiceData.price} STX</span>
                  </p>
                  <button
                    onClick={() => setPaymentOpen(true)}
                    className="btn-violet w-full"
                  >
                    Unlock with Stacks
                  </button>
                </div>
              </motion.div>
            )}

            {/* 200 SUCCESS */}
            {consoleState === '200' && response && (
              <motion.div
                key="200"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-auto"
              >
                {/* Status bar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold text-sm">200 OK</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span>Latency: {response.latency || `${latency}ms`}</span>
                    <span className="text-emerald-400">Payment Confirmed</span>
                  </div>
                </div>

                {/* JSON response viewer */}
                <div className="flex-1 bg-white/[0.02] rounded-xl p-4 overflow-auto font-mono text-xs leading-relaxed">
                  <pre className="text-white/80 whitespace-pre-wrap">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>

                {/* Cost badge */}
                <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
                  <span>Cost: <span className="text-axiom-orange">{response.cost}</span></span>
                  <span>TX: <span className="font-mono">{response.tx_hash?.slice(0, 12)}...</span></span>
                </div>
              </motion.div>
            )}

            {/* ERROR */}
            {consoleState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-2 max-w-sm">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                  <p className="text-red-300 text-sm">{errorMsg}</p>
                  <button onClick={handleExecute} className="btn-secondary text-sm mt-2">
                    Retry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        invoiceData={invoiceData}
        onSubmitProof={handleSubmitProof}
        isSubmitting={submittingProof}
      />
    </div>
  );
}
