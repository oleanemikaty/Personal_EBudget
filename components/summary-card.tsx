'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  accent?: 'primary' | 'success' | 'destructive' | 'warning';
  delay?: number;
}

export function SummaryCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = 'primary',
  delay = 0,
}: SummaryCardProps) {
  const accentClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    destructive: 'bg-red-500/10 text-red-600 dark:text-red-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl',
            accentClasses[accent]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              trend >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-bold tracking-tight">{value}</p>
    </motion.div>
  );
}
