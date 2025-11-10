import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import type { BudgetEntry } from '../types/budget';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function fmtGBP(n: number) {
  if (!Number.isFinite(n)) return '£0';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
}

export default function BudgetsPage() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['budgets'],
    queryFn: async (): Promise<BudgetEntry[]> => (await api.get('/api/BudgetEntries')).data,
  });

  const remove = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/BudgetEntries/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });

  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (id: number) =>
  setOpen(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });

  const grouped = useMemo(() => {
    const g = new Map<number, BudgetEntry[]>();
    (list.data ?? [])
      .slice()
      .sort((a, b) => b.id - a.id)
      .forEach(e => {
        const arr = g.get(e.month) ?? [];
        arr.push(e);
        g.set(e.month, arr);
      });
    return g;
  }, [list.data]);

  const totals = useMemo(() => {
    const all = list.data ?? [];
    const income = all.reduce((s, e) => s + Number(e.monthly_Income ?? 0), 0);
    const expenses = all.reduce((s, e) => s + Number(e.total_Expenses ?? 0), 0);
    return { income, expenses, spare: income - expenses };
  }, [list.data]);

  return (
    <div className="space-y-6">
      <div className="bb-page-header">
        <h1 className="text-3xl font-bold mb-2">Budgets</h1>
        <p className="text-indigo-100">All saved months with detailed breakdowns</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bb-stat-card">
          <div className="text-slate-600 text-sm font-medium mb-1">Total income</div>
          <div className="text-2xl font-bold text-slate-900">{fmtGBP(totals.income)}</div>
        </div>
        <div className="bb-stat-card">
          <div className="text-slate-600 text-sm font-medium mb-1">Total spending</div>
          <div className="text-2xl font-bold text-slate-900">{fmtGBP(totals.expenses)}</div>
        </div>
        <div className="bb-stat-card">
          <div className="text-slate-600 text-sm font-medium mb-1">Total spare</div>
          <div className={`text-2xl font-bold ${totals.spare < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {fmtGBP(totals.spare)}
          </div>
        </div>
      </div>

      {list.isLoading && <div className="text-center py-12 text-slate-500">Loading budgets…</div>}
      {list.isError && <div className="text-center py-12 text-red-600">Failed to load budgets.</div>}

      {!list.isLoading && !list.isError && (
        [...grouped.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([monthNo, entries]) => (
          <section key={monthNo} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">
                {MONTHS[(monthNo - 1 + 12) % 12]}
              </h2>
              <span className="px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700 font-medium">
                {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
              </span>
            </div>

            <div className="grid gap-4">
              {entries.map(e => {
                const spare = Number(e.monthly_Income ?? 0) - Number(e.total_Expenses ?? 0);
                const isOpen = open.has(e.id);
                return (
                  <div key={e.id} className="bb-card overflow-hidden">
                    <div className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-slate-50 to-white">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-indigo-600">Entry #{e.id}</div>
                        <div className="flex flex-wrap gap-5 text-sm">
                          <span className="flex flex-col">
                            <span className="text-xs text-slate-500">Income</span>
                            <strong className="text-base text-slate-900">{fmtGBP(Number(e.monthly_Income ?? 0))}</strong>
                          </span>
                          <span className="flex flex-col">
                            <span className="text-xs text-slate-500">Expenses</span>
                            <strong className="text-base text-slate-900">{fmtGBP(Number(e.total_Expenses ?? 0))}</strong>
                          </span>
                          <span className="flex flex-col">
                            <span className="text-xs text-slate-500">Spare</span>
                            <strong className={`text-base ${spare < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {fmtGBP(spare)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="px-4 py-2 rounded-lg text-sm font-medium border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                          onClick={() => toggle(e.id)}
                          aria-expanded={isOpen}
                        >
                          {isOpen ? 'Hide details' : 'Show details'}
                        </button>
                        <button
                          className="bb-btn-danger"
                          onClick={async () => {
                            if (!confirm('Delete this budget entry?')) return;
                            await remove.mutateAsync(e.id);
                          }}
                          disabled={remove.isPending}
                        >
                          {remove.isPending ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-2 bg-slate-50/50">
                        <div className="grid md:grid-cols-3 gap-3">
                          <Field label="Rent" v={e.rent} />
                          <Field label="Loan repayment" v={e.loan_Repayment} />
                          <Field label="Insurance" v={e.insurance} />
                          <Field label="Subscriptions" v={e.subscriptions} />
                          <Field label="Groceries" v={e.groceries} />
                          <Field label="Travel" v={e.travel} />
                          <Field label="Going out" v={e.going_Out} />
                          <Field label="Entertainment" v={e.entertainment} />
                          <Field label="Utilities" v={e.utilities} />
                          <Field label="Healthcare" v={e.healthcare} />
                          <Field label="Education" v={e.education} />
                          <Field label="Miscellaneous" v={e.miscellaneous} />
                          <Field label="Savings" v={e.savings} />
                          <Field label="Investments" v={e.investments} />
                          <Field label="Net worth" v={e.net_Worth} />
                          <Field label="Debt balance" v={e.debt} />
                          <Field label="Total liabilities" v={e.total_Liabilities} />
                          <div className="md:col-span-3 p-3 rounded-lg bg-white border border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">Financial goals (note)</div>
                            <div className="text-sm font-medium text-slate-900">{e.financial_Goals || '—'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {!list.isLoading && !list.isError && (list.data?.length ?? 0) === 0 && (
        <div className="bb-card p-12 text-center">
          <svg className="w-20 h-20 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-600">No budget entries yet. Add your first month on the Dashboard.</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, v }: { label: string; v: number | string | null | undefined }) {
  const num = Number(v ?? 0);
  const isNum = Number.isFinite(num);
  return (
    <div className="p-3 rounded-lg bg-white border border-slate-200">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{isNum ? fmtGBP(num) : (v ?? '—')}</div>
    </div>
  );
}
