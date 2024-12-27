// src/controllers/mortgageController.ts
import { RequestHandler } from 'express';
import { calculateMortgage } from '../services/mortgageServices';
import { mortgageSchema } from '../types/mortgage.schema';
import { ZodError } from 'zod';

export const mortgageCalculator: RequestHandler = (req, res): void => {
  try {
    // Validate request body
    const validatedData = mortgageSchema.parse(req.body);

    // Calculate mortgage
    const result = calculateMortgage(validatedData);

    void res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      void res.status(400).json({
        status: 'error',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    } else {
      void res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong'
      });
    }
  }
};