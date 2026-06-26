import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  className?: string;
}

export function MetricCard({ label, value, sub, trend, trendValue, icon, highlight, className }: MetricCardProps) {
  return (
    <div className={cn(
      'bg-card rounded-lg border border-border p-5 flex flex-col gap-3',
      'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-shadow duration-200',
      highlight && 'border-l-2 border-l-primary',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
        {trend && trendValue && (
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-medium mb-0.5',
            trend === 'up' && 'text-[hsl(142_63%_35%)]',
            trend === 'down' && 'text-destructive',
            trend === 'flat' && 'text-muted-foreground',
          )}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {trendValue}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
