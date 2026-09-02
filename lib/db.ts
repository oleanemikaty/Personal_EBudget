import type {
  BudgetMonth,
  BudgetGroup,
  SubBudget,
  Transaction,
  IncomeEntry,
  RecurringIncome,
  IncomeCategory,
  IncomeAccount,
  SavingsGoal,
  Setting,
} from './types';

// Polyfill BroadcastChannel for SSR environments where it's missing or broken.
// Dexie uses BroadcastChannel internally for cross-tab sync, which isn't needed on the server.
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

// Lazy-load Dexie only in the browser to avoid SSR crashes
// (BroadcastChannel is not available on the server)
let _db: any = null;
let _Dexie: any = null;

async function loadDexie() {
  if (!_Dexie) {
    const mod = await import('dexie');
    _Dexie = mod.default;
  }
  return _Dexie;
}

async function getDBAsync() {
  if (typeof window === 'undefined') {
    throw new Error('Database can only be accessed in the browser');
  }
  if (!_db) {
    const Dexie = await loadDexie();
    const db = new Dexie('PersonalBudgetManager', { cache: 'disabled' });
    db.version(1).stores({
      months: 'id, isTemplate',
      groups: 'id, monthId, order',
      subBudgets: 'id, groupId, monthId, order',
      transactions: 'id, monthId, groupId, subBudgetId, date, type',
      incomes: 'id, monthId, date, category',
      goals: 'id',
      settings: 'key',
    });
    db.version(2).stores({
      incomes: 'id, monthId, date, category, source, account, recurringId',
      recurringIncomes: 'id, enabled, dayOfMonth',
      incomeCategories: 'id, name',
      incomeAccounts: 'id, name',
    });
    db.version(3).stores({
      recurringIncomes: 'id, dayOfMonth',
    });
    _db = db;
  }
  return _db;
}

// Synchronous access — only call after getDBAsync has been called at least once
export function getDB(): any {
  if (typeof window === 'undefined') {
    throw new Error('Database can only be accessed in the browser');
  }
  if (!_db) {
    throw new Error('Database not initialized. Call getDBAsync() first.');
  }
  return _db;
}

export { getDBAsync };

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// Re-export types for convenience
export type {
  BudgetMonth,
  BudgetGroup,
  SubBudget,
  Transaction,
  IncomeEntry,
  SavingsGoal,
  Setting,
};
