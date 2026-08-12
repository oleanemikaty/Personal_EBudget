'use client';

import { motion } from 'framer-motion';
import { getColor } from '@/lib/colors';
import { formatCurrency, formatDateShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Transaction, SubBudget, BudgetGroup } from '@/lib/types';
import { Trash2 } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  group?: BudgetGroup;
  subBudget?: SubBudget;
  symbol: string;
  index?: number;
  onDelete?: (id: string) => void;
}

export function TransactionItem({
  transaction,
  group,
  subBudget,
  symbol,
  index = 0,
  onDelete,
}: TransactionItemProps) {
  const c = getColor(group?.color || 'slate');
  const isIncome = transaction.type === 'income';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="flex items-center gap-3 px-5 py-2.5"
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base',
          c.bg
        )}
      >
        {subBudget?.icon || group?.icon || '💰'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {subBudget?.name || group?.name || 'Income'}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatDateShort(transaction.date)}
          {transaction.notes ? ` · ${transaction.notes}` : ''}
        </p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-sm font-bold',
            isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-foreground'
          )}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount, symbol)}
        </p>
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(transaction.id)}
          className="ml-1 text-muted-foreground hover:text-red-500"
          aria-label="Delete transaction"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}
