import { MortgageRequest, MortgageResponse, PaymentSchedule } from '../types/mortgage.types';
import { calculateCMHCPremiumRate } from './calculateCMHCPremiumRate';

const getPaymentsPerYear = (schedule: PaymentSchedule): number => {
  switch (schedule) {
    case 'monthly': return 12;
    case 'biweekly': 24;
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

export const calculateMortgage = (data: MortgageRequest): MortgageResponse => {
    const downPaymentPercentage = (data.downPayment / data.propertyPrice) * 100;
    const mortgageBeforeCMHC = data.propertyPrice - data.downPayment;

    const cmhcPremiumRate = calculateCMHCPremiumRate(
        {
            propertyValue: data.propertyPrice,
            downPaymentAmount: data.downPayment,
            amortizationPeriod: data.amortizationPeriod,
            isFirstTimeBuyer: data.isFirstTimeBuyer,
            isNewConstruction: data.isNewConstruction,
            downPaymentSource: data.downPaymentSource,
            employmentType: data.employmentType
        }
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
