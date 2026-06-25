import { Prisma } from '@prisma/client';
import type { QuoteItem, QuoteInstallment } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { AppError } from '@/common/AppError';
import { PlanLimitService } from '@/modules/plans/plan-limit.service';
import {
  QuoteItemInput,
  QuoteInstallmentInput,
  calculateItemsTotal,
  assertInstallmentsMatchTotal,
  resolveInstallmentAmount,
} from './quote-calculations';

interface CreateQuoteInput {
  clientId: string;
  serviceId?: string;
  description: string;
  basePrice?: number; // modo simple (legado): se usa solo si no hay items
  discount: number;
  paymentTerms?: string;
  validUntil?: Date;
  status: 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA';
  items?: QuoteItemInput[];
  installments?: QuoteInstallmentInput[];
}

interface ListQuotesParams {
  search?: string;
  status?: string;
  clientId?: string;
  page: number;
  pageSize: number;
}

const QUOTE_INCLUDE_FULL = {
  client: true,
  service: true,
  items: { orderBy: { sortOrder: 'asc' } },
  installments: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.QuoteInclude;

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

  /**
   * Calcula el precio base de la cotización. Si vienen "items", el total es
   * la suma de (precio unitario * cantidad) de cada uno (modo tabla, como
   * las cotizaciones con ítem/cantidad/total). Si no vienen items, usa
   * basePrice directamente (modo simple, compatible con el comportamiento
   * original de la app).
   */
  private static resolveBasePrice(input: { basePrice?: number; items?: QuoteItemInput[] }): number {
    if (input.items && input.items.length > 0) {
      return calculateItemsTotal(input.items);
    }
    if (input.basePrice !== undefined) {
      return input.basePrice;
    }
    throw AppError.badRequest('Debes indicar un precio base o al menos un ítem con precio.');
  }

  static async create(organizationId: string, createdById: string, input: CreateQuoteInput) {
    await PlanLimitService.assertCanCreateQuote(organizationId);

    const client = await prisma.client.findFirst({ where: { id: input.clientId, organizationId } });
    if (!client) throw AppError.badRequest('El cliente especificado no existe en esta organización.');

    if (input.serviceId) {
      const service = await prisma.service.findFirst({ where: { id: input.serviceId, organizationId } });
      if (!service) throw AppError.badRequest('El servicio especificado no existe en esta organización.');
    }

    const basePrice = this.resolveBasePrice(input);
    const finalPrice = Math.max(0, basePrice - input.discount);

    if (input.installments && input.installments.length > 0) {
      assertInstallmentsMatchTotal(input.installments, finalPrice);
    }

    const quote = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const number = await this.getNextQuoteNumber(tx, organizationId);

      const created = await tx.quote.create({
        data: {
          organizationId,
          number,
          clientId: input.clientId,
          serviceId: input.serviceId,
          description: input.description,
          basePrice,
          discount: input.discount,
          finalPrice,
          paymentTerms: input.paymentTerms,
          validUntil: input.validUntil,
          status: input.status,
          createdById,
          ...(input.items && input.items.length > 0
            ? {
                items: {
                  create: input.items.map((item, index) => ({
                    description: item.description,
                    unitPrice: item.unitPrice,
                    quantity: item.quantity,
                    sortOrder: index,
                  })),
                },
              }
            : {}),
          ...(input.installments && input.installments.length > 0
            ? {
                installments: {
                  create: input.installments.map((inst, index) => ({
                    description: inst.description,
                    amountType: inst.amountType,
                    fixedAmount: inst.amountType === 'FIXED' ? inst.fixedAmount : null,
                    percentage: inst.amountType === 'PERCENTAGE' ? inst.percentage : null,
                    sortOrder: index,
                  })),
                },
              }
            : {}),
        },
        include: QUOTE_INCLUDE_FULL,
      });

      return created;
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
      include: { ...QUOTE_INCLUDE_FULL, activities: true, createdBy: { select: { id: true, fullName: true } } },
    });
    if (!quote) throw AppError.notFound('Cotización no encontrada.');
    return quote;
  }

  static async update(organizationId: string, id: string, input: Partial<CreateQuoteInput>) {
    const existing = await prisma.quote.findFirst({ where: { id, organizationId }, include: { items: true } });
    if (!existing) throw AppError.notFound('Cotización no encontrada.');

    const willUseItems = input.items !== undefined ? input.items.length > 0 : existing.items.length > 0;

    const basePrice = willUseItems
      ? calculateItemsTotal(
          input.items ??
            existing.items.map((i: { description: string; unitPrice: unknown; quantity: unknown }) => ({
              description: i.description,
              unitPrice: Number(i.unitPrice),
              quantity: Number(i.quantity),
            }))
        )
      : input.basePrice ?? Number(existing.basePrice);

    const discount = input.discount ?? Number(existing.discount);
    const finalPrice = Math.max(0, basePrice - discount);

    if (input.installments && input.installments.length > 0) {
      assertInstallmentsMatchTotal(input.installments, finalPrice);
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Si vienen items/installments nuevos, se reemplaza el set completo
      // (borrar + recrear) en vez de intentar hacer un diff fino — es más
      // simple y seguro dado que estas listas suelen ser cortas (pocos
      // ítems/cuotas por cotización).
      if (input.items !== undefined) {
        await tx.quoteItem.deleteMany({ where: { quoteId: id } });
      }
      if (input.installments !== undefined) {
        await tx.quoteInstallment.deleteMany({ where: { quoteId: id } });
      }

      return tx.quote.update({
        where: { id },
        data: {
          ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
          ...(input.serviceId !== undefined ? { serviceId: input.serviceId } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.paymentTerms !== undefined ? { paymentTerms: input.paymentTerms } : {}),
          ...(input.validUntil !== undefined ? { validUntil: input.validUntil } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          basePrice,
          discount,
          finalPrice,
          ...(input.items !== undefined && input.items.length > 0
            ? {
                items: {
                  create: input.items.map((item, index) => ({
                    description: item.description,
                    unitPrice: item.unitPrice,
                    quantity: item.quantity,
                    sortOrder: index,
                  })),
                },
              }
            : {}),
          ...(input.installments !== undefined && input.installments.length > 0
            ? {
                installments: {
                  create: input.installments.map((inst, index) => ({
                    description: inst.description,
                    amountType: inst.amountType,
                    fixedAmount: inst.amountType === 'FIXED' ? inst.fixedAmount : null,
                    percentage: inst.amountType === 'PERCENTAGE' ? inst.percentage : null,
                    sortOrder: index,
                  })),
                },
              }
            : {}),
        },
        include: QUOTE_INCLUDE_FULL,
      });
    });
  }

  static async duplicate(organizationId: string, id: string, createdById: string) {
    const original = await prisma.quote.findFirst({
      where: { id, organizationId },
      include: { items: true, installments: true },
    });
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
      items: original.items.map((i: QuoteItem) => ({
        description: i.description,
        unitPrice: Number(i.unitPrice),
        quantity: Number(i.quantity),
      })),
      installments: original.installments.map((inst: QuoteInstallment) => ({
        description: inst.description,
        amountType: inst.amountType,
        fixedAmount: inst.fixedAmount !== null ? Number(inst.fixedAmount) : undefined,
        percentage: inst.percentage !== null ? Number(inst.percentage) : undefined,
      })),
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

  static async toggleInstallmentPaid(organizationId: string, quoteId: string, installmentId: string, isPaid: boolean) {
    const quote = await prisma.quote.findFirst({ where: { id: quoteId, organizationId } });
    if (!quote) throw AppError.notFound('Cotización no encontrada.');

    const installment = await prisma.quoteInstallment.findFirst({ where: { id: installmentId, quoteId } });
    if (!installment) throw AppError.notFound('Cuota no encontrada en esta cotización.');

    return prisma.quoteInstallment.update({
      where: { id: installmentId },
      data: { isPaid, paidAt: isPaid ? new Date() : null },
    });
  }

  /** Resuelve el monto en pesos de cada cuota de una cotización, para mostrar en frontend/PDF. */
  static resolveInstallmentAmounts(
    installments: { description: string; amountType: string; fixedAmount: unknown; percentage: unknown }[],
    total: number
  ) {
    return installments.map((inst) => ({
      ...inst,
      amount: resolveInstallmentAmount(
        {
          description: inst.description,
          amountType: inst.amountType as 'FIXED' | 'PERCENTAGE',
          fixedAmount: inst.fixedAmount !== null ? Number(inst.fixedAmount) : undefined,
          percentage: inst.percentage !== null ? Number(inst.percentage) : undefined,
        },
        total
      ),
    }));
  }
}
