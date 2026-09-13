import React from 'react';

interface GradeBadgeProps {
  grade?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({
  grade = 'N/A',
  size = 'md',
  showLabel = false,
}) => {
  const g = grade.toUpperCase();

  const getTheme = () => {
    switch (g) {
      case 'A':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
          label: 'Premium Export',
        };
      case 'B':
        return {
          bg: 'bg-blue-500/15 border-blue-500/40 text-blue-400',
          glow: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]',
          label: 'Good Commercial',
        };
      case 'C':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
          label: 'Fair / Processing',
        };
      case 'D':
        return {
          bg: 'bg-orange-500/15 border-orange-500/40 text-orange-400',
          glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]',
          label: 'Substandard',
        };
      case 'REJECT':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]',
          label: 'Discard / Unfit',
        };
      default:
        return {
          bg: 'bg-slate-700/30 border-slate-600 text-slate-400',
          glow: '',
          label: 'Pending',
        };
    }
  };

  const theme = getTheme();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 border font-semibold rounded',
    md: 'text-sm px-2.5 py-1 border font-bold rounded-md',
    lg: 'text-lg px-4 py-2 border-2 font-extrabold rounded-lg',
    xl: 'text-3xl px-6 py-4 border-2 font-black rounded-xl tracking-wider',
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center transition-all ${sizeClasses[size]} ${theme.bg} ${theme.glow}`}
      >
        Grade {g}
      </span>
      {showLabel && (
        <span className="text-xs text-slate-400 font-medium">({theme.label})</span>
      )}
    </div>
  );
};
