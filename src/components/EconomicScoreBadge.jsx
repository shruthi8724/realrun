import React from 'react';

export default function EconomicScoreBadge({ score, showLabel = true, size = 'md' }) {
  // Score range 0-100. Lower is better.
  let colorStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let labelText = 'OPTIMAL';
  let shadowGlow = 'shadow-emerald-950/50';

  if (score > 60) {
    colorStyles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    labelText = 'HIGH RISK';
    shadowGlow = 'shadow-rose-950/50';
  } else if (score > 35) {
    colorStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    labelText = 'MODERATE';
    shadowGlow = 'shadow-amber-950/50';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border font-mono font-bold ${colorStyles} ${sizeClasses} shadow-lg ${shadowGlow}`}>
      <span>EIS: {score}</span>
      {showLabel && (
        <span className="text-[10px] uppercase font-sans tracking-wider opacity-80 border-l border-current/30 pl-2">
          {labelText}
        </span>
      )}
    </div>
  );
}
