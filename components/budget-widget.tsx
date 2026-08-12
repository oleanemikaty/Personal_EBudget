'use client';

import { motion } from 'framer-motion';
import { getColor } from '@/lib/colors';
import {
  computeSummary,
  getStatusBadgeClass,
  getStatusText,
  getProgressGradient,
  getProgressColor,
} from '@/lib/budget';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

interface BudgetWidgetProps {
  name: string;
  icon: string;
  color: string;
  budget: number;
  used: number;
  symbol: string;
  delay?: number;
}

export function BudgetWidget({
  name,
  icon,
  color,
  budget,
  used,
  symbol,
  delay = 0,
}: BudgetWidgetProps) {
  const c = getColor(color);
  const summary = computeSummary(budget, used);
  const badgeClass = getStatusBadgeClass(summary.status);
  const isCustomColor = color.startsWith('#');
  const progressColor = getProgressColor(summary.progress);
  const barStyle = isCustomColor
    ? { background: getProgressGradient(summary.progress) }
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl text-lg',
              !isCustomColor && c.bg
            )}
            style={isCustomColor ? { backgroundColor: `${c.hex}1a` } : undefined}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <span
              className={cn(
                'inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                badgeClass
              )}
            >
              {getStatusText(summary.status)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">
            {formatCurrency(used, symbol)}
          </p>
          <p className="text-xs text-muted-foreground">
            of {formatCurrency(budget, symbol)}
          </p>
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(summary.progress, 100)}%` }}
          transition={{ duration: 0.6, delay: delay + 0.1, ease: 'easeOut' }}
          className={cn('h-full rounded-full', !isCustomColor && c.bar)}
          style={barStyle}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="text-muted-foreground">
          {summary.remaining >= 0 ? 'Remaining' : 'Over budget'}
        </span>
        <span
          className="font-medium"
          style={{ color: summary.remaining >= 0 ? undefined : progressColor }}
        >
          {formatCurrency(Math.abs(summary.remaining), symbol)}
        </span>
      </div>
    </motion.div>
  );
}
