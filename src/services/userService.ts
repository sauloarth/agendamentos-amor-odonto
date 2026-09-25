import Product from '../models/Product';
import User, { IUser } from '../models/User';
import AppError from '../utils/AppError';
import { ListUsersQuery, UpdateUserRoleInput } from '../validations/userValidation';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listUsers = async ({ role, search }: ListUsersQuery): Promise<IUser[]> => {
  const filter: Record<string, unknown> = {};
  if (role) {
    filter.role = role;
  }
  const term = search?.trim();
  if (term) {
    const pattern = new RegExp(escapeRegex(term), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  return User.find(filter).select('-password').sort({ name: 1 });
};

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

export { listUsers, updateUserRole };
