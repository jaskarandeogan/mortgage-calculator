// src/types/mortgage.types.ts
export type PaymentSchedule = 'accelerated-biweekly' | 'biweekly' | 'monthly';

export type DownPaymentSource = 'traditional' | 'non-traditional';
export type EmploymentType = 'regular' | 'self-employed-non-verified';

export interface MortgageRequest {
  propertyPrice: number;
  downPayment: number;
  annualInterestRate: number;
  amortizationPeriod: number;
  paymentSchedule: PaymentSchedule;
  isFirstTimeBuyer: boolean;
  isNewConstruction: boolean;
  downPaymentSource: DownPaymentSource;
  employmentType: EmploymentType;
}

export interface MortgageResponse {
  paymentAmount: number;
  cmhcInsurance: number;
  totalMortgage: number;
  mortgageBeforeCMHC: number;
  downPaymentPercentage: number;
  cmhcPremiumRate: number;
}