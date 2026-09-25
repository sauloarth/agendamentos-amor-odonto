import express from 'express';
import { register, login, me, updateMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, updateProfileSchema } from '../validations/authValidation';

const router = express.Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateMe);

export default router;
