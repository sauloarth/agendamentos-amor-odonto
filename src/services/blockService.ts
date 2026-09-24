import Block, { IBlock } from '../models/Block';
import User, { IUser } from '../models/User';
import AppError from '../utils/AppError';
import { CreateBlockInput, UpdateBlockInput } from '../validations/blockValidation';

const assertProfessionalExists = async (professionalId: string): Promise<void> => {
  const professional = await User.findById(professionalId);
  if (!professional || professional.role !== 'professional') {
    throw new AppError('Profissional inválido', 400);
  }
};

const assertOwnership = (block: IBlock, requester: IUser): void => {
  const isAdmin = requester.role === 'admin';
  const owns = block.professional?.toString() === requester._id.toString();

  if (!isAdmin && !owns) {
    throw new AppError('Bloqueio não encontrado', 404);
  }
};

const createBlock = async (input: CreateBlockInput, requester: IUser): Promise<IBlock> => {
  const payload: Record<string, unknown> = { ...input };

  if (requester.role === 'professional') {
    if (input.professional && input.professional !== requester._id.toString()) {
      throw new AppError('Profissionais só podem criar bloqueios para si mesmos', 403);
    }
    payload.professional = requester._id;
  } else if (input.professional) {
    await assertProfessionalExists(input.professional);
    payload.professional = input.professional;
  }

  return Block.create(payload);
};

const listBlocks = async (requester: IUser): Promise<IBlock[]> => {
  const filter = requester.role === 'admin' ? {} : { professional: requester._id };
  return Block.find(filter).sort({ createdAt: -1 });
};

const getBlockById = async (id: string, requester: IUser): Promise<IBlock> => {
  const block = await Block.findById(id);

  if (!block) {
    throw new AppError('Bloqueio não encontrado', 404);
  }

  assertOwnership(block, requester);

  return block;
};

const updateBlock = async (id: string, input: UpdateBlockInput, requester: IUser): Promise<IBlock> => {
  const existing = await Block.findById(id);

  if (!existing) {
    throw new AppError('Bloqueio não encontrado', 404);
  }

  assertOwnership(existing, requester);

  if (requester.role !== 'admin' && input.professional !== undefined) {
    throw new AppError('Profissionais não podem alterar o profissional responsável', 403);
  }
  if (requester.role === 'admin' && input.professional) {
    await assertProfessionalExists(input.professional);
  }

  if (existing.type === 'single') {
    const start = input.startDateTime ?? existing.startDateTime!;
    const end = input.endDateTime ?? existing.endDateTime!;
    if (end <= start) {
      throw new AppError('endDateTime deve ser posterior a startDateTime', 400);
    }
  } else {
    const start = input.startTime ?? existing.startTime!;
    const end = input.endTime ?? existing.endTime!;
    if (end <= start) {
      throw new AppError('endTime deve ser posterior a startTime', 400);
    }

    const validFrom = input.validFrom ?? existing.validFrom;
    const validUntil = input.validUntil ?? existing.validUntil;
    if (validFrom && validUntil && validUntil <= validFrom) {
      throw new AppError('validUntil deve ser posterior a validFrom', 400);
    }
  }

  const block = await Block.findByIdAndUpdate(id, input, { new: true, runValidators: true });

  if (!block) {
    throw new AppError('Bloqueio não encontrado', 404);
  }

  return block;
};

export { createBlock, listBlocks, getBlockById, updateBlock };
