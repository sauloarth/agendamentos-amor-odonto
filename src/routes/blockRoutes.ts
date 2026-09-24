import express from 'express';
import { create, list, getOne, update } from '../controllers/blockController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createBlockSchema, updateBlockSchema } from '../validations/blockValidation';

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'professional'), validateBody(createBlockSchema), create);
router.get('/', authenticate, authorize('admin', 'professional'), list);
router.get('/:id', authenticate, authorize('admin', 'professional'), getOne);
router.patch('/:id', authenticate, authorize('admin', 'professional'), validateBody(updateBlockSchema), update);

export default router;
