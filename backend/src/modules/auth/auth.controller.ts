import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AppError } from '@/common/AppError';
import { prisma } from '@/config/prisma';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schemas';
import { AuthService } from './auth.service';

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const tokens = await AuthService.register(input);
    res.status(201).json(tokens);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const tokens = await AuthService.login(input);
    res.status(200).json(tokens);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokens = await AuthService.refresh(refreshToken);
    res.status(200).json(tokens);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    await AuthService.logout(refreshToken);
    res.status(204).send();
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const { token } = verifyEmailSchema.parse(req.body);
    await AuthService.verifyEmail(token);
    res.status(200).json({ message: 'Correo verificado correctamente.' });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    await AuthService.forgotPassword(email);
    res.status(200).json({ message: 'Si el correo existe, se enviaron instrucciones de recuperación.' });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await AuthService.resetPassword(token, newPassword);
    res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw AppError.unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: req.auth.sub },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            onboardingDone: true,
            branding: true,
            subscription: { include: { plan: true } },
          },
        },
      },
    });

    if (!user) throw AppError.notFound('Usuario no encontrado.');
    res.status(200).json(user);
  }),
};
