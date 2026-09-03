import { getDBAsync, uid } from './db';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_INCOME_ACCOUNTS } from './income';
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

const TEMPLATE_ID = 'template';

// ---- Months ----

export async function ensureMonth(
  key: string
): Promise<BudgetMonth> {
  const db = await getDBAsync();
  let month = await db.months.get(key);
  if (!month) {
    month = { id: key, isTemplate: false, createdAt: Date.now() };
    await db.months.put(month);
    await createMonthFromTemplate(key);
  }
  return month;
}

export async function getMonth(key: string): Promise<BudgetMonth | undefined> {
  const db = await getDBAsync();
  return db.months.get(key);
}

export async function listMonths(): Promise<BudgetMonth[]> {
  const db = await getDBAsync();
  const months = await db.months.toArray();
  return months
    .filter((m: BudgetMonth) => !m.isTemplate)
    .sort((a: BudgetMonth, b: BudgetMonth) => a.id.localeCompare(b.id));
}

// ---- Template ----

export async function getTemplate(): Promise<BudgetMonth | undefined> {
  const db = await getDBAsync();
  return db.months.get(TEMPLATE_ID);
}

export async function ensureTemplate(): Promise<BudgetMonth> {
  const db = await getDBAsync();
  let template = await db.months.get(TEMPLATE_ID);
  if (!template) {
    template = { id: TEMPLATE_ID, isTemplate: true, createdAt: Date.now() };
    await db.months.put(template);
  }
  return template;
}

export async function createMonthFromTemplate(monthId: string): Promise<void> {
  const db = await getDBAsync();
  const template = await db.months.get(TEMPLATE_ID);
  if (!template) return;

  await db.transaction(
    'rw',
    db.months,
    db.groups,
    db.subBudgets,
    async () => {
      const now = Date.now();

      await db.months.put({
        id: monthId,
        isTemplate: false,
        createdAt: now,
      });

      const tplGroups = await db.groups
        .where('monthId')
        .equals(TEMPLATE_ID)
        .sortBy('order');

      const tplSubs = await db.subBudgets
        .where('monthId')
        .equals(TEMPLATE_ID)
        .toArray();

      for (const tplGroup of tplGroups) {
        const newGroupId = uid();
        await db.groups.put({
          ...tplGroup,
          id: newGroupId,
          monthId,
          createdAt: now,
        });

        const groupSubs = tplSubs.filter(
          (sub: SubBudget) => sub.groupId === tplGroup.id
        );

        await db.subBudgets.bulkPut(
          groupSubs.map((sub: SubBudget) => ({
            ...sub,
            id: uid(),
            groupId: newGroupId,
            monthId,
            createdAt: now,
          }))
        );
      }
    }
  );
}

export async function createNextMonth(
  currentMonthId: string
): Promise<{ monthId: string; created: boolean }> {
  if (!currentMonthId || currentMonthId === TEMPLATE_ID) {
    throw new Error('Invalid current month');
  }

  const db = await getDBAsync();
  const [year, month] = currentMonthId.split('-').map(Number);
  const nextDate = new Date(year, month, 1);
  const nextMonthId = `${nextDate.getFullYear()}-${String(
    nextDate.getMonth() + 1
  ).padStart(2, '0')}`;

  const existing = await db.months.get(nextMonthId);
  if (existing) {
    return { monthId: nextMonthId, created: false };
  }

  await createMonthFromTemplate(nextMonthId);
  return { monthId: nextMonthId, created: true };
}

export async function saveTemplateToMonth(monthId: string): Promise<void> {
  const db = await getDBAsync();
  await db.groups.where('monthId').equals(monthId).delete();
  await db.subBudgets.where('monthId').equals(monthId).delete();
  await createMonthFromTemplate(monthId);
}

