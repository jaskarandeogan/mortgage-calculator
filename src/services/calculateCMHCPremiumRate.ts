import { DownPaymentSource, EmploymentType } from "../types/mortgage.types";

export const calculateCMHCPremiumRate = ({
    propertyValue,
    downPaymentAmount,
    amortizationPeriod,
    isFirstTimeBuyer,
    isNewConstruction,
    downPaymentSource,
    employmentType
}:{
    propertyValue: number,
    downPaymentAmount: number,
    amortizationPeriod: number,
    isFirstTimeBuyer: boolean,
    isNewConstruction: boolean,
    downPaymentSource: DownPaymentSource,
    employmentType: EmploymentType
}): number => {
    const downPaymentPercent = (downPaymentAmount / propertyValue) * 100;

    if (downPaymentPercent >= 20) {
        return 0;
    }

    let baseRate: number;

    // Self-employed rates
    if (employmentType === 'self-employed-non-verified') {
        if (downPaymentPercent < 10) {
            throw new Error('Self-employed with non-verified income requires minimum 10% down payment');
        }
        if (downPaymentPercent < 15) {
            baseRate = 0.0475; // 4.75%
        } else {
            baseRate = 0.0290; // 2.90%
        }
    }
    // Non-traditional down payment rates
    else if (downPaymentSource === 'non-traditional' && downPaymentPercent < 10) {
        baseRate = 0.0450; // 4.50%
    }
    // Traditional down payment rates
    else {
        if (downPaymentPercent < 5) {
            throw new Error('Minimum down payment must be 5% of property price');
        } else if (downPaymentPercent < 10) {
            baseRate = 0.0400; // 4.00%
        } else if (downPaymentPercent < 15) {
            baseRate = 0.0310; // 3.10%
        } else {
            baseRate = 0.0280; // 2.80%
        }
    }

    // Add 20 basis points for extended amortization
    if ((isFirstTimeBuyer || isNewConstruction) && amortizationPeriod > 25) {
        baseRate += 0.0020; // Add 20 basis points (0.20%)
    }

    return baseRate;
};