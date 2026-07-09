export const CHART_COLORS = {
  emerald: '#10b981',
  sapphire: '#3b50e0',
  amber: '#f59e0b',
  purple: '#a855f7',
  rose: '#f43f5e',
};

export const PIE_COLORS = ['#10b981', '#3b50e0', '#f59e0b', '#a855f7', '#f43f5e'];

export const AXIS_STYLE = { fill: '#94a3b8', fontSize: 12 };
export const GRID_STROKE = 'rgba(255,255,255,0.06)';

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-medium rounded-xl px-3 py-2 border border-white/10 text-sm shadow-xl">
      {label && <p className="text-dark-300 mb-1">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export function ChartLegend({ payload }) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-3">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2 text-xs text-dark-300">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  );
}
