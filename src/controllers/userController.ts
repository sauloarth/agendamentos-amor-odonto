import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { listUsers, updateUserRole } from '../services/userService';
import { ListUsersQuery, UpdateUserRoleInput } from '../validations/userValidation';
import asyncHandler from '../utils/asyncHandler';

const list = asyncHandler(async (req: Request, res: Response) => {
  const users = await listUsers(req.query as ListUsersQuery);
  res.json(users);
});

const updateRole = asyncHandler(
  async (req: Request<ParamsDictionary, {}, UpdateUserRoleInput>, res: Response) => {
    const user = await updateUserRole(req.params.id, req.body);
    res.json(user);
  }
);

export { list, updateRole };
