import { prisma } from '@/config/prisma';
import { AppError } from '@/common/AppError';
import { Prisma } from '@prisma/client';

export class ServiceCatalogService {
  static async list(organizationId: string, includeInactive = false) {
    return prisma.service.findMany({
      where: { organizationId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { name: 'asc' },
    });
  }

  static async create(organizationId: string, data: Record<string, unknown>) {
    return prisma.service.create({ data: { ...data, organizationId } as Prisma.ServiceUncheckedCreateInput });
  }

  static async update(organizationId: string, id: string, data: Record<string, unknown>) {
    const exists = await prisma.service.findFirst({ where: { id, organizationId } });
    if (!exists) throw AppError.notFound('Servicio no encontrado.');
    return prisma.service.update({ where: { id }, data: data as Prisma.ServiceUpdateInput });
  }

  static async remove(organizationId: string, id: string) {
    const exists = await prisma.service.findFirst({ where: { id, organizationId } });
    if (!exists) throw AppError.notFound('Servicio no encontrado.');
    // Soft delete: desactivar en lugar de eliminar (puede estar referenciado por cotizaciones)
    await prisma.service.update({ where: { id }, data: { isActive: false } });
  }
}
