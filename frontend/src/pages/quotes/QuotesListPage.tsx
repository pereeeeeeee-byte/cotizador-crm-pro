import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { quotesApi } from '@/api/resources.api';
import { Quote, QuoteStatus, PaginatedResult } from '@/types';
import { QuoteStatusBadge } from '@/components/ui/StatusBadge';

function formatCLP(value: string | number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value));
}

const STATUS_OPTIONS: { value: QuoteStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'ENVIADA', label: 'Enviada' },
  { value: 'ACEPTADA', label: 'Aceptada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
  { value: 'VENCIDA', label: 'Vencida' },
];

export default function QuotesListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuoteStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data } = useQuery<PaginatedResult<Quote>>({
    queryKey: ['quotes', search, status, page],
    queryFn: () => quotesApi.list({ search: search || undefined, status: status || undefined, page, pageSize: 12 }),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Cotizaciones</h1>
          <p className="text-sm text-ink-500">{data?.total ?? 0} cotizaciones emitidas</p>
        </div>
        <button onClick={() => navigate('/cotizaciones/nueva')} className="btn-primary">
          <Plus size={16} /> Nueva cotización
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            className="input-field pl-9"
            placeholder="Buscar por cliente o descripción..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input-field max-w-xs"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as QuoteStatus | '');
            setPage(1);
          }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase text-ink-500">
            <tr>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {data?.items.map((quote) => (
              <tr key={quote.id} onClick={() => navigate(`/cotizaciones/${quote.id}`)} className="cursor-pointer hover:bg-ink-50">
                <td className="px-4 py-3 font-medium text-ink-900">#{quote.number}</td>
                <td className="px-4 py-3 text-ink-600">{quote.client?.fullName}</td>
                <td className="px-4 py-3 text-ink-600">{quote.service?.name ?? '—'}</td>
                <td className="px-4 py-3 font-medium text-ink-900">{formatCLP(quote.finalPrice)}</td>
                <td className="px-4 py-3">
                  <QuoteStatusBadge status={quote.status} />
                </td>
                <td className="px-4 py-3 text-ink-500">{new Date(quote.createdAt).toLocaleDateString('es-CL')}</td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                  No se encontraron cotizaciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-sm font-medium ${p === page ? 'bg-brand-400 text-ink-900' : 'text-ink-500 hover:bg-ink-100'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
