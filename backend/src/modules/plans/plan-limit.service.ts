import { prisma } from '@/config/prisma';
import { AppError } from '@/common/AppError';

/**
 * Verifica si una organización puede crear un nuevo recurso según los
 * límites de su plan activo. Se usa antes de crear clientes, usuarios o
 * cotizaciones del mes. Si la organización está en trial vencido o no tiene
 * suscripción activa, se le sigue dejando operar en modo restringido (no se
 * bloquea el login, solo la creación de recursos nuevos) — esto evita que un
 * problema de billing deje a alguien sin poder ni ver su información.
 */
export class PlanLimitService {
  static async getActivePlanContext(organizationId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });

    if (!subscription) {
      throw AppError.internal('La organización no tiene una suscripción asociada.');
    }

    return subscription;
  }

  static async assertCanAddUser(organizationId: string) {
    const sub = await this.getActivePlanContext(organizationId);
    if (sub.plan.maxUsers === -1) return;

    const currentUsers = await prisma.user.count({ where: { organizationId, isActive: true } });
    if (currentUsers >= sub.plan.maxUsers) {
      throw AppError.planLimitReached(
        `Tu plan "${sub.plan.name}" permite hasta ${sub.plan.maxUsers} usuario(s) activo(s). Actualiza tu plan para agregar más.`
      );
    }
  }

  static async assertCanAddClient(organizationId: string) {
    const sub = await this.getActivePlanContext(organizationId);
    if (sub.plan.maxClients === -1) return;

    const currentClients = await prisma.client.count({ where: { organizationId } });
    if (currentClients >= sub.plan.maxClients) {
      throw AppError.planLimitReached(
        `Tu plan "${sub.plan.name}" permite hasta ${sub.plan.maxClients} clientes. Actualiza tu plan para agregar más.`
      );
    }
  }

  static async assertCanCreateQuote(organizationId: string) {
    const sub = await this.getActivePlanContext(organizationId);
    if (sub.plan.maxQuotesMo === -1) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const quotesThisMonth = await prisma.quote.count({
      where: { organizationId, createdAt: { gte: startOfMonth } },
    });

    if (quotesThisMonth >= sub.plan.maxQuotesMo) {
      throw AppError.planLimitReached(
        `Tu plan "${sub.plan.name}" permite hasta ${sub.plan.maxQuotesMo} cotizaciones por mes. Actualiza tu plan para continuar.`
      );
    }
  }

  static async hasFeature(organizationId: string, feature: string): Promise<boolean> {
    const sub = await this.getActivePlanContext(organizationId);
    const features = sub.plan.features as Record<string, boolean>;
    return Boolean(features?.[feature]);
  }
}