export async function saveMonthAsTemplate(monthId: string): Promise<void> {
  if (!monthId || monthId === TEMPLATE_ID) {
    throw new Error('Invalid source month');
  }

  const db = await getDBAsync();

  // Pre-save snapshot of source month
  const sourceGroupsBefore = await db.groups
    .where('monthId')
    .equals(monthId)
    .toArray();
  const sourceSubsBefore = await db.subBudgets
    .where('monthId')
    .equals(monthId)
    .toArray();

  await db.transaction(
    'rw',
    db.months,
    db.groups,
    db.subBudgets,
    async () => {
      // 1. Validate source month
      const sourceMonth = await db.months.get(monthId);
      if (!sourceMonth || sourceMonth.isTemplate) {
        throw new Error('Invalid source month');
      }

      // 2. READ source groups and sub-budgets (do NOT modify them)
      const sourceGroups = await db.groups
        .where('monthId')
        .equals(monthId)
        .sortBy('order');
      const sourceSubs = await db.subBudgets
        .where('monthId')
        .equals(monthId)
        .toArray();

      // 3. Delete ONLY existing template records
      await db.subBudgets.where('monthId').equals(TEMPLATE_ID).delete();
      await db.groups.where('monthId').equals(TEMPLATE_ID).delete();

      // 4. Create/update template metadata
      const now = Date.now();
      await db.months.put({
        id: TEMPLATE_ID,
        isTemplate: true,
        createdAt: now,
        updatedAt: now,
      });

      // 5. COPY groups into template with new IDs
      for (const sourceGroup of sourceGroups) {
        const templateGroupId = uid();
        await db.groups.put({
          ...sourceGroup,
          id: templateGroupId,
          monthId: TEMPLATE_ID,
          createdAt: now,
        });

        // 6. COPY sub-budgets belonging to this group
        const groupSubs = sourceSubs.filter(
          (sub: SubBudget) => sub.groupId === sourceGroup.id
        );
        await db.subBudgets.bulkPut(
          groupSubs.map((sub: SubBudget) => ({
            ...sub,
            id: uid(),
            groupId: templateGroupId,
            monthId: TEMPLATE_ID,
            createdAt: now,
          }))
        );
      }
    }
  );

  // Post-save verification: source month must be unchanged
  const sourceGroupsAfter = await db.groups
    .where('monthId')
    .equals(monthId)
    .toArray();
  const sourceSubsAfter = await db.subBudgets
    .where('monthId')
    .equals(monthId)
    .toArray();

  if (
    sourceGroupsAfter.length !== sourceGroupsBefore.length ||
    sourceSubsAfter.length !== sourceSubsBefore.length
  ) {
    throw new Error('Saving template changed current month data unexpectedly.');
  }

  const beforeGroupIds = new Set(sourceGroupsBefore.map((g: BudgetGroup) => g.id));
  const afterGroupIds = new Set(sourceGroupsAfter.map((g: BudgetGroup) => g.id));
  const beforeSubIds = new Set(sourceSubsBefore.map((s: SubBudget) => s.id));
  const afterSubIds = new Set(sourceSubsAfter.map((s: SubBudget) => s.id));

  const groupsMatch =
    beforeGroupIds.size === afterGroupIds.size &&
    sourceGroupsBefore.every((g: BudgetGroup) => afterGroupIds.has(g.id));
  const subsMatch =
    beforeSubIds.size === afterSubIds.size &&
    sourceSubsBefore.every((s: SubBudget) => afterSubIds.has(s.id));

  if (!groupsMatch || !subsMatch) {
    throw new Error('Saving template changed current month data unexpectedly.');
  }
}

// ---- Groups ----

export async function listGroups(monthId: string): Promise<BudgetGroup[]> {
  const db = await getDBAsync();
  return db.groups.where('monthId').equals(monthId).sortBy('order');
}

export async function createGroup(
  data: Omit<BudgetGroup, 'id' | 'createdAt'>
): Promise<BudgetGroup> {
  const db = await getDBAsync();
  const group: BudgetGroup = { ...data, id: uid(), createdAt: Date.now() };
  await db.groups.put(group);
  return group;
}

export async function updateGroup(
  id: string,
  changes: Partial<BudgetGroup>
): Promise<void> {
  const db = await getDBAsync();
  await db.groups.update(id, changes);
}

export async function deleteGroup(id: string): Promise<void> {
  const db = await getDBAsync();
  await db.subBudgets.where('groupId').equals(id).delete();
  await db.groups.delete(id);
}

export async function duplicateGroup(
  id: string,
  monthId: string
): Promise<BudgetGroup | null> {
  const db = await getDBAsync();
  const original = await db.groups.get(id);
  if (!original) return null;

  const allGroups = await db.groups.where('monthId').equals(monthId).toArray();
  const newGroup: BudgetGroup = {
    ...original,
    id: uid(),
    name: `${original.name} Copy`,
    order: allGroups.length,
    createdAt: Date.now(),
  };
  await db.groups.put(newGroup);

  const subs = await db.subBudgets.where('groupId').equals(id).sortBy('order');
  for (const sub of subs) {
    await db.subBudgets.put({
      ...sub,
      id: uid(),
      groupId: newGroup.id,
      createdAt: Date.now(),
    });
  }
  return newGroup;
}

export async function reorderGroups(
  monthId: string,
  orderedIds: string[]
): Promise<void> {
  const db = await getDBAsync();
  await db.transaction('rw', db.groups, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.groups.update(orderedIds[i], { order: i });
    }
  });
}

