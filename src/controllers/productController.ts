import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
} from '../services/productService';
import { CreateProductInput, UpdateProductInput } from '../validations/productValidation';
import asyncHandler from '../utils/asyncHandler';

const create = asyncHandler(async (req: Request<{}, {}, CreateProductInput>, res: Response) => {
  const product = await createProduct(req.body);
  res.status(201).json(product);
});

const list = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.user?.role === 'admin';
  const products = await listProducts(isAdmin);
  res.json(products);
});

const getOne = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.user?.role === 'admin';
  const product = await getProductById(req.params.id, isAdmin);
  res.json(product);
});

const update = asyncHandler(
  async (req: Request<ParamsDictionary, {}, UpdateProductInput>, res: Response) => {
    const product = await updateProduct(req.params.id, req.body);
    res.json(product);
  }
);

export { create, list, getOne, update };
