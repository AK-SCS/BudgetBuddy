import { z } from 'zod';

/**
 * Validation schemas using Zod for type-safe form validation
 */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const budgetEntrySchema = z.object({
  month: z
    .number()
    .int('Month must be an integer')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  monthlyIncome: z
    .number()
    .positive('Income must be positive')
    .min(0.01, 'Income is required'),
  rent: z.number().min(0, 'Cannot be negative').default(0),
  loanRepayment: z.number().min(0, 'Cannot be negative').default(0),
  insurance: z.number().min(0, 'Cannot be negative').default(0),
  subscriptions: z.number().min(0, 'Cannot be negative').default(0),
  groceries: z.number().min(0, 'Cannot be negative').default(0),
  travel: z.number().min(0, 'Cannot be negative').default(0),
  goingOut: z.number().min(0, 'Cannot be negative').default(0),
  entertainment: z.number().min(0, 'Cannot be negative').default(0),
  utilities: z.number().min(0, 'Cannot be negative').default(0),
  healthcare: z.number().min(0, 'Cannot be negative').default(0),
  education: z.number().min(0, 'Cannot be negative').default(0),
  miscellaneous: z.number().min(0, 'Cannot be negative').default(0),
  region: z.enum(['GB', 'IN']).default('GB'),
});

export const financialGoalSchema = z.object({
  name: z
    .string()
    .min(1, 'Goal name is required')
    .max(100, 'Name is too long')
    .trim(),
  targetAmount: z
    .number()
    .positive('Target amount must be positive')
    .min(1, 'Target amount is required'),
  currentAmount: z.number().min(0, 'Cannot be negative').default(0),
  deadline: z
    .string()
    .min(1, 'Deadline is required')
    .refine(
      (date) => {
        const deadlineDate = new Date(date);
        return deadlineDate > new Date();
      },
      { message: 'Deadline must be in the future' }
    ),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type BudgetEntryFormData = z.infer<typeof budgetEntrySchema>;
export type FinancialGoalFormData = z.infer<typeof financialGoalSchema>;