// ---- Sub Budgets ----

export async function listSubBudgets(groupId: string): Promise<SubBudget[]> {
  const db = await getDBAsync();
  return db.subBudgets.where('groupId').equals(groupId).sortBy('order');
}

export async function listSubBudgetsByMonth(
  monthId: string
): Promise<SubBudget[]> {
  const db = await getDBAsync();
  return db.subBudgets.where('monthId').equals(monthId).sortBy('order');
}

export async function createSubBudget(
  data: Omit<SubBudget, 'id' | 'createdAt'>
): Promise<SubBudget> {
  const db = await getDBAsync();
  const sub: SubBudget = { ...data, id: uid(), createdAt: Date.now() };
  await db.subBudgets.put(sub);
  return sub;
}

export async function updateSubBudget(
  id: string,
  changes: Partial<SubBudget>
): Promise<void> {
  const db = await getDBAsync();
  await db.subBudgets.update(id, changes);
}

export async function deleteSubBudget(id: string): Promise<void> {
  const db = await getDBAsync();
  await db.subBudgets.delete(id);
}

export async function duplicateSubBudget(
  id: string
): Promise<SubBudget | null> {
  const db = await getDBAsync();
  const original = await db.subBudgets.get(id);
  if (!original) return null;

  const allSubs = await db.subBudgets
    .where('groupId')
    .equals(original.groupId)
    .toArray();
  const newSub: SubBudget = {
    ...original,
    id: uid(),
    name: `${original.name} Copy`,
    order: allSubs.length,
    createdAt: Date.now(),
  };
  await db.subBudgets.put(newSub);
  return newSub;
}

export async function reorderSubBudgets(
  groupId: string,
  orderedIds: string[]
): Promise<void> {
  const db = await getDBAsync();
  await db.transaction('rw', db.subBudgets, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.subBudgets.update(orderedIds[i], { order: i });
    }
  });
}

// ---- Transactions ----

export async function listTransactions(
  monthId: string
): Promise<Transaction[]> {
  const db = await getDBAsync();
  return db.transactions.where('monthId').equals(monthId).toArray();
}

export async function createTransaction(
  data: Omit<Transaction, 'id' | 'createdAt'>
): Promise<Transaction> {
  const db = await getDBAsync();
  const txn: Transaction = { ...data, id: uid(), createdAt: Date.now() };
  await db.transactions.put(txn);
  return txn;
}

export async function updateTransaction(
  id: string,
  changes: Partial<Transaction>
): Promise<void> {
  const db = await getDBAsync();
  await db.transactions.update(id, changes);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDBAsync();
  await db.transactions.delete(id);
}

export async function getTransactionsByDate(
  date: string
): Promise<Transaction[]> {
  const db = await getDBAsync();
  return db.transactions.where('date').equals(date).toArray();
}

// ---- Income ----

export async function listIncomes(monthId: string): Promise<IncomeEntry[]> {
  const db = await getDBAsync();
  return db.incomes.where('monthId').equals(monthId).toArray();
}

