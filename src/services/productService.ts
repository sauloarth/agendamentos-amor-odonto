import Product, { IProduct } from '../models/Product';
import AppError from '../utils/AppError';
import { CreateProductInput, UpdateProductInput } from '../validations/productValidation';

const createProduct = async (input: CreateProductInput): Promise<IProduct> => {
  return Product.create(input);
};

const listProducts = async (isAdmin: boolean): Promise<IProduct[]> => {
  const filter = isAdmin ? {} : { active: true };
  return Product.find(filter).sort({ name: 1 });
};

const getProductById = async (id: string, isAdmin: boolean): Promise<IProduct> => {
  const product = await Product.findById(id);

  if (!product || (!product.active && !isAdmin)) {
    throw new AppError('Produto não encontrado', 404);
  }

  return product;
};

const updateProduct = async (id: string, input: UpdateProductInput): Promise<IProduct> => {
  const product = await Product.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new AppError('Produto não encontrado', 404);
  }

  return product;
};

export { createProduct, listProducts, getProductById, updateProduct };
