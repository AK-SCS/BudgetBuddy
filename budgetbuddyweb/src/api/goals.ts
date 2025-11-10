import { api } from './axios';
import type { FinancialGoal, FinancialGoalDto } from '../types/goals';

export async function getGoals(): Promise<FinancialGoal[]> {
  const { data } = await api.get('/api/FinancialGoals');
  return data;
}
export async function createGoal(dto: FinancialGoalDto): Promise<FinancialGoal> {
  const { data } = await api.post('/api/FinancialGoals', dto);
  return data;
}
export async function deleteGoal(id: number) {
  await api.delete(`/api/FinancialGoals/${id}`);
}
