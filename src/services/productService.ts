import Product, { IProduct } from '../models/Product';
import User from '../models/User';
import AppError from '../utils/AppError';
import { CreateProductInput, UpdateProductInput } from '../validations/productValidation';

const PROFESSIONAL_POPULATE_FIELDS = 'name email phone role';

const assertProfessionalsExist = async (professionalIds: string[]): Promise<void> => {
  const professionals = await User.find({ _id: { $in: professionalIds }, role: 'professional' });

  if (professionals.length !== new Set(professionalIds).size) {
    throw new AppError('Um ou mais profissionais informados são inválidos', 400);
  }
};

const createProduct = async (input: CreateProductInput): Promise<IProduct> => {
  if (input.professionals) {
    await assertProfessionalsExist(input.professionals);
  }

  const product = await Product.create(input);
  return product.populate('professionals', PROFESSIONAL_POPULATE_FIELDS);
};

const listProducts = async (isAdmin: boolean, professionalId?: string): Promise<IProduct[]> => {
  const filter: Record<string, unknown> = isAdmin ? {} : { active: true };
  if (professionalId) {
    filter.professionals = professionalId;
  }
  return Product.find(filter).sort({ name: 1 }).populate('professionals', PROFESSIONAL_POPULATE_FIELDS);
};

const getProductById = async (id: string, isAdmin: boolean): Promise<IProduct> => {
  const product = await Product.findById(id).populate('professionals', PROFESSIONAL_POPULATE_FIELDS);

  if (!product || (!product.active && !isAdmin)) {
    throw new AppError('Produto não encontrado', 404);
  }

  return product;
};

const updateProduct = async (id: string, input: UpdateProductInput): Promise<IProduct> => {
  if (input.professionals) {
    await assertProfessionalsExist(input.professionals);
  }

  const product = await Product.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  }).populate('professionals', PROFESSIONAL_POPULATE_FIELDS);

  if (!product) {
    throw new AppError('Produto não encontrado', 404);
  }

  return product;
};

export { createProduct, listProducts, getProductById, updateProduct };
