import express from 'express';
import { getAvailability } from '../controllers/availabilityController';
import { authenticateOptional } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { getAvailabilitySchema } from '../validations/availabilityValidation';

const router = express.Router();

router.get('/', authenticateOptional, validateQuery(getAvailabilitySchema), getAvailability);

export default router;
