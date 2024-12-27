// src/routes/mortgageRoutes.test.ts
import request from 'supertest';
import express, { Express } from 'express';
import mortgageRoutes from '../../routes/mortgageRoutes';

// Mock the controller
jest.mock('../../controllers/mortgageController', () => ({
    mortgageCalculator: jest.fn((req, res) => {
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

describe('Mortgage Routes', () => {
    let app: Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/mortgage', mortgageRoutes);
    });

    describe('GET /api/mortgage/health', () => {
        test('should return health check status', async () => {
            const response = await request(app)
                .get('/api/mortgage/health')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual({
                status: 'ok',
                timestamp: expect.any(String)
            });

            // Verify timestamp is valid ISO string
            expect(() => new Date(response.body.timestamp)).not.toThrow();
        });
    });

    describe('GET /api/mortgage/cmhc-info', () => {
        test('should return CMHC rates and rules', async () => {
            const response = await request(app)
                .get('/api/mortgage/cmhc-info')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual({
                premiumRates: {
                    regular: {
                        "5-9.99": 4.00,
                        "10-14.99": 3.10,
                        "15-19.99": 2.80,
                        "20+": 0
                    },
                    nonTraditional: {
                        "5-9.99": 4.50,
                        "10-14.99": 3.10,
                        "15-19.99": 2.80,
                        "20+": 0
                    },
                    selfEmployed: {
                        "10-14.99": 4.75,
                        "15-19.99": 2.90,
                        "20+": 0
                    }
                },
                rules: {
                    maxPropertyValue: 1500000,
                    minDownPaymentRules: {
                        upTo500k: "5% of purchase price",
                        over500kTo1M: "5% of first $500,000 + 10% of remaining",
                        over1M: "20% of purchase price"
                    },
                    maxAmortization: {
                        regular: 25,
                        firstTimeBuyerOrNewConstruction: 30
                    },
                    extendedAmortization: {
                        eligibility: ["first-time-buyer", "new-construction"],
                        additionalPremium: 0.20
                    }
                }
            });
        });
    });

    describe('GET /api/mortgage/sample', () => {
        test('should return sample calculation data', async () => {
            const response = await request(app)
                .get('/api/mortgage/sample')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual({
                example: {
                    propertyPrice: 600000,
                    downPayment: 50000,
                    annualInterestRate: 5.99,
                    amortizationPeriod: 25,
                    paymentSchedule: "monthly",
                    isFirstTimeBuyer: true,
                    isNewConstruction: false,
                    downPaymentSource: "traditional",
                    employmentType: "regular"
                }
            });
        });
    });

    describe('POST /api/mortgage/validate-down-payment', () => {
        test('should validate valid down payment', async () => {
            const requestBody = {
                propertyPrice: 500000,
                downPayment: 50000,
                employmentType: 'regular'
            };

            const response = await request(app)
                .post('/api/mortgage/validate-down-payment')
                .send(requestBody)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual({
                isValid: true,
                propertyPrice: 500000,
                downPayment: 50000,
                downPaymentPercentage: 10,
                employmentType: 'regular'
            });
        });

        test('should reject invalid down payment', async () => {
            const requestBody = {
                propertyPrice: 500000,
                downPayment: 10000, // Too low
                employmentType: 'regular'
            };

            const response = await request(app)
                .post('/api/mortgage/validate-down-payment')
                .send(requestBody)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toEqual({
                isValid: false,
                error: expect.any(String)
            });
        });

        test('should handle missing required fields', async () => {
            const requestBody = {
                propertyPrice: 500000
                // Missing downPayment
            };

            const response = await request(app)
                .post('/api/mortgage/validate-down-payment')
                .send(requestBody)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toEqual({
                isValid: false,
                error: 'Property price and down payment are required'
            });
        });

        test('should handle self-employed with insufficient down payment', async () => {
            const requestBody = {
                propertyPrice: 500000,
                downPayment: 40000, // 8% - below 10% minimum for self-employed
                employmentType: 'self-employed-non-verified'
            };

            const response = await request(app)
                .post('/api/mortgage/validate-down-payment')
                .send(requestBody)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.isValid).toBe(false);
            expect(response.body.error).toBe('Self-employed with non-verified income requires minimum 10% down payment');
        });
    });

    describe('POST /api/mortgage/calculate', () => {
        // Note: This test will depend on your mortgageCalculator implementation
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

            // This test assumes your mortgageCalculator is properly implemented
            // You might need to mock the mortgageCalculator if it's not available in tests
            const response = await request(app)
                .post('/api/mortgage/calculate')
                .send(requestBody)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('paymentAmount');
            expect(response.body).toHaveProperty('cmhcInsurance');
            expect(response.body).toHaveProperty('totalMortgage');
        });
    });
});