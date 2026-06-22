import { prisma } from '@/config/prisma';
import { AppError } from '@/common/AppError';
import { Prisma } from '@prisma/client';

export class ActivityService {
  static async listByClient(organizationId: string, clientId: string) {
    const client = await prisma.client.findFirst({ where: { id: clientId, organizationId } });
    if (!client) throw AppError.notFound('Cliente no encontrado.');

    return prisma.activity.findMany({
      where: { organizationId, clientId },
      orderBy: { occurredAt: 'desc' },
      include: { user: { select: { id: true, fullName: true } } },
    });
  }

  static async create(organizationId: string, userId: string, data: Record<string, unknown>) {
    const clientId = data.clientId as string;
    const client = await prisma.client.findFirst({ where: { id: clientId, organizationId } });
    if (!client) throw AppError.badRequest('El cliente especificado no existe en esta organización.');

    return prisma.activity.create({
      data: { ...data, organizationId, userId } as Prisma.ActivityUncheckedCreateInput,
    });
  }

  static async remove(organizationId: string, id: string) {
    const existing = await prisma.activity.findFirst({ where: { id, organizationId } });
    if (!existing) throw AppError.notFound('Actividad no encontrada.');
    await prisma.activity.delete({ where: { id } });
  }

  /** Clientes sin seguimiento hace N días (para notificaciones / dashboard) */
  static async getClientsWithoutFollowUp(organizationId: string, days: number) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    return prisma.client.findMany({
      where: {
        organizationId,
        status: { notIn: ['TRABAJO_TERMINADO', 'CLIENTE_PERDIDO'] },
        OR: [
          { activities: { none: {} } },
          { activities: { every: { occurredAt: { lt: threshold } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
