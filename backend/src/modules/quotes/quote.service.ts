import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { AppError } from '@/common/AppError';
import { PlanLimitService } from '@/modules/plans/plan-limit.service';

interface CreateQuoteInput {
  clientId: string;
  serviceId?: string;
  description: string;
  basePrice: number;
  discount: number;
  paymentTerms?: string;
  validUntil?: Date;
  status: 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA';
}

interface ListQuotesParams {
  search?: string;
  status?: string;
  clientId?: string;
  page: number;
  pageSize: number;
}

export class QuoteService {
  /**
   * Obtiene el siguiente número correlativo para la organización de forma
   * atómica, usando una transacción con incremento sobre QuoteCounter. Esto
   * evita colisiones de número si dos cotizaciones se crean al mismo tiempo.
   */
  private static async getNextQuoteNumber(tx: Prisma.TransactionClient, organizationId: string): Promise<number> {
    const counter = await tx.quoteCounter.update({
      where: { organizationId },
      data: { lastNumber: { increment: 1 } },
    });
    return counter.lastNumber;
  }

  static async create(organizationId: string, createdById: string, input: CreateQuoteInput) {
    await PlanLimitService.assertCanCreateQuote(organizationId);

    const client = await prisma.client.findFirst({ where: { id: input.clientId, organizationId } });
    if (!client) throw AppError.badRequest('El cliente especificado no existe en esta organización.');

    if (input.serviceId) {
      const service = await prisma.service.findFirst({ where: { id: input.serviceId, organizationId } });
      if (!service) throw AppError.badRequest('El servicio especificado no existe en esta organización.');
    }

    const finalPrice = Math.max(0, input.basePrice - input.discount);

    const quote = await prisma.$transaction(async (tx) => {
      const number = await this.getNextQuoteNumber(tx, organizationId);

      return tx.quote.create({
        data: {
          organizationId,
          number,
          clientId: input.clientId,
          serviceId: input.serviceId,
          description: input.description,
          basePrice: input.basePrice,
          discount: input.discount,
          finalPrice,
          paymentTerms: input.paymentTerms,
          validUntil: input.validUntil,
          status: input.status,
          createdById,
        },
        include: { client: true, service: true },
      });
    });

    // Actualiza el estado del cliente a "COTIZADO" si estaba en "NUEVO"
    if (client.status === 'NUEVO') {
      await prisma.client.update({ where: { id: client.id }, data: { status: 'COTIZADO' } });
    }

    return quote;
  }

  static async list(organizationId: string, params: ListQuotesParams) {
    const where: Prisma.QuoteWhereInput = { organizationId };

    if (params.status) where.status = params.status as never;
    if (params.clientId) where.clientId = params.clientId;
    if (params.search) {
      where.OR = [
        { description: { contains: params.search, mode: 'insensitive' } },
        { client: { fullName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: { client: true, service: true },
      }),
      prisma.quote.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize, totalPages: Math.ceil(total / params.pageSize) };
  }

  static async getById(organizationId: string, id: string) {
    const quote = await prisma.quote.findFirst({
      where: { id, organizationId },
      include: { client: true, service: true, activities: true, createdBy: { select: { id: true, fullName: true } } },
    });
    if (!quote) throw AppError.notFound('Cotización no encontrada.');
    return quote;
  }

  static async update(organizationId: string, id: string, input: Partial<CreateQuoteInput>) {
    const existing = await prisma.quote.findFirst({ where: { id, organizationId } });
    if (!existing) throw AppError.notFound('Cotización no encontrada.');

    const basePrice = input.basePrice ?? Number(existing.basePrice);
    const discount = input.discount ?? Number(existing.discount);
    const finalPrice = Math.max(0, basePrice - discount);

    return prisma.quote.update({
      where: { id },
      data: { ...input, basePrice, discount, finalPrice },
      include: { client: true, service: true },
    });
  }

  static async duplicate(organizationId: string, id: string, createdById: string) {
    const original = await prisma.quote.findFirst({ where: { id, organizationId } });
    if (!original) throw AppError.notFound('Cotización no encontrada.');

    return this.create(organizationId, createdById, {
      clientId: original.clientId,
      serviceId: original.serviceId ?? undefined,
      description: original.description,
      basePrice: Number(original.basePrice),
      discount: Number(original.discount),
      paymentTerms: original.paymentTerms ?? undefined,
      validUntil: original.validUntil ?? undefined,
      status: 'BORRADOR',
    });
  }

  static async remove(organizationId: string, id: string) {
    const existing = await prisma.quote.findFirst({ where: { id, organizationId } });
    if (!existing) throw AppError.notFound('Cotización no encontrada.');
    await prisma.quote.delete({ where: { id } });
  }

  static async setPdfUrl(id: string, pdfUrl: string) {
    return prisma.quote.update({ where: { id }, data: { pdfUrl } });
  }
}
