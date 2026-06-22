import { prisma } from '@/config/prisma';
import { AppError } from '@/common/AppError';

export class NotificationService {
  static async list(organizationId: string, onlyUnread = false) {
    return prisma.notification.findMany({
      where: { organizationId, ...(onlyUnread ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async markAsRead(organizationId: string, id: string) {
    const existing = await prisma.notification.findFirst({ where: { id, organizationId } });
    if (!existing) throw AppError.notFound('Notificación no encontrada.');
    return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  static async markAllAsRead(organizationId: string) {
    await prisma.notification.updateMany({
      where: { organizationId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /** Generación automática de notificaciones de sistema: clientes sin seguimiento, cotizaciones por vencer.
   * Pensado para ejecutarse desde un cron/job periódico. */
  static async runSystemChecks(organizationId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const staleClients = await prisma.client.findMany({
      where: {
        organizationId,
        status: { notIn: ['TRABAJO_TERMINADO', 'CLIENTE_PERDIDO'] },
        activities: { every: { occurredAt: { lt: sevenDaysAgo } } },
      },
      take: 20,
    });

    for (const client of staleClients) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          organizationId,
          type: 'CLIENTE_SIN_SEGUIMIENTO',
          link: `/clientes/${client.id}`,
          createdAt: { gte: sevenDaysAgo },
        },
      });
      if (!alreadyNotified) {
        await prisma.notification.create({
          data: {
            organizationId,
            type: 'CLIENTE_SIN_SEGUIMIENTO',
            title: 'Cliente sin seguimiento',
            message: `${client.fullName} no tiene seguimiento hace más de 7 días.`,
            link: `/clientes/${client.id}`,
          },
        });
      }
    }

    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    const expiringQuotes = await prisma.quote.findMany({
      where: {
        organizationId,
        status: { in: ['ENVIADA'] },
        validUntil: { lte: in3Days, gte: new Date() },
      },
      include: { client: true },
      take: 20,
    });

    for (const quote of expiringQuotes) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: { organizationId, type: 'COTIZACION_POR_VENCER', link: `/cotizaciones/${quote.id}` },
      });
      if (!alreadyNotified) {
        await prisma.notification.create({
          data: {
            organizationId,
            type: 'COTIZACION_POR_VENCER',
            title: 'Cotización próxima a vencer',
            message: `La cotización de ${quote.client.fullName} vence pronto.`,
            link: `/cotizaciones/${quote.id}`,
          },
        });
      }
    }
  }
}
