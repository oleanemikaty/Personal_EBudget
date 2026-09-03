'use client';

import { useLiveQuery } from '@/hooks/use-live-query';
import { getAllSettings } from '@/lib/data';

export interface AppSettings {
  currency: string;
  theme: string;
  language: string;
  pinEnabled: string;
  pin: string;
  autoLock: string;
  syncMode: string;
}

const DEFAULTS: AppSettings = {
  currency: 'IDR',
  theme: 'system',
  language: 'en',
  pinEnabled: 'false',
  pin: '',
  autoLock: '60',
  syncMode: 'local',
};

export function useSettings(): AppSettings {
  const rows = useLiveQuery(
    async () => (typeof window === 'undefined' ? undefined : getAllSettings()),
    [],
    undefined
  );
  if (!rows) return DEFAULTS;
  return { ...DEFAULTS, ...rows };
}
