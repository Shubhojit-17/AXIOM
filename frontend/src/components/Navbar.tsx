import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWallet, type Role } from '../context/WalletContext';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useEffect, useState } from 'react';

/* Pulsing geometric A logo */
function AxiomLogo() {
  return (
    <div className="relative w-8 h-8">
      {/* Pulse ring */}
      <div className="absolute inset-0 rounded-lg bg-axiom-orange/20 animate-logo-pulse" />
      {/* Core */}
      <svg viewBox="0 0 32 32" className="relative w-8 h-8" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="6" className="fill-axiom-orange" />
        <path
          d="M16 7L22.5 23H18.5L17 19H15L13.5 23H9.5L16 7Z"
          fill="white"
          fillOpacity="0.95"
        />
        <rect x="12.5" y="16" width="7" height="2" rx="0.5" fill="white" fillOpacity="0.6" />
      </svg>
    </div>
  );
}

export default function Navbar() {
  const { wallet, isConnected, connectWallet, disconnectWallet, role, setRole } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const isLanding = location.pathname === '/';

  // Scroll listener for nav background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDisconnect = () => {
    disconnectWallet();
    navigate('/');
  };

  const shortWallet = wallet ? `${wallet.slice(0, 5)}...${wallet.slice(-4)}` : '';

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ease-axiom ${
        isLanding
          ? 'top-5 left-1/2 -translate-x-1/2 w-auto max-w-[860px]'
          : 'top-0 left-0 right-0'
      }`}
    >
      <div
        className={`flex items-center justify-between gap-4 transition-all duration-500 ease-axiom ${
          isLanding
            ? `rounded-full px-5 py-2.5 backdrop-blur-xl border ${
                scrolled
                  ? 'bg-white/[0.06] border-white/[0.1] shadow-lg shadow-black/20'
                  : 'bg-white/[0.03] border-white/[0.06]'
              }`
            : 'glass h-16 px-6'
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <AxiomLogo />
          <span className="text-lg font-bold tracking-tight group-hover:text-axiom-orange transition-colors duration-300">
            AXIOM
          </span>
        </Link>

        {/* Network Status — landing only */}
        {isLanding && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-white/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>Stacks Mainnet</span>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {/* Role Switch */}
          {isConnected && (
            <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-full p-0.5 text-xs">
              <button
                onClick={() => setRole('user')}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  role === 'user'
                    ? 'bg-axiom-orange text-white shadow-sm shadow-axiom-orange/20'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                User
              </button>
              <button
                onClick={() => setRole('developer')}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  role === 'developer'
                    ? 'bg-glow-violet text-white shadow-sm shadow-glow-violet/20'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                Dev
              </button>
            </div>
          )}

          {/* Wallet */}
          {isConnected ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-300 text-xs font-medium">
                  <Wallet className="w-3.5 h-3.5 text-axiom-orange" />
                  <span>{shortWallet}</span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="glass rounded-xl p-2 min-w-[200px] mt-2 z-[100] animate-fade-in"
                  sideOffset={5}
                  align="end"
                >
                  <div className="px-3 py-2 text-xs text-white/40 font-mono break-all">
                    {wallet}
                  </div>
                  <DropdownMenu.Separator className="h-px bg-white/[0.08] my-1" />
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 rounded-lg cursor-pointer hover:bg-white/[0.05] outline-none"
                    onSelect={handleDisconnect}
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <button
              onClick={connectWallet}
              className="relative text-xs font-semibold px-5 py-2 rounded-full bg-axiom-orange text-white hover:shadow-lg hover:shadow-axiom-orange/25 transition-all duration-300 active:scale-[0.97]"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
