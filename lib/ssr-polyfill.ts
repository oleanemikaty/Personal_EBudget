// SSR polyfill: must be imported before dexie or dexie-react-hooks.
// In some server environments the global BroadcastChannel constructor
// exists but throws when instantiated, crashing server-side rendering.
// Dexie uses BroadcastChannel for cross-tab sync, which is unnecessary on the server.
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

export {};
