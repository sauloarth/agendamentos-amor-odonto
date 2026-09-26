import express from 'express';
import { register, login, me, updateMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import { registerSchema, loginSchema, updateProfileSchema } from '../validations/authValidation';

const router = express.Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateMe);

export default router;
