import nodemailer, { Transporter } from 'nodemailer';

interface SendEmailInput {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

interface SendEmailResult {
  messageId: string;
}

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  if (!host) {
    throw new Error('SMTP_HOST não definida nas variáveis de ambiente');
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
};

const sendEmail = async (input: SendEmailInput): Promise<SendEmailResult> => {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM não definida nas variáveis de ambiente');
  }

  const info = await getTransporter().sendMail({ from, ...input });

  return { messageId: info.messageId };
};

export { sendEmail };
export type { SendEmailInput };
