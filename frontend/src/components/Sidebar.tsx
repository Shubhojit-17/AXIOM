import { NavLink } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import {
  Store,
  ArrowLeftRight,
  Gavel,
  LayoutDashboard,
  PlusCircle,
  Settings,
  User,
} from 'lucide-react';

const userNav = [
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/judge', label: 'Judge Quick Test', icon: Gavel },
];

const devNav = [
  { to: '/developer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/developer/register', label: 'Register API', icon: PlusCircle },
  { to: '/developer/manage', label: 'Manage APIs', icon: Settings },
  { to: '/developer/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const { role } = useWallet();
  const nav = role === 'developer' ? devNav : userNav;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 glass border-r border-white/[0.08] z-40 flex flex-col py-6 px-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-white/30 px-3 mb-4">
        {role === 'developer' ? 'Developer' : 'Navigation'}
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-axiom-orange/10 text-axiom-orange border border-axiom-orange/20'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-3 text-xs text-white/20">
        AXIOM v1.0 — Pay-Per-Request
      </div>
    </aside>
  );
}
