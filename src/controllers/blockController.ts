import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { createBlock, listBlocks, getBlockById, updateBlock } from '../services/blockService';
import { CreateBlockInput, UpdateBlockInput } from '../validations/blockValidation';
import asyncHandler from '../utils/asyncHandler';

const create = asyncHandler(async (req: Request<{}, {}, CreateBlockInput>, res: Response) => {
  const block = await createBlock(req.body, req.user!);
  res.status(201).json(block);
});

const list = asyncHandler(async (req: Request, res: Response) => {
  const blocks = await listBlocks(req.user!);
  res.json(blocks);
});

const getOne = asyncHandler(async (req: Request, res: Response) => {
  const block = await getBlockById(req.params.id, req.user!);
  res.json(block);
});

const update = asyncHandler(
  async (req: Request<ParamsDictionary, {}, UpdateBlockInput>, res: Response) => {
    const block = await updateBlock(req.params.id, req.body, req.user!);
    res.json(block);
  }
);

export { create, list, getOne, update };
