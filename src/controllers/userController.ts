import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { updateUserRole } from '../services/userService';
import { UpdateUserRoleInput } from '../validations/userValidation';
import asyncHandler from '../utils/asyncHandler';

const updateRole = asyncHandler(
  async (req: Request<ParamsDictionary, {}, UpdateUserRoleInput>, res: Response) => {
    const user = await updateUserRole(req.params.id, req.body);
    res.json(user);
  }
);

export { updateRole };
