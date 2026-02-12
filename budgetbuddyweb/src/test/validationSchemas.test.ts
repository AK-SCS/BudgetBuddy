import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, budgetEntrySchema } from '../lib/validationSchemas';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'notanemail',
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Different123',
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('should reject weak password', () => {
      const invalidData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });
  });

  describe('budgetEntrySchema', () => {
    it('should validate correct budget entry', () => {
      const validData = {
        month: 1,
        monthlyIncome: 5000,
        rent: 1000,
        groceries: 300,
        region: 'GB' as const,
      };
      expect(() => budgetEntrySchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid month', () => {
      const invalidData = {
        month: 13,
        monthlyIncome: 5000,
        rent: 1000,
      };
      expect(() => budgetEntrySchema.parse(invalidData)).toThrow();
    });

    it('should reject negative values', () => {
      const invalidData = {
        month: 1,
        monthlyIncome: 5000,
        rent: -100,
      };
      expect(() => budgetEntrySchema.parse(invalidData)).toThrow();
    });
  });
});
