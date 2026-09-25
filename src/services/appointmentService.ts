import Appointment, { IAppointment } from '../models/Appointment';
import Product, { IProduct } from '../models/Product';
import Block, { IBlock } from '../models/Block';
import User, { IUser } from '../models/User';
import AppError from '../utils/AppError';
import { CreateAppointmentInput, CancelAppointmentInput } from '../validations/appointmentValidation';

const CLIENT_POPULATE_FIELDS = 'name email phone';
const PROFESSIONAL_POPULATE_FIELDS = 'name email phone';
const PRODUCT_POPULATE_FIELDS = 'name durationMinutes price';

const populateAppointment = (appointment: IAppointment) =>
  appointment
    .populate('client', CLIENT_POPULATE_FIELDS)
    .then((a) => a.populate('professional', PROFESSIONAL_POPULATE_FIELDS))
    .then((a) => a.populate('product', PRODUCT_POPULATE_FIELDS));

const assertProfessionalOffersProduct = (product: IProduct, professionalId: string): void => {
  const offers = product.professionals.some((p) => p.toString() === professionalId);
  if (!offers) {
    throw new AppError('Profissional não realiza este produto', 400);
  }
};

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

const assertSlotAvailable = async (
  professionalId: string,
  startDateTime: Date,
  endDateTime: Date
): Promise<void> => {
  const conflictingAppointment = await Appointment.findOne({
    professional: professionalId,
    status: 'scheduled',
    startDateTime: { $lt: endDateTime },
    endDateTime: { $gt: startDateTime },
  });
  if (conflictingAppointment) {
    throw new AppError('Horário indisponível para este profissional', 409);
  }

  const candidateBlocks = await Block.find({
    active: true,
    $or: [{ professional: null }, { professional: professionalId }],
  });

  const hasBlockConflict = candidateBlocks.some((block) => isBlockConflicting(block, startDateTime, endDateTime));
  if (hasBlockConflict) {
    throw new AppError('Horário indisponível para este profissional', 409);
  }
};

const assertOwnership = (appointment: IAppointment, requester: IUser): void => {
  const isAdmin = requester.role === 'admin';
  const isClient = appointment.client.toString() === requester._id.toString();
  const isProfessional = appointment.professional.toString() === requester._id.toString();

  if (!isAdmin && !isClient && !isProfessional) {
    throw new AppError('Agendamento não encontrado', 404);
  }
};

const createAppointment = async (input: CreateAppointmentInput, requester: IUser): Promise<IAppointment> => {
  const product = await Product.findById(input.productId);
  if (!product) {
    throw new AppError('Produto não encontrado', 404);
  }
  if (!product.active) {
    throw new AppError('Produto indisponível para agendamento', 400);
  }

  assertProfessionalOffersProduct(product, input.professionalId);

  const professional = await User.findById(input.professionalId);
  if (!professional || professional.role !== 'professional') {
    throw new AppError('Profissional inválido', 400);
  }

  const startDateTime = input.startDateTime;
  const endDateTime = new Date(startDateTime.getTime() + product.durationMinutes * 60000);

  if (endDateTime.toDateString() !== startDateTime.toDateString()) {
    throw new AppError('O horário do agendamento não pode ultrapassar a meia-noite', 400);
  }

  await assertSlotAvailable(input.professionalId, startDateTime, endDateTime);

  const appointment = await Appointment.create({
    client: requester._id,
    professional: input.professionalId,
    product: input.productId,
    startDateTime,
    endDateTime,
    status: 'scheduled',
  });

  return populateAppointment(appointment);
};

interface AppointmentFilters {
  professionalId?: string;
  status?: 'scheduled' | 'cancelled';
}

const listAppointments = async (requester: IUser, filters: AppointmentFilters = {}): Promise<IAppointment[]> => {
  const filter: Record<string, unknown> = {};

  if (requester.role === 'admin') {
    if (filters.professionalId) {
      filter.professional = filters.professionalId;
    }
  } else if (requester.role === 'professional') {
    filter.professional = requester._id;
  } else {
    filter.client = requester._id;
  }

  if (filters.status) {
    filter.status = filters.status;
  }

  return Appointment.find(filter)
    .sort({ startDateTime: -1 })
    .populate('client', CLIENT_POPULATE_FIELDS)
    .populate('professional', PROFESSIONAL_POPULATE_FIELDS)
    .populate('product', PRODUCT_POPULATE_FIELDS);
};

const getAppointmentById = async (id: string, requester: IUser): Promise<IAppointment> => {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  assertOwnership(appointment, requester);

  return populateAppointment(appointment);
};

const cancelAppointment = async (
  id: string,
  input: CancelAppointmentInput,
  requester: IUser
): Promise<IAppointment> => {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  assertOwnership(appointment, requester);

  if (appointment.status === 'cancelled') {
    throw new AppError('Agendamento já está cancelado', 400);
  }

  appointment.status = 'cancelled';
  appointment.cancelReason = input.cancelReason;
  await appointment.save();

  return populateAppointment(appointment);
};

export { createAppointment, listAppointments, getAppointmentById, cancelAppointment };
