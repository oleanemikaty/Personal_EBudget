'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { getDBAsync } from '@/lib/db';

/**
 * Custom replacement for dexie-react-hooks' useLiveQuery.
 * Subscribes to Dexie.liveQuery observables manually, avoiding
 * AbortController-related crashes in environments where it's unavailable.
 */
export function useLiveQuery<T>(
  querier: (db: any) => Promise<T | undefined> | T | undefined,
  deps: any[] = [],
  defaultValue?: T
): T | undefined {
  const [result, setResult] = useState<T | undefined>(defaultValue);
  const [error, setError] = useState<Error | null>(null);
  const querierRef = useRef(querier);
  querierRef.current = querier;

  const depKey = useMemo(() => JSON.stringify(deps), [deps]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let unsub: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Dexie } = await import('dexie');
        const db = await getDBAsync();

        const observable = Dexie.liveQuery(() => querierRef.current(db));

        const subscription = observable.subscribe(
          (val: T | undefined) => {
            if (!cancelled) setResult(val as T | undefined);
          },
          (err: Error) => {
            if (!cancelled) setError(err);
          }
        );

        unsub =
          typeof subscription === 'function'
            ? subscription
            : () => subscription.unsubscribe();
      } catch (err: any) {
        if (!cancelled) setError(err);
      }
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  if (error) throw error;
  return result;
}
