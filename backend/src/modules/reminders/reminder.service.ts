import { prisma } from '@/config/prisma';
import { AppError } from '@/common/AppError';
import { Prisma } from '@prisma/client';

export class ReminderService {
  static async list(organizationId: string, status?: string) {
    return prisma.reminder.findMany({
      where: { organizationId, ...(status ? { status: status as never } : {}) },
      orderBy: { dueAt: 'asc' },
      include: { client: { select: { id: true, fullName: true } } },
    });
  }

  static async listToday(organizationId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return prisma.reminder.findMany({
      where: { organizationId, status: 'PENDIENTE', dueAt: { gte: start, lte: end } },
      orderBy: { dueAt: 'asc' },
      include: { client: { select: { id: true, fullName: true } } },
    });
  }

  static async create(organizationId: string, userId: string, data: Record<string, unknown>) {
    return prisma.reminder.create({
      data: { ...data, organizationId, userId } as Prisma.ReminderUncheckedCreateInput,
    });
  }

  static async createQuick(
    organizationId: string,
    userId: string,
    data: { clientId?: string; quoteId?: string; title: string; daysFromNow: number }
  ) {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + data.daysFromNow);

    return prisma.reminder.create({
      data: {
        organizationId,
        userId,
        clientId: data.clientId,
        quoteId: data.quoteId,
        title: data.title,
        dueAt,
      },
    });
  }

  static async update(organizationId: string, id: string, data: Record<string, unknown>) {
    const existing = await prisma.reminder.findFirst({ where: { id, organizationId } });
    if (!existing) throw AppError.notFound('Recordatorio no encontrado.');
    return prisma.reminder.update({ where: { id }, data: data as Prisma.ReminderUpdateInput });
  }

  static async remove(organizationId: string, id: string) {
    const existing = await prisma.reminder.findFirst({ where: { id, organizationId } });
    if (!existing) throw AppError.notFound('Recordatorio no encontrado.');
    await prisma.reminder.delete({ where: { id } });
  }
}
