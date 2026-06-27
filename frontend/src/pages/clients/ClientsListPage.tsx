import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { clientsApi } from '@/api/resources.api';
import { Client, ClientStatus, PaginatedResult } from '@/types';
import { ClientStatusBadge } from '@/components/ui/StatusBadge';
import ClientFormModal from './ClientFormModal';

const STATUS_OPTIONS: { value: ClientStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'COTIZADO', label: 'Cotizado' },
  { value: 'EN_NEGOCIACION', label: 'En negociación' },
  { value: 'PENDIENTE_DOCUMENTOS', label: 'Pendiente documentos' },
  { value: 'TRABAJO_CONTRATADO', label: 'Trabajo contratado' },
  { value: 'TRABAJO_TERMINADO', label: 'Trabajo terminado' },
  { value: 'CLIENTE_PERDIDO', label: 'Cliente perdido' },
];

export default function ClientsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ClientStatus | ''>('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, refetch } = useQuery<PaginatedResult<Client>>({
    queryKey: ['clients', search, status, page],
    queryFn: () => clientsApi.list({ search: search || undefined, status: status || undefined, page, pageSize: 12 }),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Clientes</h1>
          <p className="text-sm text-ink-500">{data?.total ?? 0} clientes registrados</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            className="input-field pl-9"
            placeholder="Buscar por nombre, teléfono o correo..."
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
            setStatus(e.target.value as ClientStatus | '');
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
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Fuente</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Cotizaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {data?.items.map((client) => (
              <tr
                key={client.id}
                onClick={() => navigate(`/clientes/${client.id}`)}
                className="cursor-pointer hover:bg-ink-50"
              >
                <td className="px-4 py-3 font-medium text-ink-900">{client.fullName}</td>
                <td className="px-4 py-3 text-ink-600">
                  <div>{client.phone}</div>
                  <div className="text-xs text-ink-400">{client.email}</div>
                </td>
                <td className="px-4 py-3 text-ink-600">{client.city ?? '—'}</td>
                <td className="px-4 py-3 text-ink-600">{client.source}</td>
                <td className="px-4 py-3">
                  <ClientStatusBadge status={client.status} />
                </td>
                <td className="px-4 py-3 text-ink-600">{client._count?.quotes ?? 0}</td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                  No se encontraron clientes.
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
              className={`h-8 w-8 rounded-lg text-sm font-medium ${
                p === page ? 'bg-brand-400 text-ink-900' : 'text-ink-500 hover:bg-ink-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {showCreateModal && (
        <ClientFormModal
          onClose={() => setShowCreateModal(false)}
          onSaved={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
