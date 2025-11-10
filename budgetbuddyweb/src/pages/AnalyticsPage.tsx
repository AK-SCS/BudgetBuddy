import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type BudgetEntry = {
  id: number;
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
  debt: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D', '#C084FC', '#34D399', '#F472B6', '#FB923C'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtGBP(n: number) {
  return n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

export default function AnalyticsPage() {
  const budgets = useQuery({
    queryKey: ['budgets'],
    queryFn: async (): Promise<BudgetEntry[]> => (await api.get('/api/BudgetEntries')).data,
  });

  if (budgets.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!budgets.data || budgets.data.length === 0) {
    return (
      <div className="bb-card p-12 text-center">
        <svg className="w-20 h-20 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Data Available</h2>
        <p className="text-slate-600 mb-6">Add budget entries on the Dashboard to see your analytics.</p>
        <a href="/dashboard" className="bb-btn bb-btn-primary">Go to Dashboard</a>
      </div>
    );
  }

  // Prepare data for charts
  const sortedBudgets = [...budgets.data].sort((a, b) => a.month - b.month);
  
  // Income vs Expenses Trend
  const trendData = sortedBudgets.map(b => ({
    month: MONTHS[b.month - 1],
    income: b.monthly_Income,
    expenses: b.total_Expenses,
    savings: b.monthly_Savings,
  }));

  // Latest month expense breakdown
  const latest = sortedBudgets[sortedBudgets.length - 1];
  const expenseBreakdown = [
    { name: 'Rent', value: latest.rent },
    { name: 'Loan Repayment', value: latest.loan_Repayment },
    { name: 'Insurance', value: latest.insurance },
    { name: 'Subscriptions', value: latest.subscriptions },
    { name: 'Groceries', value: latest.groceries },
    { name: 'Travel', value: latest.travel },
    { name: 'Going Out', value: latest.going_Out },
    { name: 'Entertainment', value: latest.entertainment },
    { name: 'Utilities', value: latest.utilities },
    { name: 'Healthcare', value: latest.healthcare },
    { name: 'Education', value: latest.education },
    { name: 'Miscellaneous', value: latest.miscellaneous },
  ].filter(item => item.value > 0);

  // Monthly comparison
  const monthlyComparison = sortedBudgets.map(b => ({
    month: MONTHS[b.month - 1],
    total: b.total_Expenses,
  }));

  // Calculate summary stats
  const totalIncome = sortedBudgets.reduce((sum, b) => sum + b.monthly_Income, 0);
  const totalExpenses = sortedBudgets.reduce((sum, b) => sum + b.total_Expenses, 0);
  const totalSavings = sortedBudgets.reduce((sum, b) => sum + b.monthly_Savings, 0);
  const avgMonthlyExpense = totalExpenses / sortedBudgets.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bb-card p-6">
        <h1 className="bb-page-title mb-2">📊 Financial Analytics</h1>
        <p className="text-slate-600 text-sm">
          Visualize your spending patterns and financial trends over time.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bb-stat-card">
          <div className="bb-stat-label">Total Income</div>
          <div className="bb-stat-value text-green-600">{fmtGBP(totalIncome)}</div>
          <div className="text-xs text-slate-500 mt-1">{sortedBudgets.length} months tracked</div>
        </div>
        <div className="bb-stat-card">
          <div className="bb-stat-label">Total Expenses</div>
          <div className="bb-stat-value text-red-600">{fmtGBP(totalExpenses)}</div>
          <div className="text-xs text-slate-500 mt-1">Avg: {fmtGBP(avgMonthlyExpense)}/month</div>
        </div>
        <div className="bb-stat-card">
          <div className="bb-stat-label">Total Savings</div>
          <div className="bb-stat-value text-indigo-600">{fmtGBP(totalSavings)}</div>
          <div className="text-xs text-slate-500 mt-1">{((totalSavings / totalIncome) * 100).toFixed(1)}% saved</div>
        </div>
        <div className="bb-stat-card">
          <div className="bb-stat-label">Current Debt</div>
          <div className="bb-stat-value text-orange-600">{fmtGBP(latest.debt)}</div>
          <div className="text-xs text-slate-500 mt-1">As of {MONTHS[latest.month - 1]}</div>
        </div>
      </div>

      {/* Income vs Expenses Trend */}
      <div className="bb-card p-6">
        <h2 className="bb-section-title mb-4">💰 Income vs Expenses Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => fmtGBP(value)} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
            <Line type="monotone" dataKey="savings" stroke="#6366F1" strokeWidth={2} name="Savings" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown Pie Chart */}
      <div className="bb-card p-6">
        <h2 className="bb-section-title mb-4">🍰 Expense Breakdown ({MONTHS[latest.month - 1]})</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
  <Pie
  data={expenseBreakdown}
  cx="50%"
  cy="50%"
  labelLine={false}
  label
  outerRadius={80}
  fill="#8884d8"
  dataKey="value"
  nameKey="name"
>
  {expenseBreakdown.map((_, index) => (
    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
  ))}
</Pie>
  <Tooltip formatter={(value: number) => fmtGBP(value)} />
</PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-2">
            {expenseBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></div>
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{fmtGBP(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Expense Comparison */}
      <div className="bb-card p-6">
        <h2 className="bb-section-title mb-4">📈 Monthly Expense Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyComparison}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => fmtGBP(value)} />
            <Legend />
            <Bar dataKey="total" fill="#6366F1" name="Total Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Spending Insights */}
      <div className="bb-card p-6">
        <h2 className="bb-section-title mb-4">💡 Spending Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">🏆 Biggest Expense Category</h3>
            <p className="text-sm text-blue-800">
              {expenseBreakdown[0]?.name}: {fmtGBP(expenseBreakdown[0]?.value)} 
              ({((expenseBreakdown[0]?.value / latest.total_Expenses) * 100).toFixed(1)}% of total)
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-900 mb-2">📊 Savings Rate</h3>
            <p className="text-sm text-green-800">
              {((latest.monthly_Savings / latest.monthly_Income) * 100).toFixed(1)}% of your income is being saved
              {latest.monthly_Savings / latest.monthly_Income > 0.2 ? ' - Great job! 🎉' : ' - Try to save more!'}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-bold text-purple-900 mb-2">📉 Spending Trend</h3>
            <p className="text-sm text-purple-800">
              {sortedBudgets.length >= 2 && 
                sortedBudgets[sortedBudgets.length - 1].total_Expenses < sortedBudgets[sortedBudgets.length - 2].total_Expenses
                ? '✅ Your spending decreased last month!'
                : '⚠️ Your spending increased last month. Review your budget.'}
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-bold text-orange-900 mb-2">💳 Debt Status</h3>
            <p className="text-sm text-orange-800">
              Current debt: {fmtGBP(latest.debt)}
              {latest.debt > 0 ? ' - Consider allocating more to debt repayment' : ' - Debt free! 🎉'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}