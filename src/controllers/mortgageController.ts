// src/controllers/mortgageController.ts
import { calculateMortgage } from '../services/mortgageServices';
import { MortgageInput } from '../types/mortgage.schema';
import { EmploymentType } from '../types/mortgage.types';

export const calculateMortgageController = (validatedData: MortgageInput ) => {
    
  const result = calculateMortgage(validatedData);

    return {
      status: 'success',
      data: result
    }
};

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