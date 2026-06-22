import { ClientStatus, QuoteStatus } from '@/types';
import clsx from 'clsx';

const CLIENT_STATUS_CONFIG: Record<ClientStatus, { label: string; classes: string }> = {
  NUEVO: { label: 'Nuevo', classes: 'bg-blue-50 text-blue-700' },
  COTIZADO: { label: 'Cotizado', classes: 'bg-purple-50 text-purple-700' },
  EN_NEGOCIACION: { label: 'En negociación', classes: 'bg-amber-50 text-amber-700' },
  PENDIENTE_DOCUMENTOS: { label: 'Pendiente documentos', classes: 'bg-orange-50 text-orange-700' },
  TRABAJO_CONTRATADO: { label: 'Trabajo contratado', classes: 'bg-emerald-50 text-emerald-700' },
  TRABAJO_TERMINADO: { label: 'Trabajo terminado', classes: 'bg-ink-100 text-ink-700' },
  CLIENTE_PERDIDO: { label: 'Cliente perdido', classes: 'bg-red-50 text-red-700' },
};

const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; classes: string }> = {
  BORRADOR: { label: 'Borrador', classes: 'bg-ink-100 text-ink-700' },
  ENVIADA: { label: 'Enviada', classes: 'bg-blue-50 text-blue-700' },
  ACEPTADA: { label: 'Aceptada', classes: 'bg-emerald-50 text-emerald-700' },
  RECHAZADA: { label: 'Rechazada', classes: 'bg-red-50 text-red-700' },
  VENCIDA: { label: 'Vencida', classes: 'bg-orange-50 text-orange-700' },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const config = CLIENT_STATUS_CONFIG[status];
  return <span className={clsx('badge', config.classes)}>{config.label}</span>;
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const config = QUOTE_STATUS_CONFIG[status];
  return <span className={clsx('badge', config.classes)}>{config.label}</span>;
}
