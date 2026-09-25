import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import {
  createAppointment,
  listAppointments,
  getAppointmentById,
  cancelAppointment,
} from '../services/appointmentService';
import { CreateAppointmentInput, CancelAppointmentInput } from '../validations/appointmentValidation';
import asyncHandler from '../utils/asyncHandler';

const create = asyncHandler(async (req: Request<{}, {}, CreateAppointmentInput>, res: Response) => {
  const appointment = await createAppointment(req.body, req.user!);
  res.status(201).json(appointment);
});

const list = asyncHandler(async (req: Request, res: Response) => {
  const professionalId = typeof req.query.professional === 'string' ? req.query.professional : undefined;
  const status =
    req.query.status === 'scheduled' || req.query.status === 'cancelled' ? req.query.status : undefined;

  const appointments = await listAppointments(req.user!, { professionalId, status });
  res.json(appointments);
});

const getOne = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await getAppointmentById(req.params.id, req.user!);
  res.json(appointment);
});

const cancel = asyncHandler(
  async (req: Request<ParamsDictionary, {}, CancelAppointmentInput>, res: Response) => {
    const appointment = await cancelAppointment(req.params.id, req.body, req.user!);
    res.json(appointment);
  }
);

export { create, list, getOne, cancel };
