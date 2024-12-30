import { MortgageInput } from '../types/mortgage.schema';
import { calculateMortgage } from '../services/calculateMortgage';


export const calculateMortgageController = (validatedData: MortgageInput) => {
  const downPaymentPercent = (validatedData.downPayment / validatedData.propertyPrice) * 100;

  // Check high-value properties first
  if (validatedData.propertyPrice > 1500000 && downPaymentPercent < 20) {
    throw new Error('For properties over $1,500,000, minimum down payment is 20%');
  }
  
  if (validatedData.propertyPrice < validatedData.downPayment) {
    throw new Error('Down payment cannot exceed property price');
  }

  if (downPaymentPercent < 10 && validatedData.employmentType === 'self-employed-non-verified') {
    throw new Error('Self-employed with non-verified income requires minimum 10% down payment');
  } else if (validatedData.propertyPrice > 500000) {
    const firstTierDownPayment = 500000 * 0.05;
    const secondTierDownPayment = (validatedData.propertyPrice - 500000) * 0.10;
    const minimumDownPayment = firstTierDownPayment + secondTierDownPayment;
    if (validatedData.downPayment < minimumDownPayment) {
      throw new Error(
        'For homes over $500,000, minimum down payment is 5% of first $500,000 and 10% of remaining amount'
      );
    }
  } else if (downPaymentPercent < 5) {
    throw new Error('Minimum down payment must be 5% of property price');
  }

  const result = calculateMortgage(validatedData);

  if (!result) {
    throw new Error('Error calculating mortgage');
  }

  return {
    status: 'success',
    data: {
      paymentAmount: result.paymentAmount,
      cmhcInsurance: result.cmhcInsurance,
      totalMortgage: result.totalMortgage,
      mortgageBeforeCMHC: result.mortgageBeforeCMHC,
      downPaymentPercentage: result.downPaymentPercentage,
      cmhcPremiumRate: result.cmhcPremiumRate
    }
  };
};



