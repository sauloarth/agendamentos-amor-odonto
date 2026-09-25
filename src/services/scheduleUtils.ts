import { IProduct } from '../models/Product';
import { IBlock } from '../models/Block';
import AppError from '../utils/AppError';

const toHHmm = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const isBlockConflicting = (block: IBlock, start: Date, end: Date): boolean => {
  if (block.type === 'single') {
    return block.startDateTime! < end && block.endDateTime! > start;
  }

  const weekday = start.getDay();
  if (!block.daysOfWeek!.includes(weekday)) {
    return false;
  }
  if (block.validFrom && start < block.validFrom) {
    return false;
  }
  if (block.validUntil && start > block.validUntil) {
    return false;
  }

  const startHHmm = toHHmm(start);
  const endHHmm = toHHmm(end);
  return block.startTime! < endHHmm && block.endTime! > startHHmm;
};

const assertProfessionalOffersProduct = (product: IProduct, professionalId: string): void => {
  const offers = product.professionals.some((p) => p.toString() === professionalId);
  if (!offers) {
    throw new AppError('Profissional não realiza este produto', 400);
  }
};

export { toHHmm, isBlockConflicting, assertProfessionalOffersProduct };
