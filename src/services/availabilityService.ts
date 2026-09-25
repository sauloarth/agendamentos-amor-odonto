import Appointment from '../models/Appointment';
import Product from '../models/Product';
import Block from '../models/Block';
import User from '../models/User';
import AppError from '../utils/AppError';
import { GetAvailabilityInput } from '../validations/availabilityValidation';
import { assertProfessionalOffersProduct, isBlockConflicting } from './scheduleUtils';

interface AvailableSlot {
  startDateTime: Date;
  endDateTime: Date;
}

const startOfNextDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + 1);
  return next;
};

const getAvailableSlots = async (input: GetAvailabilityInput): Promise<AvailableSlot[]> => {
  const { professionalId, productId, dateStart, dateEnd } = input;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Produto não encontrado', 404);
  }
  if (!product.active) {
    throw new AppError('Produto indisponível para agendamento', 400);
  }

  assertProfessionalOffersProduct(product, professionalId);

  const professional = await User.findById(professionalId);
  if (!professional || professional.role !== 'professional') {
    throw new AppError('Profissional inválido', 400);
  }

  const durationMs = product.durationMinutes * 60000;

  const [appointments, blocks] = await Promise.all([
    Appointment.find({
      professional: professionalId,
      status: 'scheduled',
      startDateTime: { $lt: dateEnd },
      endDateTime: { $gt: dateStart },
    }),
    Block.find({
      active: true,
      $or: [{ professional: null }, { professional: professionalId }],
    }),
  ]);

  const slots: AvailableSlot[] = [];
  let cursor = new Date(dateStart);
  const now = Date.now();

  while (cursor.getTime() + durationMs <= dateEnd.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + durationMs);

    if (slotEnd.toDateString() !== slotStart.toDateString()) {
      cursor = startOfNextDay(slotStart);
      continue;
    }

    if (slotStart.getTime() <= now) {
      cursor = slotEnd;
      continue;
    }

    const hasAppointmentConflict = appointments.some(
      (a) => a.startDateTime < slotEnd && a.endDateTime > slotStart
    );
    const hasBlockConflict = !hasAppointmentConflict && blocks.some((b) => isBlockConflicting(b, slotStart, slotEnd));

    if (!hasAppointmentConflict && !hasBlockConflict) {
      slots.push({ startDateTime: slotStart, endDateTime: slotEnd });
    }

    cursor = slotEnd;
  }

  return slots;
};

export { getAvailableSlots };
