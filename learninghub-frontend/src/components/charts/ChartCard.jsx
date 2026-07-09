import GlassCard from '../common/GlassCard';

export default function ChartCard({ title, subtitle, children, delay = 0, className = '' }) {
  return (
    <GlassCard hover={false} delay={delay} className={`!p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-white font-semibold">{title}</h3>
        {subtitle && <p className="text-dark-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="w-full">{children}</div>
    </GlassCard>
  );
}
