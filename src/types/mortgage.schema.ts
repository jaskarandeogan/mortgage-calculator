// src/schemas/mortgage.schema.ts
import { z } from 'zod';

export const mortgageSchema = z.object({
  propertyPrice: z
    .number()
    .positive('Property price must be greater than 0'),

  downPayment: z
    .number()
    .positive('Down payment must be greater than 0'),

  annualInterestRate: z
    .number()
    .min(0, 'Interest rate cannot be negative')
    .max(100, 'Interest rate cannot exceed 100'),

  amortizationPeriod: z
    .number()
    .min(5, 'Minimum amortization period is 5 years')
    .max(30, 'Maximum amortization period is 30 years')
    .refine(period => period % 5 === 0, 'Amortization period must be in 5-year increments'),

  paymentSchedule: z
    .enum(['accelerated-biweekly', 'biweekly', 'monthly'] as const),

  isFirstTimeBuyer: z
    .boolean()
    .default(false),

  isNewConstruction: z
    .boolean()
    .default(false),

  downPaymentSource: z
    .enum(['traditional', 'non-traditional'] as const)
    .default('traditional'),

  employmentType: z
    .enum(['regular', 'self-employed-non-verified'] as const)
    .default('regular')
});

export const downpaymentSchema = z.object({
  propertyPrice: z.number().positive('Property price must be greater than 0'),
  downPayment: z.number().positive('Down payment must be greater than 0'),
  employmentType: z.enum(['regular', 'self-employed-non-verified'] as const).default('regular')
});

export type MortgageInput = z.infer<typeof mortgageSchema>;
export type DownPaymentInput = z.infer<typeof downpaymentSchema>;