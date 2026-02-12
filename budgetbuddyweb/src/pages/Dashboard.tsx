import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { useRegion } from '../contexts/useRegion';
import logo from '../assets/budgetbuddy-logo.png';

type BudgetEntry = {
  id: number;
  userId: number;
  month: number;
  monthly_Income: number;
  rent: number;
  loan_Repayment: number;
  insurance: number;
  subscriptions: number;
  groceries: number;
  travel: number;
  going_Out: number;
  entertainment: number;
  utilities: number;
  healthcare: number;
  education: number;
  miscellaneous: number;
  total_Expenses: number;
  monthly_Savings: number;
  investments?: number;
  debt?: number;
  liabilities?: number;
  net_Worth?: number;
};

function fmtGBP(n: number | undefined) {
  const v = Number(n ?? 0);
  return v.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const qc = useQueryClient();
  const { region } = useRegion();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    monthly_Income: '',
    rent: '',
    loan_Repayment: '',
    insurance: '',
    subscriptions: '',
    groceries: '',
    travel: '',
    going_Out: '',
    entertainment: '',
    utilities: '',
    healthcare: '',
    education: '',
    miscellaneous: '',
    investments: '',
    debt: '',
    liabilities: '',
  });

  const budgets = useQuery({
    queryKey: ['budgets'],
    queryFn: async (): Promise<BudgetEntry[]> => (await api.get('/api/BudgetEntries')).data,
  });

  // Get previous month's data for carry-forward
  const getPreviousMonthData = (currentMonth: number): BudgetEntry | null => {
    if (!budgets.data || budgets.data.length === 0) return null;
    
    return budgets.data
      .filter(entry => entry.month < currentMonth)
      .sort((a, b) => b.month - a.month)[0] || null;
  };

  // Calculate total expenses from form
  const calculateTotalExpenses = () => {
    return (
      parseFloat(form.rent || '0') +
      parseFloat(form.loan_Repayment || '0') +
      parseFloat(form.insurance || '0') +
      parseFloat(form.subscriptions || '0') +
      parseFloat(form.groceries || '0') +
      parseFloat(form.travel || '0') +
      parseFloat(form.going_Out || '0') +
      parseFloat(form.entertainment || '0') +
      parseFloat(form.utilities || '0') +
      parseFloat(form.healthcare || '0') +
      parseFloat(form.education || '0') +
      parseFloat(form.miscellaneous || '0')
    );
  };

  // Calculate monthly savings
  const calculateMonthlySavings = () => {
    return parseFloat(form.monthly_Income || '0') - calculateTotalExpenses();
  };

  const saveBudget = useMutation({
    mutationFn: async (data: Partial<BudgetEntry>) => {
      if (editingId) {
        return (await api.put(`/api/BudgetEntries/${editingId}`, data)).data;
      } else {
        return (await api.post('/api/BudgetEntries', data)).data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      resetForm();
      setIsModalOpen(false);
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/BudgetEntries/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!form.monthly_Income || parseFloat(form.monthly_Income) <= 0) {
      alert('Please enter a valid monthly income');
      return;
    }

    const previousMonth = getPreviousMonthData(form.month);
    const totalExpenses = calculateTotalExpenses();
    const monthlySavings = calculateMonthlySavings();

    // Auto-calculate debt (previous debt - loan repayment)
    const calculatedDebt = form.debt 
      ? parseFloat(form.debt)
      : previousMonth?.debt 
        ? Math.max(0, previousMonth.debt - parseFloat(form.loan_Repayment || '0'))
        : 0;

    // Carry forward investments and liabilities
    const investments = form.investments 
      ? parseFloat(form.investments) 
      : previousMonth?.investments || 0;
    
    const liabilities = form.liabilities 
      ? parseFloat(form.liabilities) 
      : previousMonth?.liabilities || 0;

    // Calculate net worth
    const netWorth = (monthlySavings + investments) - (calculatedDebt + liabilities);

    const payload = {
      month: form.month,
      monthly_Income: parseFloat(form.monthly_Income),
      rent: parseFloat(form.rent || '0'),
      loan_Repayment: parseFloat(form.loan_Repayment || '0'),
      insurance: parseFloat(form.insurance || '0'),
      subscriptions: parseFloat(form.subscriptions || '0'),
      groceries: parseFloat(form.groceries || '0'),
      travel: parseFloat(form.travel || '0'),
      going_Out: parseFloat(form.going_Out || '0'),
      entertainment: parseFloat(form.entertainment || '0'),
      utilities: parseFloat(form.utilities || '0'),
      healthcare: parseFloat(form.healthcare || '0'),
      education: parseFloat(form.education || '0'),
      miscellaneous: parseFloat(form.miscellaneous || '0'),
      total_Expenses: totalExpenses,
      monthly_Savings: monthlySavings,
      Savings: monthlySavings,
      investments: investments,
      debt: calculatedDebt,
      Total_Liabilities: liabilities,
      net_Worth: netWorth,
      Financial_Goals: "",
      Region: region,
    };

    saveBudget.mutate(payload);
  };

  const resetForm = () => {
    setForm({
      month: new Date().getMonth() + 1,
      monthly_Income: '',
      rent: '',
      loan_Repayment: '',
      insurance: '',
      subscriptions: '',
      groceries: '',
      travel: '',
      going_Out: '',
      entertainment: '',
      utilities: '',
      healthcare: '',
      education: '',
      miscellaneous: '',
      investments: '',
      debt: '',
      liabilities: '',
    });
    setEditingId(null);
  };

  const openEditModal = (budget: BudgetEntry) => {
    setForm({
      month: budget.month,
      monthly_Income: String(budget.monthly_Income),
      rent: String(budget.rent),
      loan_Repayment: String(budget.loan_Repayment),
      insurance: String(budget.insurance),
      subscriptions: String(budget.subscriptions),
      groceries: String(budget.groceries),
      travel: String(budget.travel),
      going_Out: String(budget.going_Out),
      entertainment: String(budget.entertainment),
      utilities: String(budget.utilities),
      healthcare: String(budget.healthcare),
      education: String(budget.education),
      miscellaneous: String(budget.miscellaneous),
      investments: budget.investments ? String(budget.investments) : '',
      debt: budget.debt ? String(budget.debt) : '',
      liabilities: budget.liabilities ? String(budget.liabilities) : '',
    });
    setEditingId(budget.id);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    resetForm();
    
    // Pre-fill with previous month's carry-forward data
    const previousMonth = getPreviousMonthData(form.month);
    if (previousMonth) {
      setForm(prev => ({
        ...prev,
        investments: previousMonth.investments ? String(previousMonth.investments) : '',
        debt: previousMonth.debt ? String(Math.max(0, previousMonth.debt - parseFloat(prev.loan_Repayment || '0'))) : '',
        liabilities: previousMonth.liabilities ? String(previousMonth.liabilities) : '',
      }));
    }
    
    setIsModalOpen(true);
  };

  // Summary calculations
  const totalIncome = useMemo(() => 
    budgets.data?.reduce((sum, b) => sum + b.monthly_Income, 0) || 0, 
    [budgets.data]
  );
  
  const totalExpenses = useMemo(() => 
    budgets.data?.reduce((sum, b) => sum + b.total_Expenses, 0) || 0, 
    [budgets.data]
  );
  
  const totalSavings = useMemo(() => 
    budgets.data?.reduce((sum, b) => sum + b.monthly_Savings, 0) || 0, 
    [budgets.data]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="bb-page-title mb-2">📊 Budget Dashboard</h1>
            <p className="text-slate-600">Track your monthly income and expenses</p>
          </div>
          <button onClick={openNewModal} className="bb-btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Budget Month
          </button>
        </div>

        {/* Welcome/Info Banner */}
        <div className="bb-card overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white relative">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center p-2">
                  <img src={logo} alt="BudgetBuddy Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Welcome to BudgetBuddy</h2>
                  <p className="text-indigo-100 text-lg">Your AI-Powered Personal Finance Manager</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg">Smart Tracking</h3>
                  </div>
                  <p className="text-sm text-indigo-100 leading-relaxed">
                    Track income, expenses, and savings with automatic calculations. No manual math needed!
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg">AI Assistant</h3>
                  </div>
                  <p className="text-sm text-indigo-100 leading-relaxed">
                    Get personalized financial advice from our AI chatbot. Ask anything about budgeting!
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg">Goal Planning</h3>
                  </div>
                  <p className="text-sm text-indigo-100 leading-relaxed">
                    Set financial goals and track your progress. Get ML predictions for smarter planning.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Quick Actions</h3>
                <p className="text-sm text-slate-600">Get started with these popular features</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.location.href = '/goals'}
                  className="bb-btn-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Set Goals
                </button>
                <button 
                  onClick={() => window.location.href = '/ai'}
                  className="bb-btn-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Ask AI
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bb-stat-card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="bb-stat-label text-green-100">Total Income</div>
            <div className="bb-stat-value">{fmtGBP(totalIncome)}</div>
            <div className="text-sm text-green-100 mt-2">Across all months</div>
          </div>
          <div className="bb-stat-card bg-gradient-to-br from-red-500 to-pink-600 text-white">
            <div className="bb-stat-label text-red-100">Total Expenses</div>
            <div className="bb-stat-value">{fmtGBP(totalExpenses)}</div>
            <div className="text-sm text-red-100 mt-2">All tracked spending</div>
          </div>
          <div className="bb-stat-card bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <div className="bb-stat-label text-indigo-100">Total Savings</div>
            <div className="bb-stat-value">{fmtGBP(totalSavings)}</div>
            <div className="text-sm text-indigo-100 mt-2">Money saved</div>
          </div>
        </div>

        {/* Budget Entries Table */}
        <div className="bb-card p-6">
          <h2 className="bb-section-title mb-6">Recent Budget Entries</h2>
          
          {budgets.isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading budgets...</p>
            </div>
          ) : !budgets.data || budgets.data.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Budget Data Yet</h3>
              <p className="text-slate-600 mb-6">Start tracking your finances by adding your first budget month.</p>
              <button onClick={openNewModal} className="bb-btn-primary">
                Add Your First Month
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left p-3 font-semibold text-slate-700">Month</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Income</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Expenses</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Savings</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Net Worth</th>
                    <th className="text-center p-3 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.data.sort((a, b) => b.month - a.month).slice(0, 6).map((budget) => (
                    <tr key={budget.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-3">
                        <span className="font-medium text-slate-900">
                          {monthNames[budget.month - 1] || `Month ${budget.month}`}
                        </span>
                      </td>
                      <td className="p-3 text-right text-green-700 font-semibold">
                        {fmtGBP(budget.monthly_Income)}
                      </td>
                      <td className="p-3 text-right text-red-700 font-semibold">
                        {fmtGBP(budget.total_Expenses)}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`font-bold ${budget.monthly_Savings >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {fmtGBP(budget.monthly_Savings)}
                        </span>
                      </td>
                      <td className="p-3 text-right text-indigo-700 font-semibold">
                        {fmtGBP(budget.net_Worth || 0)}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(budget)}
                            className="p-2 hover:bg-indigo-100 rounded-lg transition text-indigo-600"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete budget for ${monthNames[budget.month - 1]}?`)) {
                                deleteBudget.mutate(budget.id);
                              }
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {budgets.data.length > 6 && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => window.location.href = '/budgets'}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-2 mx-auto"
                  >
                    View all {budgets.data.length} entries
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingId ? '✏️ Edit Budget' : '➕ Add New Budget'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Month and Income */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="bb-label">Month *</label>
                    <select
                      name="month"
                      value={form.month}
                      onChange={handleChange}
                      className="bb-input"
                      required
                    >
                      {monthNames.map((name, idx) => (
                        <option key={idx} value={idx + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="bb-label">Monthly Income * (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="monthly_Income"
                      value={form.monthly_Income}
                      onChange={handleChange}
                      className="bb-input"
                      placeholder="3000.00"
                      required
                    />
                  </div>
                </div>

                {/* Essential Expenses */}
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Essential Expenses
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="bb-label">Rent / Mortgage (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="rent"
                        value={form.rent}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="1200.00"
                      />
                    </div>
                    <div>
                      <label className="bb-label">Loan Repayment (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="loan_Repayment"
                        value={form.loan_Repayment}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="150.00"
                      />
                    </div>
                    <div>
                      <label className="bb-label">Insurance (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="insurance"
                        value={form.insurance}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="80.00"
                      />
                    </div>
                    <div>
                      <label className="bb-label">Utilities (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="utilities"
                        value={form.utilities}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="120.00"
                      />
                    </div>
                    <div>
                      <label className="bb-label">Healthcare (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="healthcare"
                        value={form.healthcare}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="50.00"
                      />
                    </div>
                    <div>
                      <label className="bb-label">Groceries (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="groceries"
                        value={form.groceries}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="300.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Discretionary Expenses */}
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Discretionary Spending
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="bb-label">Subscriptions (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="subscriptions"
                        value={form.subscriptions}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="45.00"
                      />
                    </div>
                    <div>
                      <label className="bb-label">Travel / Transport (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="travel"
                        value={form.travel}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="100.00"
                      />
                    </div>
                    <div>
                      <label className="bb-label">Going Out (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="going_Out"
                        value={form.going_Out}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="150.00"
                      />
                    </div>
                    <div>
                      <label className="bb-label">Entertainment (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="entertainment"
                        value={form.entertainment}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="80.00"
                      />
                    </div>
                    <div>
                      <label className="bb-label">Education (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="education"
                        value={form.education}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="50.00"
                      />
                    </div>
                    <div>
                      <label className="bb-label">Miscellaneous (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="miscellaneous"
                        value={form.miscellaneous}
                        onChange={handleChange}
                        className="bb-input"
                        placeholder="75.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto-Calculated Summary */}
                <div className="bb-card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                  <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Auto-Calculated This Month
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <span className="text-sm text-slate-600">Total Expenses</span>
                      <p className="text-xl font-bold text-red-700">
                        {fmtGBP(calculateTotalExpenses())}
                      </p>
                      <span className="text-xs text-slate-500">Sum of all expenses</span>
                    </div>
                    
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <span className="text-sm text-slate-600">Monthly Savings</span>
                      <p className={`text-xl font-bold ${calculateMonthlySavings() >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {fmtGBP(calculateMonthlySavings())}
                      </p>
                      <span className="text-xs text-slate-500">Income - Expenses</span>
                    </div>
                  </div>
                </div>

                {/* Advanced Fields (Collapsible) */}
                <details className="bb-card p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                  <summary className="font-bold text-blue-900 cursor-pointer flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Advanced Fields (Optional)
                    <span className="text-xs font-normal text-blue-600 ml-auto">
                      Auto-carried forward from previous month
                    </span>
                  </summary>
                  
                  {(() => {
                    const previousMonth = getPreviousMonthData(form.month);
                    
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className="bb-label">
                              Investments (£)
                              {previousMonth && (
                                <span className="text-xs text-blue-600 ml-2">
                                  Last: {fmtGBP(previousMonth.investments || 0)}
                                </span>
                              )}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              name="investments"
                              value={form.investments}
                              onChange={handleChange}
                              placeholder={previousMonth ? fmtGBP(previousMonth.investments || 0) : '0.00'}
                              className="bb-input"
                            />
                            <span className="text-xs text-slate-500 mt-1 block">Only update if changed</span>
                          </div>
                          
                          <div>
                            <label className="bb-label">
                              Total Debt (£)
                              {previousMonth && (
                                <span className="text-xs text-blue-600 ml-2">
                                  Last: {fmtGBP(previousMonth.debt || 0)}
                                </span>
                              )}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              name="debt"
                              value={form.debt || (previousMonth?.debt ? String(Math.max(0, previousMonth.debt - parseFloat(form.loan_Repayment || '0'))) : '')}
                              onChange={handleChange}
                              placeholder="Auto-decreases with payments"
                              className="bb-input"
                            />
                            <span className="text-xs text-slate-500 mt-1 block">Decreases automatically by loan payment</span>
                          </div>
                          
                          <div>
                            <label className="bb-label">
                              Liabilities (£)
                              {previousMonth && (
                                <span className="text-xs text-blue-600 ml-2">
                                  Last: {fmtGBP(previousMonth.liabilities || 0)}
                                </span>
                              )}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              name="liabilities"
                              value={form.liabilities}
                              onChange={handleChange}
                              placeholder={previousMonth ? fmtGBP(previousMonth.liabilities || 0) : '0.00'}
                              className="bb-input"
                            />
                            <span className="text-xs text-slate-500 mt-1 block">Only update if changed</span>
                          </div>
                        </div>

                        {/* Net Worth Display */}
                        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                          <span className="text-sm text-slate-600">Calculated Net Worth</span>
                          <p className="text-2xl font-bold text-blue-700">
                            {fmtGBP(
                              (calculateMonthlySavings() + 
                               parseFloat(form.investments || previousMonth?.investments?.toString() || '0')) -
                              (parseFloat(form.debt || (previousMonth?.debt ? String(Math.max(0, previousMonth.debt - parseFloat(form.loan_Repayment || '0'))) : '0')) +
                               parseFloat(form.liabilities || previousMonth?.liabilities?.toString() || '0'))
                            )}
                          </p>
                          <span className="text-xs text-slate-500">(Savings + Investments) - (Debt + Liabilities)</span>
                        </div>
                      </>
                    );
                  })()}
                </details>

                {/* Form Actions */}
                <div className="flex gap-4 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="flex-1 bb-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveBudget.isPending}
                    className="flex-1 bb-btn-primary disabled:opacity-50"
                  >
                    {saveBudget.isPending ? 'Saving...' : editingId ? 'Update Budget' : 'Add Budget'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}