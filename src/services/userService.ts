import Product from '../models/Product';
import User, { IUser } from '../models/User';
import AppError from '../utils/AppError';
import { UpdateUserRoleInput } from '../validations/userValidation';

const updateUserRole = async (id: string, input: UpdateUserRoleInput): Promise<IUser> => {
  const existing = await User.findById(id);

  if (!existing) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const wasProfessional = existing.role === 'professional';

  const user = await User.findByIdAndUpdate(id, { role: input.role }, { new: true, runValidators: true }).select(
    '-password'
  );

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  if (wasProfessional && input.role !== 'professional') {
    await Product.updateMany({ professionals: id }, { $pull: { professionals: id } });
  }

  return user;
};

export { updateUserRole };
