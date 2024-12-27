// src/routes/mortgageRoutes.ts
import { Router, RequestHandler } from 'express';
import { mortgageCalculator } from '../controllers/mortgageController';
import { validateDownPayment } from '../types/mortgage.schema';

const router = Router();

// Main mortgage calculation endpoint
router.post('/calculate', mortgageCalculator);

// Get CMHC rates and rules
const getCMHCInfo: RequestHandler = (_, res): void => {
  void res.json({
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
};

// Get sample calculation
const getSampleCalculation: RequestHandler = (_, res): void => {
  void res.json({
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
};

// Validate down payment
const validateDownPaymentRoute: RequestHandler = (req, res): void => {
  try {
    const { propertyPrice, downPayment, employmentType = 'regular' } = req.body;

    if (!propertyPrice || !downPayment) {
      throw new Error('Property price and down payment are required');
    }

    validateDownPayment(propertyPrice, downPayment, employmentType);
    const downPaymentPercentage = (downPayment / propertyPrice) * 100;

    void res.json({
      isValid: true,
      propertyPrice,
      downPayment,
      downPaymentPercentage,
      employmentType
    });
  } catch (error) {
    void res.status(400).json({
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid input'
    });
  }
};

// Simple health check endpoint
const healthCheck: RequestHandler = (_, res): void => {
  void res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
};

router.get('/health', healthCheck);
router.get('/cmhc-info', getCMHCInfo);
router.get('/sample', getSampleCalculation);
router.post('/validate-down-payment', validateDownPaymentRoute);

export default router;