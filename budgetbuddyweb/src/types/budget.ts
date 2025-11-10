export type BudgetEntry = {
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

  savings: number;
  investments: number;
  net_Worth: number;
  needs: number;
  wants: number;
  savings_Investment_Total: number;
  debt: number;
  total_Liabilities: number;

  financial_Goals: string;
};

export type BudgetEntryDto = Omit<BudgetEntry, 'id' | 'userId'>;
