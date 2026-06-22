import { z } from 'zod';

export const registerSchema = z.object({
  organizationName: z.string().min(2, 'El nombre de la empresa es muy corto').max(120),
  fullName: z.string().min(2, 'El nombre es muy corto').max(120),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  planCode: z.string().optional(), // si no se especifica, se usa el plan FREE
});

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Correo inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
