import { MortgageInput } from '../types/mortgage.schema';
import { calculateMortgage } from '../services/calculateMortgage';
import { getMortgageValidationRules } from '../services/validationRules';

export const calculateMinimumDownPayment = (propertyPrice: number): number => {
  if (propertyPrice <= 500000) {
    return propertyPrice * 0.05;
  }
  
  const firstTierDownPayment = 500000 * 0.05;  // 5% of 500k
  const remainingAmount = propertyPrice - 500000;
  const secondTierDownPayment = remainingAmount * 0.10;  // 10% of remaining

  return firstTierDownPayment + secondTierDownPayment;
};

export const calculateMortgageController = async (validatedData: MortgageInput):Promise<{
  status: 'success' | 'error';
  data?: {
    paymentAmount: number;
    cmhcInsurance: number;
    totalMortgage: number;
    mortgageBeforeCMHC: number;
    downPaymentPercentage: number;
    cmhcPremiumRate: number;
  };
  message?: string;
}> => {
  const downPaymentPercent = (validatedData.downPayment / validatedData.propertyPrice) * 100;
  const minimumDownPayment = calculateMinimumDownPayment(validatedData.propertyPrice);

  const validationRules = getMortgageValidationRules(validatedData, downPaymentPercent, minimumDownPayment);
  const failedRule = validationRules.find(rule => rule.condition);
  
  if (failedRule) {
    return {
      status: 'error',
      message: failedRule.message
    };
  }

  const result = calculateMortgage(validatedData);

  return {
    status: 'success',
    data: {
      paymentAmount: result.paymentAmount,
      cmhcInsurance: result.cmhcInsurance,
      totalMortgage: result.totalMortgage,
      mortgageBeforeCMHC: result.mortgageBeforeCMHC,
      downPaymentPercentage: result.downPaymentPercentage,
      cmhcPremiumRate: result.cmhcPremiumRate
    },
    message: 'Mortgage calculated successfully'
  };
};



