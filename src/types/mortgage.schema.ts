// src/schemas/mortgage.schema.ts
import { z } from 'zod';
import { DownPaymentSource, EmploymentType } from './mortgage.types';

export const mortgageSchema = z.object({
  propertyPrice: z
    .number()
    .positive('Property price must be greater than 0')
    .max(1500000, 'CMHC insurance is not available for homes over $1.5 million'),

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

export const validateDownPayment = (
  propertyPrice: number,
  downPayment: number,
  employmentType: EmploymentType
) => {
  const downPaymentPercent = (downPayment / propertyPrice) * 100;

  // Self-employed validation
  if (employmentType === 'self-employed-non-verified' && downPaymentPercent < 10) {
    throw new Error('Self-employed with non-verified income requires minimum 10% down payment');
  }

  // Property price based validations
  if (propertyPrice > 1000000) {
    if (downPaymentPercent < 20) {
      throw new Error('Properties over $1,000,000 require minimum 20% down payment');
    }
  } else if (propertyPrice > 500000) {
    const firstTierDownPayment = 500000 * 0.05;
    const secondTierDownPayment = (propertyPrice - 500000) * 0.10;
    const minimumDownPayment = firstTierDownPayment + secondTierDownPayment;

    if (downPayment < minimumDownPayment) {
      throw new Error(
        'For homes over $500,000, minimum down payment is 5% of first $500,000 and 10% of remaining amount'
      );
    }
  } else if (downPaymentPercent < 5) {
    throw new Error('Minimum down payment must be 5% of property price');
  }

  return true;
};

export const calculateCMHCPremiumRate = (
  downPaymentPercent: number,
  amortizationPeriod: number,
  isFirstTimeBuyer: boolean,
  isNewConstruction: boolean,
  downPaymentSource: DownPaymentSource,
  employmentType: EmploymentType
): number => {
  if (downPaymentPercent >= 20) return 0;

  let baseRate: number;

  // Self-employed rates
  if (employmentType === 'self-employed-non-verified') {
    if (downPaymentPercent < 10) {
      throw new Error('Self-employed with non-verified income requires minimum 10% down payment');
    }
    if (downPaymentPercent >= 15) {
      baseRate = 0.0290; // 2.90%
    } else {
      baseRate = 0.0475; // 4.75%
    }
  }
  else if (downPaymentSource === 'non-traditional' && downPaymentPercent < 10) {
    // Non-traditional down payment rates
    baseRate = 0.0450; // 4.50%
  }
  else {
    // Traditional down payment rates
    if (downPaymentPercent >= 15) {
      baseRate = 0.0280; // 2.80%
    } else if (downPaymentPercent >= 10) {
      baseRate = 0.0310; // 3.10%
    } else {
      baseRate = 0.0400; // 4.00%
    }
  }

  // Add 20 basis points for extended amortization if eligible
  if (amortizationPeriod > 25 && (isFirstTimeBuyer || isNewConstruction)) {
    baseRate += 0.0020; // Add 20 basis points (0.20%)
  }

  return baseRate;
};

export type MortgageInput = z.infer<typeof mortgageSchema>;