import { api } from './axios';
import type { BudgetEntry, BudgetEntryDto } from '../types/budget';

export async function getBudgets(): Promise<BudgetEntry[]> {
  const { data } = await api.get('/api/BudgetEntries');
  return data;
}
export async function createBudget(dto: BudgetEntryDto): Promise<BudgetEntry> {
  const { data } = await api.post('/api/BudgetEntries', dto);
  return data;
}
export async function deleteBudget(id: number) {
  await api.delete(`/api/BudgetEntries/${id}`);
}
