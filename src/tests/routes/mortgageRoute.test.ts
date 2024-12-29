import request from 'supertest';
import express, { Express } from 'express';
import mortgageRoutes from '../../routes/mortgageRoutes';
import { calculateMortgageController, validateDownPayment } from '../../controllers/mortgageController';

jest.mock('../../controllers/mortgageController');

describe('Mortgage Routes', () => {
    let app: Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/mortgage', mortgageRoutes);
        (calculateMortgageController as jest.Mock).mockReset();
        (validateDownPayment as jest.Mock).mockReset();
    });

    describe('GET /api/mortgage/health', () => {
        test('should return health check status', async () => {
            const mockDate = new Date('2024-01-01');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

            const response = await request(app)
                .get('/api/mortgage/health')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual({
                status: 'ok',
                timestamp: mockDate.toISOString()
            });
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
                rules: expect.objectContaining({
                    maxPropertyValue: 1500000,
                    minDownPaymentRules: expect.any(Object),
                    maxAmortization: expect.any(Object)
                })
            });
        });
    });

    describe('POST /validate-down-payment', () => {
        it('should validate a valid down payment', async () => {
            (validateDownPayment as jest.Mock).mockReturnValue(true);

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

        it('should handle missing required fields', async () => {
            const response = await request(app)
                .post('/api/mortgage/validate-down-payment')
                .send({ propertyPrice: 500000 })
                .expect('Content-Type', /json/)
                .expect(500);

            expect(response.body).toEqual({
                error: 'Internal server error'
            });
        });

        it('should handle validation errors from Zod', async () => {
            const response = await request(app)
                .post('/api/mortgage/validate-down-payment')
                .send({
                    propertyPrice: -500000,
                    downPayment: 50000,
                    employmentType: 'regular'
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('errors');
            expect(response.body.errors[0]).toHaveProperty('message');
            expect(response.body.errors[0]).toHaveProperty('field');
        });

        it('should handle self-employed validation', async () => {
            (validateDownPayment as jest.Mock).mockImplementation(() => {
                throw new Error('Self-employed with non-verified income requires minimum 10% down payment');
            });

            const response = await request(app)
                .post('/api/mortgage/validate-down-payment')
                .send({
                    propertyPrice: 500000,
                    downPayment: 40000,
                    employmentType: 'self-employed-non-verified'
                })
                .expect('Content-Type', /json/)
                .expect(500);

            expect(response.body).toEqual({
                error: 'Internal server error'
            });
        });
    });

    describe('POST /api/mortgage/calculate', () => {
        const validPayload = {
            propertyPrice: 500000,
            downPayment: 50000,
            annualInterestRate: 5.99,
            amortizationPeriod: 25,
            paymentSchedule: 'monthly',
            isFirstTimeBuyer: true,
            isNewConstruction: false,
            downPaymentSource: 'traditional',
            employmentType: 'regular'
        };

        const mockCalculationResult = {
            paymentAmount: 2876.25,
            cmhcInsurance: 18000,
            totalMortgage: 468000,
            mortgageBeforeCMHC: 450000,
            downPaymentPercentage: 10,
            cmhcPremiumRate: 0.04
        };

        test('should calculate mortgage successfully', async () => {
            (calculateMortgageController as jest.Mock).mockReturnValue(mockCalculationResult);

            const response = await request(app)
                .post('/api/mortgage/calculate')
                .send(validPayload)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual(mockCalculationResult);
            expect(calculateMortgageController).toHaveBeenCalledWith(validPayload);
        });

        test('should handle calculation with accelerated bi-weekly payments', async () => {
            const acceleratedPayload = {
                ...validPayload,
                paymentSchedule: 'accelerated-biweekly'
            };

            const acceleratedResult = {
                ...mockCalculationResult,
                paymentAmount: 1438.13
            };

            (calculateMortgageController as jest.Mock).mockReturnValue(acceleratedResult);

            const response = await request(app)
                .post('/api/mortgage/calculate')
                .send(acceleratedPayload)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual(acceleratedResult);
        });

        test('should handle validation errors', async () => {
            const invalidPayload = {
                ...validPayload,
                annualInterestRate: -5.99
            };

            const response = await request(app)
                .post('/api/mortgage/calculate')
                .send(invalidPayload)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('errors');
            expect(Array.isArray(response.body.errors)).toBe(true);
        });
    });
});