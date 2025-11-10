export interface FinancialGoal {
  id: number;
  userId: number;
  goalName: string;
  targetAmount: number;
  currentProgress: number;
  deadline: string; // ISO
}
export type FinancialGoalDto = Omit<FinancialGoal, 'id'|'userId'>;
