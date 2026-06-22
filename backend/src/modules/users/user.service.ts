import { prisma } from '@/config/prisma';
import { AppError } from '@/common/AppError';
import { hashPassword, comparePassword } from '@/utils/crypto';
import { PlanLimitService } from '@/modules/plans/plan-limit.service';

const SAFE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const;

export class UserService {
  static async list(organizationId: string) {
    return prisma.user.findMany({
      where: { organizationId },
      select: SAFE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  static async create(
    organizationId: string,
    data: { fullName: string; email: string; password: string; role: 'ADMIN' | 'VENDEDOR' | 'OPERADOR' }
  ) {
    await PlanLimitService.assertCanAddUser(organizationId);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw AppError.conflict('Ya existe un usuario con ese correo.');

    const passwordHash = await hashPassword(data.password);

    return prisma.user.create({
      data: { organizationId, fullName: data.fullName, email: data.email, passwordHash, role: data.role },
      select: SAFE_SELECT,
    });
  }

  static async update(
    organizationId: string,
    userId: string,
    data: { fullName?: string; role?: 'ADMIN' | 'VENDEDOR' | 'OPERADOR'; isActive?: boolean }
  ) {
    const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) throw AppError.notFound('Usuario no encontrado en esta organización.');

    return prisma.user.update({ where: { id: userId }, data, select: SAFE_SELECT });
  }

  static async remove(organizationId: string, userId: string, requesterId: string) {
    if (userId === requesterId) {
      throw AppError.badRequest('No puedes eliminar tu propia cuenta de usuario.');
    }
    const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) throw AppError.notFound('Usuario no encontrado en esta organización.');

    // Desactivar en lugar de borrar, para preservar integridad de datos históricos (cotizaciones creadas, etc.)
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  }

  static async changeMyPassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('Usuario no encontrado.');

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) throw AppError.badRequest('La contraseña actual es incorrecta.');

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}
