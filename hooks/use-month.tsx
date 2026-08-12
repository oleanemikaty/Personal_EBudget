'use client';

// Polyfill BroadcastChannel before Dexie hooks are imported.
// In some SSR environments the global BroadcastChannel constructor exists
// but throws when instantiated, crashing server-side rendering.
if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
  const g = globalThis as any;
  if (!g.__bcPolyfilled) {
    g.__bcPolyfilled = true;
    g.BroadcastChannel = class NoopBroadcastChannel {
      onmessage: any = null;
      constructor(_name: string) {}
      postMessage() {}
      addEventListener() {}
      removeEventListener() {}
      close() {}
    };
  }
}

import { createContext, useContext, useState, useEffect } from 'react';
import { monthKey } from '@/lib/format';
import { ensureMonth, ensureTemplate, seedSampleData, getMonth } from '@/lib/data';
import type { BudgetMonth } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';

interface MonthContextValue {
  currentMonth: string;
  setCurrentMonth: (key: string) => void;
  month: BudgetMonth | undefined;
  ready: boolean;
}

const MonthContext = createContext<MonthContextValue | null>(null);

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [ready, setReady] = useState(false);

  const month = useLiveQuery(
    async () => (typeof window === 'undefined' || !currentMonth ? undefined : getMonth(currentMonth)),
    [currentMonth],
    undefined
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (async () => {
      await ensureTemplate();
      await seedSampleData();
      const key = monthKey();
      await ensureMonth(key);
      setCurrentMonth(key);
      setReady(true);
    })();
  }, []);

  const value: MonthContextValue = {
    currentMonth,
    setCurrentMonth,
    month,
    ready,
  };

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used within MonthProvider');
  return ctx;
}
