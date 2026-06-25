import { AppError } from '@/common/AppError';

export interface QuoteItemInput {
  description: string;
  unitPrice: number;
  quantity: number;
}

export interface QuoteInstallmentInput {
  description: string;
  amountType: 'FIXED' | 'PERCENTAGE';
  fixedAmount?: number;
  percentage?: number;
}

/** Suma de (precio unitario * cantidad) de todos los ítems. */
export function calculateItemsTotal(items: QuoteItemInput[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/** Convierte una cuota (monto fijo o porcentaje) a su valor en pesos, dado el total de la cotización. */
export function resolveInstallmentAmount(installment: QuoteInstallmentInput, total: number): number {
  if (installment.amountType === 'FIXED') {
    return installment.fixedAmount ?? 0;
  }
  return Math.round((total * (installment.percentage ?? 0)) / 100);
}

/**
 * Valida que la suma de las cuotas (convertidas a monto) coincida con el
 * total de la cotización, permitiendo una tolerancia de redondeo de hasta
 * $1 por cuota (para no bloquear divisiones como 100/3 que no calzan exacto
 * en pesos enteros).
 */
export function assertInstallmentsMatchTotal(installments: QuoteInstallmentInput[], total: number): void {
  if (installments.length === 0) return;

  const sum = installments.reduce((acc, inst) => acc + resolveInstallmentAmount(inst, total), 0);
  const tolerance = installments.length; // hasta $1 de tolerancia por cuota, por redondeo

  if (Math.abs(sum - total) > tolerance) {
    throw AppError.badRequest(
      `La suma de las cuotas (${sum.toLocaleString('es-CL')}) no coincide con el valor total de la cotización (${total.toLocaleString('es-CL')}). Ajusta los montos o porcentajes.`
    );
  }
}
