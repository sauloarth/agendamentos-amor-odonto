import { Request, Response } from 'express';
import { registerUser, loginUser, updateProfile } from '../services/authService';
import { RegisterInput, LoginInput, UpdateProfileInput } from '../validations/authValidation';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';

const register = asyncHandler(async (req: Request<{}, {}, RegisterInput>, res: Response) => {
  const result = await registerUser(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req: Request<{}, {}, LoginInput>, res: Response) => {
  const result = await loginUser(req.body);
  res.json(result);
});

const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }
  res.json(req.user);
});

const updateMe = asyncHandler(async (req: Request<{}, {}, UpdateProfileInput>, res: Response) => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }
  const user = await updateProfile(req.user._id.toString(), req.body);
  res.json(user);
});

export { register, login, me, updateMe };
