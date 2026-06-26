import React from 'react';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: 'low' | 'moderate' | 'high';
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      level === 'low' && 'bg-[hsl(142_63%_90%)] text-[hsl(142_63%_25%)]',
      level === 'moderate' && 'bg-[hsl(38_92%_90%)] text-[hsl(38_70%_28%)]',
      level === 'high' && 'bg-[hsl(0_72%_92%)] text-[hsl(0_72%_36%)]',
      className
    )}>
      {level === 'low' ? 'Low Risk' : level === 'moderate' ? 'Moderate' : 'High Risk'}
    </span>
  );
}

interface AdherenceBadgeProps {
  value: number;
  className?: string;
}

export function AdherenceBadge({ value, className }: AdherenceBadgeProps) {
  const color = value >= 90 ? 'text-[hsl(142_63%_30%)]' : value >= 75 ? 'text-[hsl(38_70%_35%)]' : 'text-destructive';
  return (
    <span className={cn('text-sm font-semibold tabular-nums', color, className)}>
      {value}%
    </span>
  );
}

interface StatusDotProps {
  status: 'active' | 'away' | 'offline';
}

export function StatusDot({ status }: StatusDotProps) {
  return (
    <span className={cn(
      'inline-block w-2 h-2 rounded-full',
      status === 'active' && 'bg-[hsl(142_63%_35%)]',
      status === 'away' && 'bg-[hsl(38_92%_50%)]',
      status === 'offline' && 'bg-muted-foreground',
    )} />
  );
}
