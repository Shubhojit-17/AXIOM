interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: 'orange' | 'violet' | 'green' | 'blue';
}

const colorMap = {
  orange: 'from-axiom-orange/20 to-axiom-orange/5 text-axiom-orange',
  violet: 'from-glow-violet/20 to-glow-violet/5 text-glow-violet',
  green: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
  blue: 'from-blue-500/20 to-blue-500/5 text-blue-400',
};

export default function StatCard({ label, value, sub, icon, color = 'orange' }: StatCardProps) {
  return (
    <div className="glass-card flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
