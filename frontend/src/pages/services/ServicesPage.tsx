import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { servicesApi } from '@/api/resources.api';
import { Service } from '@/types';
import { Spinner } from '@/components/ui/Spinner';

function formatCLP(value: string | number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value));
}

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['services'] });

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desactivar este servicio? Ya no aparecerá disponible para nuevas cotizaciones.')) return;
    try {
      await servicesApi.remove(id);
      toast.success('Servicio desactivado.');
      refresh();
    } catch {
      toast.error('No se pudo desactivar el servicio.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Catálogo de servicios</h1>
          <p className="text-sm text-ink-500">Define tus servicios y precios base para cotizar más rápido</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} /> Nuevo servicio
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div key={service.id} className="card">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-ink-900">{service.name}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(service);
                    setShowForm(true);
                  }}
                  className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(service.id)} className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {service.description && <p className="mt-1 text-sm text-ink-500">{service.description}</p>}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-bold text-brand-600">{formatCLP(service.basePrice)}</span>
              {service.estimatedDays && <span className="text-xs text-ink-400">~{service.estimatedDays} días</span>}
            </div>
          </div>
        ))}
        {services.length === 0 && <p className="col-span-full text-center text-ink-400">Aún no tienes servicios registrados.</p>}
      </div>

      {showForm && (
        <ServiceFormModal
          service={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function ServiceFormModal({ service, onClose, onSaved }: { service: Service | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: service?.name ?? '',
    description: service?.description ?? '',
    basePrice: service?.basePrice ?? '',
    estimatedDays: service?.estimatedDays ?? '',
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.basePrice) {
      toast.error('Nombre y precio base son obligatorios.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, basePrice: Number(form.basePrice), estimatedDays: form.estimatedDays ? Number(form.estimatedDays) : undefined };
      if (service) {
        await servicesApi.update(service.id, payload);
        toast.success('Servicio actualizado.');
      } else {
        await servicesApi.create(payload);
        toast.success('Servicio creado.');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'No se pudo guardar el servicio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">{service ? 'Editar servicio' : 'Nuevo servicio'}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label-field">Nombre *</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Descripción</label>
            <textarea
              className="input-field"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Precio base (CLP) *</label>
              <input
                className="input-field"
                type="number"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">Días estimados</label>
              <input
                className="input-field"
                type="number"
                value={form.estimatedDays}
                onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
              />
            </div>
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
