import type { BudgetEntry } from '../types/budget';

// Pick only numeric keys from BudgetEntry
type NumericKey = {
  [K in keyof BudgetEntry]-?: BudgetEntry[K] extends number ? K : never
}[keyof BudgetEntry];

// MoneyHelper-inspired groups mapped to your fields
export const GROUPS: Record<string, NumericKey[]> = {
  'Household bills': ['rent', 'utilities', 'insurance', 'subscriptions'],
  'Living costs': ['groceries', 'healthcare', 'education', 'miscellaneous'],
  'Transport & travel': ['travel'],
  'Leisure & lifestyle': ['going_Out', 'entertainment', 'subscriptions'],
  'Debt & finance': ['loan_Repayment'],
  // If you want to include savings in the chart:
  // 'Savings & investments': ['savings', 'investments'],
};

function sumKeys(entry: BudgetEntry, keys: NumericKey[]): number {
  return keys.reduce((acc, k) => acc + (entry[k] ?? 0), 0);
}

export function groupTotals(entry: BudgetEntry) {
  const groups = Object.entries(GROUPS).map(([name, cols]) => ({
    name,
    amount: sumKeys(entry, cols),
  }));

  const groupsMerged = mergeDuplicates(groups);
  const totalExpenses = entry.total_Expenses ?? 0;

  return { groups: groupsMerged, totalExpenses };
}

function mergeDuplicates(arr: Array<{ name: string; amount: number }>) {
  const map = new Map<string, number>();
  for (const { name, amount } of arr) {
    map.set(name, (map.get(name) ?? 0) + amount);
  }
  return Array.from(map, ([name, amount]) => ({ name, amount }));
}
