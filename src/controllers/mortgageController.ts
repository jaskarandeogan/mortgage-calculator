import { MortgageRequest, MortgageResponse, DownPaymentSource, EmploymentType, PaymentSchedule } from '../types/mortgage.types';
import { MortgageInput } from '../types/mortgage.schema';

const getPaymentsPerYear = (schedule: PaymentSchedule): number => {
  switch (schedule) {
    case 'monthly': return 12;
    case 'biweekly':
    case 'accelerated-biweekly': return 26;
    default: throw new Error('Invalid payment schedule');
  }
};

const calculateCMHCPremiumRate = (
  downPaymentPercentage: number,
  amortizationPeriod: number,
  isFirstTimeBuyer: boolean,
  isNewConstruction: boolean,
  downPaymentSource: DownPaymentSource,
  employmentType: EmploymentType
): number => {
  if (downPaymentPercentage >= 20) return 0;

  let baseRate: number;

  if (employmentType === 'self-employed-non-verified') {
    if (downPaymentPercentage < 10) {
      throw new Error('Self-employed with non-verified income requires minimum 10% down payment');
    }
    baseRate = downPaymentPercentage >= 15 ? 0.0290 : 0.0475; // 2.90% or 4.75%
  } else if (downPaymentSource === 'non-traditional' && downPaymentPercentage < 10) {
    baseRate = 0.0450; // 4.50%
  } else {
    if (downPaymentPercentage >= 15) {
      baseRate = 0.0280; // 2.80%
    } else if (downPaymentPercentage >= 10) {
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

export const calculateMortgage = (data: MortgageRequest): MortgageResponse => {
  const downPaymentPercentage = (data.downPayment / data.propertyPrice) * 100;
  const mortgageBeforeCMHC = data.propertyPrice - data.downPayment;

  const cmhcPremiumRate = calculateCMHCPremiumRate(
    downPaymentPercentage,
    data.amortizationPeriod,
    data.isFirstTimeBuyer,
    data.isNewConstruction,
    data.downPaymentSource,
    data.employmentType
  );

  const cmhcInsurance = mortgageBeforeCMHC * cmhcPremiumRate;
  const totalMortgage = mortgageBeforeCMHC + cmhcInsurance;

  const paymentAmount = calculatePaymentAmount(
    totalMortgage,
    data.annualInterestRate,
    data.amortizationPeriod,
    data.paymentSchedule
  );

  return {
    paymentAmount,
    cmhcInsurance,
    totalMortgage,
    mortgageBeforeCMHC,
    downPaymentPercentage,
    cmhcPremiumRate
  };
};



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

const calculatePaymentAmount = (
  principal: number,
  annualInterestRate: number,
  amortizationYears: number,
  schedule: PaymentSchedule
): number => {
  const paymentsPerYear = getPaymentsPerYear(schedule);
  const totalPayments = paymentsPerYear * amortizationYears;
  const periodicInterestRate = (annualInterestRate / 100) / paymentsPerYear;

  if (periodicInterestRate === 0) {
    return principal / totalPayments;
  }

  const rateFactorPower = Math.pow(1 + periodicInterestRate, totalPayments);
  let payment = principal * 
    (periodicInterestRate * rateFactorPower) / 
    (rateFactorPower - 1);

  if (schedule === 'accelerated-biweekly') {
    payment = payment * (12 / 24) * (26 / 12);
  }

  return Number(payment.toFixed(2));
};

