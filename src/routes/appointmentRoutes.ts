import express from 'express';
import { create, list, getOne, cancel } from '../controllers/appointmentController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createAppointmentSchema, cancelAppointmentSchema } from '../validations/appointmentValidation';

const router = express.Router();

router.post('/', authenticate, authorize('client'), validateBody(createAppointmentSchema), create);
router.get('/', authenticate, authorize('client', 'professional', 'admin'), list);
router.get('/:id', authenticate, authorize('client', 'professional', 'admin'), getOne);
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('client', 'professional', 'admin'),
  validateBody(cancelAppointmentSchema),
  cancel
);

export default router;
