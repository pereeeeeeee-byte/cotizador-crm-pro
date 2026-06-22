import { z } from 'zod';

export const createUserSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'VENDEDOR', 'OPERADOR']).default('VENDEDOR'),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  role: z.enum(['ADMIN', 'VENDEDOR', 'OPERADOR']).optional(),
  isActive: z.boolean().optional(),
});

export const changeMyPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
