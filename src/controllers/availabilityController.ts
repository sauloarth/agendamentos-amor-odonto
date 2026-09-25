import { Request, Response } from 'express';
import { getAvailableSlots } from '../services/availabilityService';
import { getAvailabilitySchema } from '../validations/availabilityValidation';
import asyncHandler from '../utils/asyncHandler';

const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const query = getAvailabilitySchema.parse(req.query);
  const slots = await getAvailableSlots(query);
  res.json(slots);
});

export { getAvailability };
