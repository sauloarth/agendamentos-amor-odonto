import express from 'express';
import { updateRole } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateUserRoleSchema } from '../validations/userValidation';

const router = express.Router();

router.patch('/:id/role', authenticate, authorize('admin'), validateBody(updateUserRoleSchema), updateRole);

export default router;
