/**
 * StatsCard — dashboard statistic card with icon and glow
 */

import { motion } from 'framer-motion';

export default function StatsCard({ label, value, icon: Icon, color = 'sapphire', delay = 0 }) {
  const colorMap = {
    sapphire: {
      gradient: 'from-sapphire-500 to-sapphire-700',
      glow: 'shadow-[0_0_30px_rgba(59,80,224,0.2)]',
      text: 'text-sapphire-400',
      bg: 'bg-sapphire-500/10',
    },
    emerald: {
      gradient: 'from-emerald-500 to-emerald-700',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-700',
      glow: 'shadow-[0_0_30px_rgba(139,92,246,0.2)]',
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    amber: {
      gradient: 'from-amber-500 to-amber-700',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  };

  const c = colorMap[color] || colorMap.sapphire;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`glass rounded-2xl p-5 card-hover ${c.glow}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          {Icon && <Icon className={`text-xl ${c.text}`} />}
        </div>
      </div>
      <p className="text-3xl font-display font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-dark-300">{label}</p>
    </motion.div>
  );
}
