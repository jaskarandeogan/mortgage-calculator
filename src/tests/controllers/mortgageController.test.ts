import { 
  calculateMortgage, 
  calculateMortgageController, 
  validateDownPayment 
} from '../../controllers/mortgageController';
import { DownPaymentSource, EmploymentType, PaymentSchedule } from '../../types/mortgage.types';

describe('Mortgage Controller', () => {

  // Validate down payment based on property price and employment type

  describe('validateDownPayment', () => {
    it('should validate regular employment with sufficient down payment', () => {
      expect(validateDownPayment(500000, 25000, 'regular')).toBe(true);
    });

    it('should throw error for self-employed with insufficient down payment', () => {
      expect(() => 
        validateDownPayment(500000, 45000, 'self-employed-non-verified')
      ).toThrow('Self-employed with non-verified income requires minimum 10% down payment');
    });

    it('should throw error for high-value property with insufficient down payment', () => {
      expect(() => 
        validateDownPayment(1200000, 180000, 'regular')
      ).toThrow('Properties over $1,000,000 require minimum 20% down payment');
    });

    it('should throw error for mid-range property with insufficient tiered down payment', () => {
      expect(() => 
        validateDownPayment(600000, 30000, 'regular')
      ).toThrow('For homes over $500,000, minimum down payment is 5% of first $500,000 and 10% of remaining amount');
    });

    it('should throw error for low down payment percentage', () => {
      expect(() => 
        validateDownPayment(400000, 15000, 'regular')
      ).toThrow('Minimum down payment must be 5% of property price');
    });
  });

  // Calculate mortgage payment details based on input parameters
  describe('calculateMortgage', () => {
    const validMortgageRequest = {
      propertyPrice: 500000,
      downPayment: 100000,
      annualInterestRate: 5.99,
      amortizationPeriod: 25,
      paymentSchedule: 'monthly' as PaymentSchedule,
      isFirstTimeBuyer: true,
      isNewConstruction: false,
      downPaymentSource: 'traditional' as DownPaymentSource,
      employmentType: 'regular' as EmploymentType
    };

    it('should calculate mortgage with monthly payments', () => {
      const result = calculateMortgage(validMortgageRequest);
      
      expect(result).toEqual({
        paymentAmount: expect.any(Number),
        cmhcInsurance: expect.any(Number),
        totalMortgage: expect.any(Number),
        mortgageBeforeCMHC: 400000,
        downPaymentPercentage: 20,
        cmhcPremiumRate: 0
      });
    });

    it('should calculate CMHC insurance for low down payment', () => {
      const lowDownPaymentRequest = {
        ...validMortgageRequest,
        downPayment: 50000 // 10% down payment
      };

      const result = calculateMortgage(lowDownPaymentRequest);
      expect(result.cmhcPremiumRate).toBeGreaterThan(0);
      expect(result.cmhcInsurance).toBeGreaterThan(0);
    });

    it('should calculate accelerated bi-weekly payments', () => {
      const biweeklyRequest = {
        ...validMortgageRequest,
        paymentSchedule: 'accelerated-biweekly' as PaymentSchedule
      };

      const monthlyResult = calculateMortgage(validMortgageRequest);
      const biweeklyResult = calculateMortgage(biweeklyRequest);

      // Bi-weekly payment should be roughly half of monthly
      expect(biweeklyResult.paymentAmount).toBeLessThan(monthlyResult.paymentAmount);
    });

    it('should handle extended amortization for first-time buyers', () => {
      const extendedRequest = {
        ...validMortgageRequest,
        amortizationPeriod: 30,
        downPayment: 50000 // To trigger CMHC insurance
      };

      const standardRequest = {
        ...validMortgageRequest,
        amortizationPeriod: 25,
        downPayment: 50000
      };

      const extendedResult = calculateMortgage(extendedRequest);
      const standardResult = calculateMortgage(standardRequest);

      // Extended amortization should have higher CMHC premium
      expect(extendedResult.cmhcPremiumRate).toBeGreaterThan(standardResult.cmhcPremiumRate);
    });

    it('should handle non-traditional down payment source', () => {
      const nonTraditionalRequest = {
        ...validMortgageRequest,
        downPayment: 45000,
        downPaymentSource: 'non-traditional' as DownPaymentSource
      };

      const result = calculateMortgage(nonTraditionalRequest);
      expect(result.cmhcPremiumRate).toBe(0.0450); // 4.50% for non-traditional under 10%
    });

    it('should handle self-employed calculation', () => {
      const selfEmployedRequest = {
        ...validMortgageRequest,
        downPayment: 75000, // 15% down payment
        employmentType: 'self-employed-non-verified' as EmploymentType
      };

      const result = calculateMortgage(selfEmployedRequest);
      expect(result.cmhcPremiumRate).toBe(0.0290); // 2.90% for self-employed with 15%+ down
    });
  });

  describe('calculateMortgageController', () => {
    it('should return success response with calculation result', () => {
      const validInput = {
        propertyPrice: 500000,
        downPayment: 100000,
        annualInterestRate: 5.99,
        amortizationPeriod: 25,
        paymentSchedule: 'monthly' as PaymentSchedule,
        isFirstTimeBuyer: true,
        isNewConstruction: false,
        downPaymentSource: 'traditional' as DownPaymentSource,
        employmentType: 'regular' as EmploymentType
      };

      const result = calculateMortgageController(validInput);
      
      expect(result).toEqual({
        status: 'success',
        data: expect.objectContaining({
          paymentAmount: expect.any(Number),
          cmhcInsurance: expect.any(Number),
          totalMortgage: expect.any(Number),
          mortgageBeforeCMHC: expect.any(Number),
          downPaymentPercentage: expect.any(Number),
          cmhcPremiumRate: expect.any(Number)
        })
      });
    });
  });
});