import nodemailer from 'nodemailer';
import { env } from '@/config/env';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
});

async function send(to: string, subject: string, html: string) {
  if (!env.smtp.host) {
    // En desarrollo sin SMTP configurado, solo logueamos el correo.
    // eslint-disable-next-line no-console
    console.log(`\n[EMAIL SIMULADO] Para: ${to}\nAsunto: ${subject}\n${html}\n`);
    return;
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, html });
}

export const MailService = {
  async sendVerificationEmail(to: string, token: string) {
    const link = `${env.frontendUrl}/verificar-correo?token=${token}`;
    await send(
      to,
      'Verifica tu correo - Cotizador CRM Pro',
      `<p>Hola,</p><p>Confirma tu correo haciendo clic en el siguiente enlace:</p><p><a href="${link}">${link}</a></p>`
    );
  },

  async sendPasswordResetEmail(to: string, token: string) {
    const link = `${env.frontendUrl}/restablecer-password?token=${token}`;
    await send(
      to,
      'Recupera tu contraseña - Cotizador CRM Pro',
      `<p>Hola,</p><p>Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, haz clic aquí:</p><p><a href="${link}">${link}</a></p><p>Si no fuiste tú, ignora este correo.</p>`
    );
  },
};
