// src/hooks/useBudgets.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import type { BudgetEntry, BudgetEntryDto } from '../types/budget';

export function useBudgets() {
  const qc = useQueryClient();

  // GET /api/BudgetEntries
  const list = useQuery({
    queryKey: ['budgets'],
    queryFn: async (): Promise<BudgetEntry[]> => {
      const { data } = await api.get('/api/BudgetEntries');
      return data;
    },
  });

  // POST /api/BudgetEntries
  const create = useMutation({
    mutationFn: async (dto: BudgetEntryDto) => {
      const { data } = await api.post('/api/BudgetEntries', dto);
      return data as BudgetEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  // PUT /api/BudgetEntries/{id} (optional, handy later)
  const update = useMutation({
    mutationFn: async (payload: { id: number; dto: BudgetEntryDto }) => {
      const { id, dto } = payload;
      await api.put(`/api/BudgetEntries/${id}`, dto);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  // DELETE /api/BudgetEntries/{id}
  const remove = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/BudgetEntries/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  return { list, create, update, remove };
}
