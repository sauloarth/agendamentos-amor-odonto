import User, { IUser } from '../models/User';
import AppError from '../utils/AppError';
import { UpdateUserRoleInput } from '../validations/userValidation';

const updateUserRole = async (id: string, input: UpdateUserRoleInput): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(id, { role: input.role }, { new: true, runValidators: true }).select(
    '-password'
  );

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  return user;
};

export { updateUserRole };
