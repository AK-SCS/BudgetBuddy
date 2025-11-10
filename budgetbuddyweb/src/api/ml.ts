/**
 * API client for Python ML service endpoints
 * Provides expense predictions and spare cash allocation recommendations
 */

import axios from 'axios';

const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

/**
 * Input type for ML expense prediction requests
 * Includes all budget categories for feature engineering
 */
export type PredictBody = {
  month: number;
  monthly_income: number;
  rent: number;
  loan_repayment: number;
  insurance: number;
  subscriptions: number;
  groceries: number;
  travel: number;
  going_out: number;
  entertainment: number;
  utilities: number;
  healthcare: number;
  education: number;
  miscellaneous: number;
};

/**
 * Response type from ML prediction endpoint
 * Includes predicted expenses with confidence metrics
 */
export type PredictResponse = {
  predicted_total_expenses: number;
  actual_total_expenses?: number;
  difference?: number;
  percentage_difference?: number;
  confidence_level?: string;
};

/**
 * Input type for spare cash allocation requests
 * Provides current expenses and financial context
 */
export type AllocateBody = {
  spare_cash: number;
  current_expenses: {
    rent?: number;
    loan_repayment?: number;
    insurance?: number;
    subscriptions?: number;
    groceries?: number;
    travel?: number;
    going_out?: number;
    entertainment?: number;
    utilities?: number;
    healthcare?: number;
    education?: number;
    miscellaneous?: number;
  };
  monthly_income: number;
  financial_goals?: string[];
};

/**
 * Response type from allocation endpoint
 * Provides prioritized allocation recommendations
 */
export type AllocateResponse = {
  total_spare_cash: number;
  allocations: Array<{
    category: string;
    amount: number;
    percentage: number;
    reason: string;
    priority: string;
  }>;
  summary: string;
  tip: string;
};

/**
 * Calls ML service to predict total monthly expenses
 */
export async function mlPredict(body: PredictBody) {
  const res = await axios.post(`${ML_API_URL}/predict`, body);
  return res.data as PredictResponse;
}

/**
 * Calls ML service to generate spare cash allocation recommendations
 */
export async function mlAllocate(body: AllocateBody) {
  const res = await axios.post(`${ML_API_URL}/allocate-spare-cash`, body);
  return res.data as AllocateResponse;
}