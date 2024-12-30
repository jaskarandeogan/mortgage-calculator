// src/routes/mortgageRoutes.ts
import { Router, RequestHandler } from 'express';
import { calculateMortgageController } from '../controllers/mortgageController';
import { mortgageSchema } from '../types/mortgage.schema';
import { ZodError } from 'zod';

const router = Router();

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
        over500kTo1500k: "5% of first $500,000 + 10% of remaining",
        over1500k: "20% of purchase price"
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

const calculateMortgageRoute: RequestHandler = async (req, res) => {
  try {
    const validatedData = mortgageSchema.parse(req.body);

    const result = await calculateMortgageController(validatedData);
    
    if (result.status === 'error') {
      res.status(400).json({
        status: 'error',
        errors: result.message
      });
      return;
    }
    
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    } else if (error instanceof Error) {
      res.status(400).json({
        errors: error.message
      });
    } else {
      res.status(500).json({
        errors: 'Internal server error'
      });
    }
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
router.get('/sample', getSampleCalculation);
router.get('/cmhc-info', getCMHCInfo);
router.post('/calculate', calculateMortgageRoute);

export default router;