import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, Sparkles, Database } from 'lucide-react';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// 1. StatusBadge (Data Mode / System Status)
export const StatusBadge: React.FC<{
  type?: 'demo' | 'live' | 'operational' | 'degraded' | 'unavailable' | string;
  label?: string;
  size?: 'sm' | 'md';
}> = ({ type = 'demo', label, size = 'sm' }) => {
  const norm = type.toLowerCase();
  let bg = 'bg-slate-900/80 text-slate-300 border-slate-700';
  let dot = 'bg-slate-400';

  if (norm === 'live' || norm === 'operational') {
    bg = 'bg-[#22ffb7]/10 text-[#22ffb7] border-[#22ffb7]/40 shadow-[0_0_12px_rgba(34,255,183,0.2)]';
    dot = 'bg-[#22ffb7] animate-pulse';
  } else if (norm === 'demo' || norm === 'degraded') {
    bg = 'bg-[#ffb347]/10 text-[#ffb347] border-[#ffb347]/40 shadow-[0_0_12px_rgba(255,179,71,0.2)]';
    dot = 'bg-[#ffb347]';
  } else if (norm === 'unavailable' || norm === 'critical') {
    bg = 'bg-[#ff3860]/10 text-[#ff3860] border-[#ff3860]/40 shadow-[0_0_12px_rgba(255,56,96,0.2)]';
    dot = 'bg-[#ff3860]';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-orbitron font-semibold uppercase tracking-wider rounded-md border',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        bg
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      {label || type}
    </span>
  );
};

// 2. RiskBadge
export const RiskBadge: React.FC<{
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  score?: number;
}> = ({ level, score }) => {
  const l = (level || 'LOW').toUpperCase();
  let style = 'bg-[#22ffb7]/10 text-[#22ffb7] border-[#22ffb7]/40 shadow-[0_0_12px_rgba(34,255,183,0.25)]';
  let Icon = CheckCircle;

  if (l === 'CRITICAL') {
    style = 'bg-[#ff3860]/20 text-[#ff3860] border-[#ff3860]/60 shadow-[0_0_18px_rgba(255,56,96,0.35)] animate-pulse';
    Icon = ShieldAlert;
  } else if (l === 'HIGH') {
    style = 'bg-[#ffb347]/20 text-[#ffb347] border-[#ffb347]/50 shadow-[0_0_14px_rgba(255,179,71,0.3)]';
    Icon = AlertTriangle;
  } else if (l === 'MEDIUM') {
    style = 'bg-amber-950/70 text-amber-300 border-amber-700/60';
    Icon = Info;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-orbitron text-[11px] font-bold uppercase tracking-wider border',
        style
      )}
    >
      <Icon className="w-3 h-3" />
      {l} {score !== undefined && `(${score})`}
    </span>
  );
};

// 3. MetricCard
export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}> = ({ title, value, subtitle, icon, trend, trendUp }) => {
  return (
    <div className="orbit-card group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-orbitron font-medium uppercase tracking-wider text-[#8ba0c7]">
          {title}
        </span>
        {icon && <div className="text-[#00e5ff] group-hover:text-cyan-300">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold font-orbitron text-white tracking-tight">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-xs font-mono font-medium',
              trendUp ? 'text-[#22ffb7]' : 'text-[#ff3860]'
            )}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-[#8ba0c7]">{subtitle}</p>}
    </div>
  );
};

// 4. PageHeader
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, subtitle, badge, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[rgba(0,229,255,0.18)] mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-wider text-white uppercase font-orbitron drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-[#8ba0c7] font-rajdhani mt-1 font-medium">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

// 5. LoadingState / ErrorState / EmptyState
export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Propagating orbital ephemeris...',
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
    <div className="relative w-16 h-16 mb-4">
      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00e5ff] animate-spin" />
      <div className="absolute inset-3 rounded-full border-2 border-transparent border-t-[#7c4dff] animate-spin-reverse" />
    </div>
    <p className="text-base font-orbitron text-[#00e5ff] font-semibold tracking-widest animate-pulse">
      {message}
    </p>
    <p className="text-xs text-[#8ba0c7] mt-1 font-mono">Precision SGP4 Numerical Integration</p>
  </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'An orbital calculation or telemetry fetch error occurred.',
  onRetry,
}) => (
  <div className="p-8 border border-rose-900/50 bg-rose-950/20 rounded-xl text-center my-4">
    <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
    <h3 className="text-sm font-orbitron font-bold text-rose-200 uppercase tracking-wide">
      System Telemetry Alert
    </h3>
    <p className="text-xs text-rose-300/80 mt-1 max-w-md mx-auto font-mono">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-orbitron uppercase rounded border border-rose-700 transition-colors"
      >
        Retry Conjunction Request
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ title: string; description: string; action?: React.ReactNode }> = ({
  title,
  description,
  action,
}) => (
  <div className="orbit-card text-center p-12">
    <Database className="w-10 h-10 text-[#00e5ff]/50 mx-auto mb-3" />
    <h4 className="text-base font-orbitron font-semibold text-white">{title}</h4>
    <p className="text-xs text-[#8ba0c7] mt-1 max-w-sm mx-auto font-rajdhani">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);
