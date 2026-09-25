import express from 'express';
import { list, updateRole } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { listUsersQuerySchema, updateUserRoleSchema } from '../validations/userValidation';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), validateQuery(listUsersQuerySchema), list);
router.patch('/:id/role', authenticate, authorize('admin'), validateBody(updateUserRoleSchema), updateRole);

export default router;
