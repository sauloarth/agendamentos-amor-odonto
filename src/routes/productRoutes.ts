import express from 'express';
import { create, list, getOne, update } from '../controllers/productController';
import { authenticate, authenticateOptional, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../validations/productValidation';

const router = express.Router();

router.get('/', authenticateOptional, list);
router.get('/:id', authenticateOptional, getOne);
router.post('/', authenticate, authorize('admin'), validateBody(createProductSchema), create);
router.patch('/:id', authenticate, authorize('admin'), validateBody(updateProductSchema), update);

export default router;
