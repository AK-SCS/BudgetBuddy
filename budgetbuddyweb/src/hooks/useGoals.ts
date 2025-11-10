import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGoal, deleteGoal, getGoals } from '../api/goals';
import type { FinancialGoalDto } from '../types/goals';

export function useGoals() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['goals'], queryFn: getGoals });
  const create = useMutation({
    mutationFn: (dto: FinancialGoalDto) => createGoal(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
  return { list, create, remove };
}
