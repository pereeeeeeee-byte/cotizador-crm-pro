import { prisma } from '@/config/prisma';
import type { Service } from '@prisma/client';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function lastNMonthsKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

export class DashboardService {
  static async getSummary(organizationId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const [
      totalClients,
      newClientsThisMonth,
      totalQuotes,
      acceptedQuotes,
      rejectedQuotes,
      quotesThisMonth,
      salesAggMonth,
      salesAggYear,
    ] = await Promise.all([
      prisma.client.count({ where: { organizationId } }),
      prisma.client.count({ where: { organizationId, createdAt: { gte: startOfMonth } } }),
      prisma.quote.count({ where: { organizationId } }),
      prisma.quote.count({ where: { organizationId, status: 'ACEPTADA' } }),
      prisma.quote.count({ where: { organizationId, status: 'RECHAZADA' } }),
      prisma.quote.count({ where: { organizationId, createdAt: { gte: startOfMonth } } }),
      prisma.quote.aggregate({
        where: { organizationId, status: 'ACEPTADA', createdAt: { gte: startOfMonth } },
        _sum: { finalPrice: true },
      }),
      prisma.quote.aggregate({
        where: { organizationId, status: 'ACEPTADA', createdAt: { gte: startOfYear } },
        _sum: { finalPrice: true },
      }),
    ]);

    const totalDecided = acceptedQuotes + rejectedQuotes;
    const conversionRate = totalDecided > 0 ? (acceptedQuotes / totalDecided) * 100 : 0;

    return {
      totalClients,
      newClientsThisMonth,
      totalQuotes,
      acceptedQuotes,
      rejectedQuotes,
      quotesThisMonth,
      conversionRate: Math.round(conversionRate * 10) / 10,
      salesThisMonth: Number(salesAggMonth._sum.finalPrice ?? 0),
      salesThisYear: Number(salesAggYear._sum.finalPrice ?? 0),
    };
  }

  static async getMonthlyCharts(organizationId: string, months = 6) {
    const keys = lastNMonthsKeys(months);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const [clients, quotes, acceptedQuotes] = await Promise.all([
      prisma.client.findMany({
        where: { organizationId, createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      prisma.quote.findMany({
        where: { organizationId, createdAt: { gte: startDate } },
        select: { createdAt: true, status: true },
      }),
      prisma.quote.findMany({
        where: { organizationId, status: 'ACEPTADA', createdAt: { gte: startDate } },
        select: { createdAt: true, finalPrice: true },
      }),
    ]);

    const clientsByMonth: Record<string, number> = {};
    const quotesByMonth: Record<string, number> = {};
    const salesByMonth: Record<string, number> = {};
    const acceptedByMonth: Record<string, number> = {};
    const totalDecidedByMonth: Record<string, number> = {};

    for (const key of keys) {
      clientsByMonth[key] = 0;
      quotesByMonth[key] = 0;
      salesByMonth[key] = 0;
      acceptedByMonth[key] = 0;
      totalDecidedByMonth[key] = 0;
    }

    for (const c of clients) {
      const key = monthKey(c.createdAt);
      if (key in clientsByMonth) clientsByMonth[key]++;
    }

    for (const q of quotes) {
      const key = monthKey(q.createdAt);
      if (key in quotesByMonth) quotesByMonth[key]++;
      if (['ACEPTADA', 'RECHAZADA'].includes(q.status) && key in totalDecidedByMonth) {
        totalDecidedByMonth[key]++;
      }
      if (q.status === 'ACEPTADA' && key in acceptedByMonth) acceptedByMonth[key]++;
    }

    for (const q of acceptedQuotes) {
      const key = monthKey(q.createdAt);
      if (key in salesByMonth) salesByMonth[key] += Number(q.finalPrice);
    }

    const conversionByMonth: Record<string, number> = {};
    for (const key of keys) {
      conversionByMonth[key] =
        totalDecidedByMonth[key] > 0 ? Math.round((acceptedByMonth[key] / totalDecidedByMonth[key]) * 1000) / 10 : 0;
    }

    // Servicios más vendidos (cotizaciones aceptadas, agrupadas por servicio)
    const topServicesRaw = await prisma.quote.groupBy({
      by: ['serviceId'],
      where: { organizationId, status: 'ACEPTADA', serviceId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: 5,
    });

    const serviceIds: string[] = topServicesRaw
      .map((t: { serviceId: string | null }) => t.serviceId)
      .filter((id: string | null): id is string => Boolean(id));
    const services: Service[] = await prisma.service.findMany({ where: { id: { in: serviceIds } } });
    const topServices = topServicesRaw.map((t: { serviceId: string | null; _count: { _all: number } }) => ({
      serviceId: t.serviceId,
      serviceName: services.find((s) => s.id === t.serviceId)?.name ?? 'Sin servicio',
      count: t._count._all,
    }));

    return {
      months: keys,
      clientsByMonth: keys.map((k) => clientsByMonth[k]),
      quotesByMonth: keys.map((k) => quotesByMonth[k]),
      salesByMonth: keys.map((k) => salesByMonth[k]),
      conversionByMonth: keys.map((k) => conversionByMonth[k]),
      topServices,
    };
  }
}
