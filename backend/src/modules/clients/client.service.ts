import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { AppError } from '@/common/AppError';
import { PlanLimitService } from '@/modules/plans/plan-limit.service';

interface ListClientsParams {
  search?: string;
  status?: string;
  source?: string;
  page: number;
  pageSize: number;
}

export class ClientService {
  /**
   * Listado liviano (solo campos necesarios para mostrar en un buscador/
   * selector) de TODOS los clientes de la organización, sin paginar. Usado
   * por el formulario de cotización para alimentar el autocompletado por
   * escritura sin traer notas, direcciones ni conteos innecesarios.
   */
  static async listAllLight(organizationId: string) {
    return prisma.client.findMany({
      where: { organizationId },
      select: { id: true, fullName: true, phone: true, email: true, status: true },
      orderBy: { fullName: 'asc' },
    });
  }

  static async list(organizationId: string, params: ListClientsParams) {
    const where: Prisma.ClientWhereInput = { organizationId };

    if (params.status) where.status = params.status as never;
    if (params.source) where.source = params.source as never;
    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: { _count: { select: { quotes: true, activities: true } } },
      }),
      prisma.client.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize, totalPages: Math.ceil(total / params.pageSize) };
  }

  static async getById(organizationId: string, id: string) {
    const client = await prisma.client.findFirst({
      where: { id, organizationId },
      include: {
        quotes: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { occurredAt: 'desc' } },
        reminders: { orderBy: { dueAt: 'asc' } },
      },
    });
    if (!client) throw AppError.notFound('Cliente no encontrado.');
    return client;
  }

  static async create(organizationId: string, data: Record<string, unknown>) {
    await PlanLimitService.assertCanAddClient(organizationId);

    const client = await prisma.client.create({
      data: { ...data, organizationId } as Prisma.ClientUncheckedCreateInput,
    });

    await prisma.notification.create({
      data: {
        organizationId,
        type: 'NUEVO_CLIENTE',
        title: 'Nuevo cliente agregado',
        message: `Se registró el cliente "${client.fullName}".`,
        link: `/clientes/${client.id}`,
      },
    });

    return client;
  }

  static async update(organizationId: string, id: string, data: Record<string, unknown>) {
    const exists = await prisma.client.findFirst({ where: { id, organizationId } });
    if (!exists) throw AppError.notFound('Cliente no encontrado.');

    return prisma.client.update({ where: { id }, data: data as Prisma.ClientUpdateInput });
  }

  static async remove(organizationId: string, id: string) {
    const exists = await prisma.client.findFirst({ where: { id, organizationId } });
    if (!exists) throw AppError.notFound('Cliente no encontrado.');

    await prisma.client.delete({ where: { id } });
  }
}
