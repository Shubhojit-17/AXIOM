import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useAnimationFrame, AnimatePresence } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import Navbar from '../components/Navbar';
import { Zap, Scaling, Banknote, ShieldCheck, ArrowRight, Terminal, Lock, Coins } from 'lucide-react';

/* ────────────────────────────────────────
   Magnetic Button — pulls toward cursor
   ──────────────────────────────────────── */
function MagneticButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouse = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      x.set((e.clientX - cx) * 0.25);
      y.set((e.clientY - cy) * 0.25);
    },
    [x, y]
  );

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/* ────────────────────────────────────────
   Network Pulse — ripple every 5 seconds
   ──────────────────────────────────────── */
function NetworkPulse() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setKey((k) => k + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={key}
          initial={{ scale: 0.3, opacity: 0.35 }}
          animate={{ scale: 3, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-axiom-orange/20"
        />
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────
   Value Stream Lines — floating glowing lines
   ──────────────────────────────────────── */
function ValueStreams() {
  const lines = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    startX: 10 + Math.random() * 80,
    delay: i * 0.8,
    duration: 6 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {lines.map((l) => (
        <motion.div
          key={l.id}
          className="absolute w-px"
          style={{
            left: `${l.startX}%`,
            top: '-10%',
            height: '120%',
            background: `linear-gradient(180deg, transparent 0%, rgba(252,100,50,0.12) 30%, rgba(252,100,50,0.03) 70%, transparent 100%)`,
          }}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: '100%', opacity: [0, 0.7, 0.7, 0] }}
          transition={{
            duration: l.duration,
            repeat: Infinity,
            delay: l.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────
   Protocol Terminal — animated code sequence
   ─────────────────────────────────────────────────────── */
function ProtocolTerminal() {
  const lines = [
    { prefix: '>', text: 'GET /api/v1/summarize', color: 'text-emerald-400' },
    { prefix: ' ', text: 'Authorization: Bearer stx_pay', color: 'text-white/40' },
    { prefix: ' ', text: '', color: '' },
    { prefix: '<', text: '402 Payment Required', color: 'text-amber-400' },
    { prefix: ' ', text: '{"invoice": "SP2...AX", "amount": "0.5 STX"}', color: 'text-white/30' },
    { prefix: ' ', text: '', color: '' },
    { prefix: '>', text: 'X-Payment-TX: 0x7f3a...c9d1', color: 'text-glow-violet' },
    { prefix: '<', text: '200 OK  ✓  240ms', color: 'text-emerald-400' },
  ];

  return (
    <div className="font-mono text-[11px] leading-relaxed space-y-0.5">
      {lines.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 + i * 0.25, duration: 0.4 }}
          className="whitespace-nowrap"
        >
          <span className="text-white/20 mr-2">{l.prefix}</span>
          <span className={l.color}>{l.text}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Main Landing Page
   ──────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: containerRef });
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Mouse flashlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 25 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    },
    [mouseX, mouseY]
  );

  // Watermark zoom on scroll (AXIOM text becomes a portal)
  const watermarkScale = useTransform(heroScrollProgress, [0, 1], [1, 12]);
  const watermarkOpacity = useTransform(heroScrollProgress, [0, 0.4, 0.8], [0.04, 0.06, 0]);

  // Protocol section transforms
  const protocolY = useTransform(scrollYProgress, [0.05, 0.2], [100, 0]);
  const protocolOpacity = useTransform(scrollYProgress, [0.05, 0.15, 0.35, 0.42], [0, 1, 1, 0]);
  const protocolScale = useTransform(scrollYProgress, [0.05, 0.15], [0.85, 1]);

  // STX coin flight
  const coinX = useTransform(scrollYProgress, [0.22, 0.35], [0, 280]);
  const coinY = useTransform(scrollYProgress, [0.22, 0.28, 0.35], [0, -40, 0]);
  const coinOpacity = useTransform(scrollYProgress, [0.20, 0.23, 0.34, 0.38], [0, 1, 1, 0]);
  const coinScale = useTransform(scrollYProgress, [0.22, 0.28, 0.35], [1, 1.3, 1]);

  // Success section
  const successOpacity = useTransform(scrollYProgress, [0.38, 0.45, 0.55, 0.62], [0, 1, 1, 0]);
  const successScale = useTransform(scrollYProgress, [0.38, 0.45], [0.8, 1]);

  // Redirect after wallet connection
  useEffect(() => {
    if (isConnected) {
      navigate('/marketplace');
    }
  }, [isConnected, navigate]);

  const handleCTA = (path: string) => {
    if (isConnected) {
      navigate(path);
    } else {
      navigate('/auth');
    }
  };

  const features = [
    { icon: Zap, title: 'Zero Setup', desc: 'Register your API and start earning in minutes. No infra required.' },
    { icon: Scaling, title: 'Auto Scaling', desc: 'Gateway handles traffic spikes. You never manage servers.' },
    { icon: Banknote, title: 'Instant Payouts', desc: 'STX payments settle directly to your wallet. No delays.' },
    { icon: ShieldCheck, title: 'Smart Contract Escrow', desc: 'On-chain payment verification ensures trust for every request.' },
  ];

  return (
    <div ref={containerRef} className="relative bg-obsidian" onMouseMove={handleMouseMove}>
      <Navbar />

      {/* ═══════════ Flashlight cursor ═══════════ */}
      <motion.div
        className="fixed pointer-events-none z-30 w-[700px] h-[700px] rounded-full"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
          background: 'radial-gradient(circle, rgba(252,100,50,0.035) 0%, transparent 70%)',
        }}
      />

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden">
        {/* ── Ambient Glow: "Sunset on Obsidian" ── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Violet top-right */}
          <div className="absolute -top-[20%] -right-[15%] w-[700px] h-[700px] rounded-full bg-glow-violet/[0.07] blur-[120px]" />
          {/* Orange bottom-left */}
          <div className="absolute -bottom-[20%] -left-[15%] w-[700px] h-[700px] rounded-full bg-axiom-orange/[0.06] blur-[120px]" />
        </div>

        {/* ── Grid ── */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '70px 70px',
          }}
        />

        {/* ── Value Streams ── */}
        <ValueStreams />
        <NetworkPulse />

        {/* ── AXIOM Watermark ── */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ scale: watermarkScale, opacity: watermarkOpacity }}
        >
          <span className="text-[20vw] font-black tracking-tighter text-white whitespace-nowrap">
            AXIOM
          </span>
        </motion.div>

        {/* ── Hero Content ── */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="w-full max-w-[1300px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* LEFT: Asymmetric typography */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8 max-w-xl"
            >
              {/* Kicker */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-white/50"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-axiom-orange opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-axiom-orange" />
                </span>
                Pay-Per-Request Protocol on Stacks
              </motion.div>

              <h1 className="text-[2.8rem] md:text-[3.6rem] lg:text-[4.2rem] font-black leading-[1.05] tracking-tight">
                The Flow
                <br />
                of{' '}
                <span className="text-gradient-orange">Value.</span>
              </h1>

              <p className="text-white/45 text-lg md:text-xl leading-relaxed max-w-md">
                AXIOM replaces subscriptions with per-request payments.
                HTTP 402 meets the Stacks blockchain — APIs get paid by the call.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <MagneticButton
                  onClick={() => handleCTA('/marketplace')}
                  className="group relative px-7 py-3.5 rounded-2xl bg-axiom-orange text-white font-semibold text-sm
                    hover:shadow-[0_0_30px_rgba(252,100,50,0.35)] transition-shadow duration-500
                    backdrop-blur-md border border-axiom-orange/30 flex items-center gap-2.5"
                >
                  Explore APIs
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </MagneticButton>
                <MagneticButton
                  onClick={() => handleCTA('/developer/register')}
                  className="group relative px-7 py-3.5 rounded-2xl font-semibold text-sm
                    backdrop-blur-md bg-white/[0.04] border border-white/[0.08]
                    hover:bg-white/[0.08] hover:border-white/[0.14] hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]
                    transition-all duration-500 flex items-center gap-2.5"
                >
                  Publish API
                </MagneticButton>
              </div>

              {/* Protocol stats row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex gap-8 pt-4 text-xs font-mono text-white/30"
              >
                <div>
                  <span className="block text-base font-bold text-white/70">402</span>
                  Protocol
                </div>
                <div>
                  <span className="block text-base font-bold text-white/70">STX</span>
                  Settlement
                </div>
                <div>
                  <span className="block text-base font-bold text-white/70">&lt;1s</span>
                  Verification
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT: Split-screen terminal + vault */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Glow behind card */}
              <div className="absolute -inset-8 bg-gradient-to-br from-glow-violet/[0.06] via-transparent to-axiom-orange/[0.06] rounded-3xl blur-2xl" />

              <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                  <span className="ml-2 text-[10px] font-mono text-white/25">axiom-protocol</span>
                </div>

                {/* Split pane */}
                <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                  {/* Terminal pane */}
                  <div className="p-5 min-h-[260px]">
                    <div className="flex items-center gap-1.5 mb-4 text-[10px] font-mono text-white/30">
                      <Terminal className="w-3 h-3" />
                      <span>request</span>
                    </div>
                    <ProtocolTerminal />
                  </div>

                  {/* Vault pane */}
                  <div className="p-5 min-h-[260px] flex flex-col items-center justify-center space-y-4">
                    <div className="flex items-center gap-1.5 mb-2 text-[10px] font-mono text-white/30 self-start">
                      <Lock className="w-3 h-3" />
                      <span>vault</span>
                    </div>

                    {/* Animated vault icon */}
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-glow-violet/10 to-axiom-orange/10 border border-white/[0.06] flex items-center justify-center"
                    >
                      <Coins className="w-7 h-7 text-axiom-orange/60" />
                    </motion.div>

                    <div className="text-center space-y-1">
                      <motion.p
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        className="text-xl font-bold font-mono text-axiom-orange"
                      >
                        0.5 STX
                      </motion.p>
                      <p className="text-[10px] font-mono text-white/25">per request</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 pt-2 w-full">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        verified on-chain
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
        >
          <span className="text-[10px] font-mono tracking-widest uppercase">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center p-1.5"
          >
            <div className="w-1 h-1.5 rounded-full bg-white/30" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ SCROLL STORY ═══════════ */}
      <div className="relative z-10 h-[300vh]">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-obsidian">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-radial from-glow-violet/[0.04] to-transparent" />
          </div>

          {/* Protocol flow card */}
          <motion.div
            style={{ y: protocolY, opacity: protocolOpacity, scale: protocolScale }}
            className="relative max-w-xl w-full mx-6"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <span className="text-2xl font-black text-amber-400">402</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">Payment Required</p>
                  <p className="text-xs text-white/30 font-mono">The protocol in action</p>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between">
                  {/* API side */}
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <Terminal className="w-6 h-6 text-white/40" />
                    </div>
                    <p className="text-[10px] font-mono text-white/30">API Call</p>
                  </div>

                  {/* Arrow track */}
                  <div className="flex-1 mx-4 relative h-px bg-white/[0.06]">
                    <motion.div
                      style={{ x: coinX, y: coinY, opacity: coinOpacity, scale: coinScale }}
                      className="absolute -top-3 left-0"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-axiom-orange to-orange-500 flex items-center justify-center shadow-lg shadow-axiom-orange/30">
                        <span className="text-[8px] font-black text-white">STX</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Vault side */}
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-xl bg-glow-violet/10 border border-glow-violet/20 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-glow-violet/60" />
                    </div>
                    <p className="text-[10px] font-mono text-white/30">Vault</p>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-white/25 font-mono">
                HTTP 402 → Payment → Verification → API Response
              </div>
            </div>
          </motion.div>

          {/* Success state */}
          <motion.div
            style={{ opacity: successOpacity, scale: successScale }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] backdrop-blur-xl p-10 text-center space-y-4 max-w-md">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center"
              >
                <span className="text-3xl">✓</span>
              </motion.div>
              <p className="text-2xl font-bold text-emerald-400">200 OK</p>
              <pre className="text-xs font-mono text-white/40 text-left inline-block">
{`{
  "summary": "AI-generated content...",
  "latency": "240ms",
  "tx_verified": true,
  "cost": "0.5 STX"
}`}
              </pre>
              <p className="text-xs text-white/20 font-mono">Transaction verified on-chain in 800ms</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════ FEATURES ═══════════ */}
      <div className="relative z-10 py-32 px-6">
        {/* Section ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-axiom-orange/20 to-transparent" />

        <div className="max-w-5xl mx-auto space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Why <span className="text-gradient-orange">AXIOM</span>?
            </h2>
            <p className="text-white/35 max-w-lg mx-auto">
              Everything you need to monetize APIs with zero friction.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-4
                  hover:border-axiom-orange/15 hover:bg-white/[0.04] transition-all duration-500 text-center"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-axiom-orange/[0.08] flex items-center justify-center
                  group-hover:bg-axiom-orange/[0.15] transition-colors duration-500"
                >
                  <f.icon className="w-5 h-5 text-axiom-orange/80" />
                </div>
                <h3 className="font-bold text-sm">{f.title}</h3>
                <p className="text-xs text-white/35 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ Divider ═══════════ */}
      <div className="relative z-10 px-6">
        <div className="max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ═══════════ Bottom CTA ═══════════ */}
      <div className="relative z-10 py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Ready to build the future of API monetization?
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Join AXIOM and start earning per request — no subscriptions, no middlemen.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <MagneticButton
              onClick={() => handleCTA('/marketplace')}
              className="px-8 py-3.5 rounded-2xl bg-axiom-orange text-white font-semibold text-sm
                hover:shadow-[0_0_30px_rgba(252,100,50,0.35)] transition-shadow duration-500 border border-axiom-orange/30"
            >
              Browse Marketplace
            </MagneticButton>
            <MagneticButton
              onClick={() => handleCTA('/developer/register')}
              className="px-8 py-3.5 rounded-2xl font-semibold text-sm backdrop-blur-md
                bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14]
                hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] transition-all duration-500"
            >
              Register Your API
            </MagneticButton>
          </div>
        </motion.div>
      </div>

      {/* ═══════════ Footer ═══════════ */}
      <div className="relative z-10 px-6 pb-12">
        <div className="max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-8" />
        <p className="text-center text-[11px] font-mono text-white/15 tracking-wider">
          AXIOM — Pay-Per-Request API Gateway powered by Stacks Blockchain
        </p>
      </div>
    </div>
  );
}
