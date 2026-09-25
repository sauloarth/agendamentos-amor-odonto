import { IAppointment } from '../models/Appointment';
import { IProduct } from '../models/Product';
import { IUser } from '../models/User';
import { sendEmail } from './emailService';

interface AppointmentDetails {
  client: IUser;
  professionalName: string;
  productName: string;
  when: string;
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Espera o agendamento já populado (ver populateAppointment em appointmentService).
const getDetails = (appointment: IAppointment): AppointmentDetails => ({
  client: appointment.client as unknown as IUser,
  professionalName: (appointment.professional as unknown as IUser).name,
  productName: (appointment.product as unknown as IProduct).name,
  when: appointment.startDateTime.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' }),
});

const buildBody = (intro: string, details: AppointmentDetails, extraLines: string[] = []) => {
  const lines = [
    `Procedimento: ${details.productName}`,
    `Profissional: ${details.professionalName}`,
    `Data e horário: ${details.when}`,
    ...extraLines,
  ];
  const greeting = `Olá, ${details.client.name}!`;

  return {
    text: [greeting, '', intro, '', ...lines].join('\n'),
    html: `<p>${escapeHtml(greeting)}</p><p>${escapeHtml(intro)}</p><ul>${lines
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join('')}</ul>`,
  };
};

// Falhas de envio não devem desfazer nem falhar o agendamento: apenas são logadas.
const safeSend = async (to: string, subject: string, body: { text: string; html: string }): Promise<void> => {
  try {
    await sendEmail({ to, subject, ...body });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Erro ao enviar e-mail "${subject}" para ${to}:`, message);
  }
};

const notifyAppointmentCreated = async (appointment: IAppointment): Promise<void> => {
  const details = getDetails(appointment);
  const body = buildBody('Seu agendamento foi confirmado.', details);

  await safeSend(details.client.email, 'Agendamento confirmado', body);
};

const notifyAppointmentCancelled = async (appointment: IAppointment): Promise<void> => {
  const details = getDetails(appointment);
  const extraLines = appointment.cancelReason ? [`Motivo: ${appointment.cancelReason}`] : [];
  const body = buildBody('Seu agendamento foi cancelado.', details, extraLines);

  await safeSend(details.client.email, 'Agendamento cancelado', body);
};

export { notifyAppointmentCreated, notifyAppointmentCancelled };
