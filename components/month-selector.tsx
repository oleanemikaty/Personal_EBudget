'use client';

import { useMonth } from '@/hooks/use-month';
import { useSettings } from '@/hooks/use-settings';
import { getCurrencySymbol } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { monthLabel } from '@/lib/format';
import { ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listMonths } from '@/lib/data';
import { useEffect, useState } from 'react';
import type { BudgetMonth } from '@/lib/types';

export function MonthSelector() {
  const { currentMonth, setCurrentMonth } = useMonth();
  const settings = useSettings();
  const symbol = getCurrencySymbol(settings.currency);
  const [months, setMonths] = useState<BudgetMonth[]>([]);

  useEffect(() => {
    listMonths().then(setMonths);
  }, [currentMonth]);

  if (!currentMonth) {
    return <Skeleton className="h-9 w-32" />;
  }

  return (
    <Select value={currentMonth} onValueChange={setCurrentMonth}>
      <SelectTrigger className="h-9 w-auto gap-1 border-none bg-transparent px-2 text-base font-semibold shadow-none focus:ring-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {monthLabel(m.id)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
