// src/tests/controllers/mortgageController.test.ts
import request from 'supertest';
import express from 'express';
import mortgageRoutes from '../../routes/mortgageRoutes';
import { mortgageCalculator } from '../../controllers/mortgageController';
import app from '../../app';

jest.mock('../../controllers/mortgageController', () => ({
  mortgageCalculator: jest.fn((_, res) => {
    res.json({
      paymentAmount: 2500.50,
      cmhcInsurance: 15000,
      totalMortgage: 450000,
      mortgageBeforeCMHC: 400000,
      downPaymentPercentage: 20,
      cmhcPremiumRate: 0
    });
  })
}));

describe('POST /api/mortgage/calculate', () => {
  beforeEach(() => {
    app.use(express.json());
    app.use('/api/mortgage', mortgageRoutes);
    (mortgageCalculator as jest.Mock).mockClear();
  });

  test('should calculate mortgage details', async () => {
    const requestBody = {
      propertyPrice: 500000,
      downPayment: 100000,
      annualInterestRate: 5,
      amortizationPeriod: 25,
      paymentSchedule: 'monthly',
      isFirstTimeBuyer: true,
      isNewConstruction: false,
      downPaymentSource: 'traditional',
      employmentType: 'employed'
    };

    const response = await request(app)
      .post('/api/mortgage/calculate')
      .send(requestBody)
      .expect('Content-Type', /json/)
      .expect(200);

    // Verify response structure
    expect(response.body).toEqual({
      paymentAmount: expect.any(Number),
      cmhcInsurance: expect.any(Number),
      totalMortgage: expect.any(Number),
      mortgageBeforeCMHC: expect.any(Number),
      downPaymentPercentage: expect.any(Number),
      cmhcPremiumRate: expect.any(Number)
    });

    // Verify that controller was called
    expect(mortgageCalculator).toHaveBeenCalledTimes(1);
    
    // Only verify that the first argument (req) contains our request body
    const [[firstArg]] = (mortgageCalculator as jest.Mock).mock.calls;
    expect(firstArg.body).toEqual(requestBody);
  });
});