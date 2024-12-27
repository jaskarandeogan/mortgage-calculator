// src/services/mortgageService.ts
import { MortgageRequest, MortgageResponse,DownPaymentSource,EmploymentType, PaymentSchedule } from '../types/mortgage.types';

const getPaymentsPerYear = (schedule: PaymentSchedule): number => {
  switch (schedule) {
    case 'monthly': return 12;
    case 'biweekly':
    case 'accelerated-biweekly': return 26;
    default: throw new Error('Invalid payment schedule');
  }
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
    baseRate = downPaymentPercentage >= 15 ? 0.0290 : 0.0475;
  } else if (downPaymentSource === 'non-traditional' && downPaymentPercentage < 10) {
    baseRate = 0.0450;
  } else {
    if (downPaymentPercentage >= 15) {
      baseRate = 0.0280;
    } else if (downPaymentPercentage >= 10) {
      baseRate = 0.0310;
    } else {
      baseRate = 0.0400;
    }
  }

  // Add 20 basis points for extended amortization if eligible
  if (amortizationPeriod > 25 && (isFirstTimeBuyer || isNewConstruction)) {
    baseRate += 0.0020;
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