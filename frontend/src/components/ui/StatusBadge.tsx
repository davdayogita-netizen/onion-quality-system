import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toLowerCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (s.includes('completed') || s.includes('premium') || s.includes('good')) {
    styles = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  } else if (s.includes('pending') || s.includes('uploaded') || s.includes('processing')) {
    styles = 'bg-amber-950/60 text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-400 animate-pulse';
  } else if (s.includes('fail') || s.includes('reject')) {
    styles = 'bg-rose-950/60 text-rose-300 border-rose-500/30';
    dotColor = 'bg-rose-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};
