import { MortgageRequest } from '../types/mortgage.types';

interface ValidationRule {
    condition: boolean;
    message: string;
}

export const getMortgageValidationRules = (data: MortgageRequest, downPaymentPercent: number, minimumDownPayment: number): ValidationRule[] => [
    {
        condition: data.propertyPrice > 1500000 && downPaymentPercent < 20,
        message: 'For properties over $1,500,000, minimum down payment is 20%'
    },
    {
        condition: data.propertyPrice < data.downPayment,
        message: 'Down payment cannot exceed property price'
    },
    {
        condition: downPaymentPercent < 10 && data.employmentType === 'self-employed-non-verified',
        message: 'Self-employed with non-verified income requires minimum 10% down payment'
    },
    {
        condition: data.propertyPrice > 500000 && data.downPayment < minimumDownPayment,
        message: 'For homes over $500,000, minimum down payment is 5% of first $500,000 and 10% of remaining amount'
    },
    {
        condition: downPaymentPercent < 5,
        message: 'Minimum down payment must be 5% of property price'
    },
    {
        condition: data.amortizationPeriod > 25 && !(data.isFirstTimeBuyer || data.isNewConstruction),
        message: 'Maximum amortization period is 25 years, unless you are a first-time home buyer or purchasing a newly-constructed home'
    },
    {
        condition: data.downPayment < minimumDownPayment,
        message: data.propertyPrice > 500000
            ? 'For homes over $500,000, minimum down payment is 5% of first $500,000 and 10% of remaining amount'
            : 'Minimum down payment must be 5% of property price'
    },
]