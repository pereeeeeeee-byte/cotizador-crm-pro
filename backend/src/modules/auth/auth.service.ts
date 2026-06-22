import { prisma } from '@/config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/common/AppError';
import { hashPassword, comparePassword, generateSecureToken, hashToken } from '@/utils/crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { MailService } from '@/utils/mail';
import { RegisterInput, LoginInput } from './auth.schemas';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'empresa'
  );
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  const base = slugify(baseName);
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.organization.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${++counter}`;
  }
}

export class AuthService {
  /**
   * Registro de una nueva cuenta. Crea, en una sola transacción:
   * - Organization (el tenant)
   * - Branding por defecto
   * - Plan FREE (o el solicitado) + Subscription en TRIAL de 14 días
   * - QuoteCounter en 0
   * - User ADMIN (el primer usuario siempre es admin de su organización)
   */
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
      throw AppError.conflict('Ya existe una cuenta registrada con ese correo.');
    }

    const plan = await prisma.plan.findUnique({
      where: { code: input.planCode ?? 'FREE' },
    });
    if (!plan) {
      throw AppError.badRequest('El plan especificado no existe.');
    }

    const slug = await generateUniqueSlug(input.organizationName);
    const passwordHash = await hashPassword(input.password);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const organization = await tx.organization.create({
        data: { name: input.organizationName, slug },
      });

      await tx.branding.create({
        data: {
          organizationId: organization.id,
          responsibleName: input.fullName,
          email: input.email,
        },
      });

      await tx.quoteCounter.create({
        data: { organizationId: organization.id, lastNumber: 0 },
      });

      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId: plan.id,
          status: 'TRIAL',
          trialEndsAt,
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          fullName: input.fullName,
          email: input.email,
          passwordHash,
          role: 'ADMIN',
        },
      });

      return { organization, user };
    });

    // Token de verificación de correo (fuera de la transacción: no es crítico)
    const verificationToken = generateSecureToken();
    await prisma.emailVerificationToken.create({
      data: {
        userId: result.user.id,
        tokenHash: hashToken(verificationToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    await MailService.sendVerificationEmail(result.user.email, verificationToken);

    return this.issueTokensForUser(result.user.id, result.organization.id, result.user.role);
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Correo o contraseña incorrectos.');
    }

    const validPassword = await comparePassword(input.password, user.passwordHash);
    if (!validPassword) {
      throw AppError.unauthorized('Correo o contraseña incorrectos.');
    }

    return this.issueTokensForUser(user.id, user.organizationId, user.role);
  }

  static async issueTokensForUser(userId: string, organizationId: string, role: 'ADMIN' | 'VENDEDOR' | 'OPERADOR') {
    const accessToken = signAccessToken({ sub: userId, organizationId, role });

    const jti = generateSecureToken();
    const refreshToken = signRefreshToken({ sub: userId, jti });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.refreshToken.create({
      data: { userId, tokenHash: hashToken(refreshToken), expiresAt },
    });

    return { accessToken, refreshToken };
  }

  static async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Refresh token inválido o expirado.');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token inválido, expirado o revocado.');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Usuario no encontrado o inactivo.');
    }

    // Rotación: revocamos el token usado y emitimos uno nuevo
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokensForUser(user.id, user.organizationId, user.role);
  }

  static async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  static async verifyEmail(token: string) {
    const tokenHash = hashToken(token);
    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw AppError.badRequest('El enlace de verificación es inválido o ha expirado.');
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
      prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // No revelamos si el correo existe o no, por seguridad.
    if (!user) return;

    const token = generateSecureToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    await MailService.sendPasswordResetEmail(user.email, token);
  }

  static async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw AppError.badRequest('El enlace de recuperación es inválido o ha expirado.');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Revocamos todos los refresh tokens activos por seguridad
      prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
