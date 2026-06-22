import { useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { clientsApi } from '@/api/resources.api';
import { Client, ClientStatus, LeadSource } from '@/types';
import { Spinner } from '@/components/ui/Spinner';

const SOURCES: LeadSource[] = ['FACEBOOK', 'MARKETPLACE', 'INSTAGRAM', 'GOOGLE', 'WHATSAPP', 'REFERIDO', 'OTRO'];
const STATUSES: ClientStatus[] = [
  'NUEVO',
  'COTIZADO',
  'EN_NEGOCIACION',
  'PENDIENTE_DOCUMENTOS',
  'TRABAJO_CONTRATADO',
  'TRABAJO_TERMINADO',
  'CLIENTE_PERDIDO',
];

interface Props {
  client?: Client;
  onClose: () => void;
  onSaved: () => void;
}

export default function ClientFormModal({ client, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    fullName: client?.fullName ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    address: client?.address ?? '',
    comuna: client?.comuna ?? '',
    city: client?.city ?? '',
    source: client?.source ?? ('OTRO' as LeadSource),
    status: client?.status ?? ('NUEVO' as ClientStatus),
    notes: client?.notes ?? '',
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error('El nombre es obligatorio.');
      return;
    }
    setLoading(true);
    try {
      if (client) {
        await clientsApi.update(client.id, form);
        toast.success('Cliente actualizado.');
      } else {
        await clientsApi.create(form);
        toast.success('Cliente creado.');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'No se pudo guardar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">{client ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="label-field">Nombre completo *</label>
            <input className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Teléfono</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Correo</label>
              <input className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label-field">Dirección</label>
            <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Comuna</label>
              <input className="input-field" value={form.comuna} onChange={(e) => setForm({ ...form, comuna: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Ciudad</label>
              <input className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Fuente</label>
              <select className="input-field" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource })}>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Estado</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">Observaciones</label>
            <textarea
              className="input-field"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Spinner size={16} />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
