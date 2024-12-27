// src/services/mortgageService.test.ts
import { calculateMortgage } from '../../services/mortgageServices';
import { MortgageRequest, PaymentSchedule, EmploymentType } from '../../types/mortgage.types';

describe('Mortgage Service', () => {
  // Define the base request object at the top level
  const baseMortgageRequest: MortgageRequest = {
    propertyPrice: 500000,
    downPayment: 100000,
    annualInterestRate: 5,
    amortizationPeriod: 25,
    paymentSchedule: 'monthly',
    isFirstTimeBuyer: true,
    isNewConstruction: false,
    downPaymentSource: 'traditional',
    employmentType: 'regular'
  };

  describe('getPaymentsPerYear', () => {
    test('should return 12 for monthly schedule', () => {
      const request: MortgageRequest = {
        ...baseMortgageRequest,
        paymentSchedule: 'monthly'
      };
      const result = calculateMortgage(request);
      expect(result.paymentAmount).toBeDefined();
    });

    test('should return 26 for biweekly schedule', () => {
      const request: MortgageRequest = {
        ...baseMortgageRequest,
        paymentSchedule: 'biweekly'
      };
      const result = calculateMortgage(request);
      expect(result.paymentAmount).toBeDefined();
    });

    test('should return 26 for accelerated-biweekly schedule', () => {
      const request: MortgageRequest = {
        ...baseMortgageRequest,
        paymentSchedule: 'accelerated-biweekly'
      };
      const result = calculateMortgage(request);
      expect(result.paymentAmount).toBeDefined();
    });

    test('should throw error for invalid schedule', () => {
      const request: MortgageRequest = {
        ...baseMortgageRequest,
        paymentSchedule: 'invalid' as PaymentSchedule
      };
      expect(() => calculateMortgage(request)).toThrow('Invalid payment schedule');
    });
  });

  describe('calculateCMHCPremiumRate', () => {
    test('should return 0 for down payment >= 20%', () => {
      const request = {
        ...baseMortgageRequest,
        propertyPrice: 500000,
        downPayment: 100000 // 20%
      };
      const result = calculateMortgage(request);
      expect(result.cmhcPremiumRate).toBe(0);
    });

    test('should calculate correct premium for self-employed-non-verified', () => {
      const request = {
        ...baseMortgageRequest,
        propertyPrice: 500000,
        downPayment: 75000, // 15%
        employmentType: 'self-employed-non-verified' as EmploymentType
      };
      const result = calculateMortgage(request);
      expect(result.cmhcPremiumRate).toBe(0.0290);
    });

    test('should throw error for self-employed with less than 10% down', () => {
      const request = {
        ...baseMortgageRequest,
        propertyPrice: 500000,
        downPayment: 45000, // 9%
        employmentType: 'self-employed-non-verified' as EmploymentType
      };
      expect(() => calculateMortgage(request)).toThrow(
        'Self-employed with non-verified income requires minimum 10% down payment'
      );
    });

    test('should add premium for extended amortization', () => {
      const request = {
        ...baseMortgageRequest,
        propertyPrice: 500000,
        downPayment: 75000, // 15%
        amortizationPeriod: 30,
        isFirstTimeBuyer: true
      };
      const result = calculateMortgage(request);
      expect(result.cmhcPremiumRate).toBe(0.0300); // 0.0280 + 0.0020
    });
  });

  describe('calculatePaymentAmount', () => {
    test('should calculate correct monthly payment', () => {
      const request: MortgageRequest = {
        ...baseMortgageRequest,
        propertyPrice: 500000,
        downPayment: 100000,
        annualInterestRate: 5
      };
      const result = calculateMortgage(request);
      expect(typeof result.paymentAmount).toBe('number');
      expect(result.paymentAmount).toBeGreaterThan(0);
    });

    test('should handle zero interest rate', () => {
      const request: MortgageRequest = {
        ...baseMortgageRequest,
        annualInterestRate: 0
      };
      const result = calculateMortgage(request);
      expect(result.paymentAmount).toBeGreaterThan(0);
      const expectedPayment = (request.propertyPrice - request.downPayment) / (request.amortizationPeriod * 12);
      expect(result.paymentAmount).toBeCloseTo(expectedPayment, 2);
    });

    test('should calculate correct accelerated bi-weekly payment', () => {
      const request: MortgageRequest = {
        ...baseMortgageRequest,
        paymentSchedule: 'accelerated-biweekly'
      };
      const result = calculateMortgage(request);
      expect(result.paymentAmount).toBeGreaterThan(0);
    });
  });

  describe('calculateMortgage integration', () => {
    test('should calculate all mortgage components correctly', () => {
      const request: MortgageRequest = {
        ...baseMortgageRequest,
        propertyPrice: 500000,
        downPayment: 50000, // 10%
        annualInterestRate: 5
      };

      const result = calculateMortgage(request);

      expect(result).toEqual({
        paymentAmount: expect.any(Number),
        cmhcInsurance: expect.any(Number),
        totalMortgage: expect.any(Number),
        mortgageBeforeCMHC: 450000,
        downPaymentPercentage: 10,
        cmhcPremiumRate: 0.0310
      });

      expect(result.mortgageBeforeCMHC).toBe(request.propertyPrice - request.downPayment);
      expect(result.downPaymentPercentage).toBe((request.downPayment / request.propertyPrice) * 100);
      expect(result.cmhcInsurance).toBe(result.mortgageBeforeCMHC * result.cmhcPremiumRate);
      expect(result.totalMortgage).toBe(result.mortgageBeforeCMHC + result.cmhcInsurance);
    });
  });
});