export async function createIncome(
  data: Omit<IncomeEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<IncomeEntry> {
  const db = await getDBAsync();
  const now = Date.now();
  const income: IncomeEntry = { ...data, id: uid(), createdAt: now, updatedAt: now };
  await db.incomes.put(income);
  return income;
}

export async function updateIncome(
  id: string,
  changes: Partial<IncomeEntry>
): Promise<void> {
  const db = await getDBAsync();
  await db.incomes.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteIncome(id: string): Promise<void> {
  const db = await getDBAsync();
  await db.incomes.delete(id);
}

// ---- Recurring Incomes ----

export async function listRecurringIncomes(): Promise<RecurringIncome[]> {
  const db = await getDBAsync();
  return db.recurringIncomes.toArray();
}

export async function createRecurringIncome(
  data: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt'>
): Promise<RecurringIncome> {
  const db = await getDBAsync();
  const now = Date.now();
  const recurring: RecurringIncome = { ...data, id: uid(), createdAt: now, updatedAt: now };
  await db.recurringIncomes.put(recurring);
  return recurring;
}

export async function updateRecurringIncome(
  id: string,
  changes: Partial<RecurringIncome>
): Promise<void> {
  const db = await getDBAsync();
  await db.recurringIncomes.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteRecurringIncome(id: string): Promise<void> {
  const db = await getDBAsync();
  await db.recurringIncomes.delete(id);
}

export async function processRecurringIncomes(monthId: string): Promise<void> {
  const db = await getDBAsync();
  const allRecurring = await db.recurringIncomes.toArray();
  const enabled = allRecurring.filter((r: RecurringIncome) => r.enabled);
  for (const r of enabled) {
    if (r.lastGeneratedMonth === monthId) continue;
    const [yr, mo] = monthId.split('-').map(Number);
    const day = Math.min(r.dayOfMonth, 28);
    const date = `${monthId}-${String(day).padStart(2, '0')}`;
    const existing = await db.incomes
      .where('recurringId')
      .equals(r.id)
      .toArray();
    const alreadyThisMonth = existing.some(
      (e: IncomeEntry) => e.monthId === monthId
    );
    if (alreadyThisMonth) {
      await db.recurringIncomes.update(r.id, { lastGeneratedMonth: monthId });
      continue;
    }
    const now = Date.now();
    const income: IncomeEntry = {
      id: uid(),
      monthId,
      date,
      amount: r.amount,
      source: r.source,
      category: r.category,
      account: r.account,
      notes: `Auto-generated from recurring: ${r.name}`,
      recurringId: r.id,
      createdAt: now,
      updatedAt: now,
    };
    await db.incomes.put(income);
    await db.recurringIncomes.update(r.id, { lastGeneratedMonth: monthId });
  }
}

// ---- Income Categories ----

export async function listIncomeCategories(): Promise<IncomeCategory[]> {
  const db = await getDBAsync();
  const existing = await db.incomeCategories.count();
  if (existing === 0) {
    const now = Date.now();
    const defaults = DEFAULT_INCOME_CATEGORIES.map((c) => ({
      ...c,
      id: uid(),
      createdAt: now,
    }));
    await db.incomeCategories.bulkPut(defaults);
    return defaults;
  }
  return db.incomeCategories.toArray();
}

export async function createIncomeCategory(
  data: Omit<IncomeCategory, 'id' | 'createdAt'>
): Promise<IncomeCategory> {
  const db = await getDBAsync();
  const cat: IncomeCategory = { ...data, id: uid(), createdAt: Date.now() };
  await db.incomeCategories.put(cat);
  return cat;
}

export async function updateIncomeCategory(
  id: string,
  changes: Partial<IncomeCategory>
): Promise<void> {
  const db = await getDBAsync();
  await db.incomeCategories.update(id, changes);
}

export async function deleteIncomeCategory(id: string): Promise<void> {
  const db = await getDBAsync();
  await db.incomeCategories.delete(id);
}

// ---- Income Accounts ----

export async function listIncomeAccounts(): Promise<IncomeAccount[]> {
  const db = await getDBAsync();
  const existing = await db.incomeAccounts.count();
  if (existing === 0) {
    const now = Date.now();
    const defaults = DEFAULT_INCOME_ACCOUNTS.map((a) => ({
      ...a,
      id: uid(),
      createdAt: now,
    }));
    await db.incomeAccounts.bulkPut(defaults);
    return defaults;
  }
  return db.incomeAccounts.toArray();
}

export async function createIncomeAccount(
  data: Omit<IncomeAccount, 'id' | 'createdAt'>
): Promise<IncomeAccount> {
  const db = await getDBAsync();
  const acct: IncomeAccount = { ...data, id: uid(), createdAt: Date.now() };
  await db.incomeAccounts.put(acct);
  return acct;
}

export async function updateIncomeAccount(
  id: string,
  changes: Partial<IncomeAccount>
): Promise<void> {
  const db = await getDBAsync();
  await db.incomeAccounts.update(id, changes);
}

export async function deleteIncomeAccount(id: string): Promise<void> {
  const db = await getDBAsync();
  await db.incomeAccounts.delete(id);
}

// ---- Savings Goals ----

export async function listGoals(): Promise<SavingsGoal[]> {
  const db = await getDBAsync();
  return db.goals.toArray();
}

export async function createGoal(
  data: Omit<SavingsGoal, 'id' | 'createdAt'>
): Promise<SavingsGoal> {
  const db = await getDBAsync();
  const goal: SavingsGoal = { ...data, id: uid(), createdAt: Date.now() };
  await db.goals.put(goal);
  return goal;
}

export async function updateGoal(
  id: string,
  changes: Partial<SavingsGoal>
): Promise<void> {
  const db = await getDBAsync();
  await db.goals.update(id, changes);
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDBAsync();
  await db.goals.delete(id);
}

// ---- Settings ----

export async function getSetting(key: string): Promise<string | undefined> {
  const db = await getDBAsync();
  const row = await db.settings.get(key);
  return row?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDBAsync();
  const setting: Setting = { key, value };
  await db.settings.put(setting);
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDBAsync();
  const rows = await db.settings.toArray();
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

// ---- Export / Import ----

export async function exportAllData(): Promise<string> {
  const db = await getDBAsync();
  const [months, groups, subBudgets, transactions, incomes, goals, settings] =
    await Promise.all([
      db.months.toArray(),
      db.groups.toArray(),
      db.subBudgets.toArray(),
      db.transactions.toArray(),
      db.incomes.toArray(),
      db.goals.toArray(),
      db.settings.toArray(),
    ]);
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      months,
      groups,
      subBudgets,
      transactions,
      incomes,
      goals,
      settings,
    },
    null,
    2
  );
}

export async function importData(json: string): Promise<void> {
  const db = await getDBAsync();
  const data = JSON.parse(json);
  await db.transaction(
    'rw',
    [db.months, db.groups, db.subBudgets, db.transactions, db.incomes, db.goals, db.settings],
    async () => {
      await Promise.all([
        db.months.clear(),
        db.groups.clear(),
        db.subBudgets.clear(),
        db.transactions.clear(),
        db.incomes.clear(),
        db.goals.clear(),
        db.settings.clear(),
      ]);
      if (data.months) await db.months.bulkPut(data.months);
      if (data.groups) await db.groups.bulkPut(data.groups);
      if (data.subBudgets) await db.subBudgets.bulkPut(data.subBudgets);
      if (data.transactions) await db.transactions.bulkPut(data.transactions);
      if (data.incomes) await db.incomes.bulkPut(data.incomes);
      if (data.goals) await db.goals.bulkPut(data.goals);
      if (data.settings) await db.settings.bulkPut(data.settings);
    }
  );
}

// ---- Seed ----

export async function seedSampleData(): Promise<void> {
  const db = await getDBAsync();
  const existing = await db.months.count();
  if (existing > 0) return;

  await ensureTemplate();

  const tplGroups = [
    { name: 'Home Bills', icon: '🏠', color: 'blue' },
    { name: 'Kitchen', icon: '🍳', color: 'emerald' },
    { name: 'Transportation', icon: '🚗', color: 'amber' },
    { name: 'Lifestyle', icon: '🎮', color: 'rose' },
    { name: 'Savings', icon: '💰', color: 'cyan' },
  ];

  const tplSubs: Record<string, { name: string; icon: string; budget: number }[]> = {
    'Home Bills': [
      { name: 'Electricity', icon: '💡', budget: 120 },
      { name: 'Water', icon: '🚿', budget: 40 },
      { name: 'Internet', icon: '📶', budget: 60 },
      { name: 'Rent', icon: '🏠', budget: 1500 },
    ],
    Kitchen: [
      { name: 'Groceries', icon: '🛒', budget: 400 },
      { name: 'Dining Out', icon: '🍽️', budget: 200 },
      { name: 'Drinks', icon: '🥤', budget: 80 },
    ],
    Transportation: [
      { name: 'Fuel', icon: '⛽', budget: 200 },
      { name: 'Parking', icon: '🅿️', budget: 50 },
      { name: 'Ride Share', icon: '🚕', budget: 100 },
    ],
    Lifestyle: [
      { name: 'Coffee', icon: '☕', budget: 80 },
      { name: 'Cinema', icon: '🎬', budget: 60 },
      { name: 'Subscriptions', icon: '📺', budget: 45 },
    ],
    Savings: [
      { name: 'Emergency Fund', icon: '🚨', budget: 500 },
    ],
  };

  for (let i = 0; i < tplGroups.length; i++) {
    const g = tplGroups[i];
    const group = await createGroup({
      monthId: TEMPLATE_ID,
      name: g.name,
      icon: g.icon,
      color: g.color,
      order: i,
    });
    const subs = tplSubs[g.name] || [];
    for (let j = 0; j < subs.length; j++) {
      const s = subs[j];
      await createSubBudget({
        groupId: group.id,
        monthId: TEMPLATE_ID,
        name: s.name,
        icon: s.icon,
        order: j,
        budget: s.budget,
      });
    }
  }

  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  await ensureMonth(key);

  await createGoal({
    name: 'Emergency Fund',
    icon: '🚨',
    color: 'rose',
    targetAmount: 10000,
    currentAmount: 3200,
  });
  await createGoal({
    name: 'Vacation',
    icon: '🏖️',
    color: 'cyan',
    targetAmount: 3000,
    currentAmount: 850,
    targetDate: `${now.getFullYear()}-12-15`,
  });

  await setSetting('currency', 'IDR');
  await setSetting('theme', 'system');
}
