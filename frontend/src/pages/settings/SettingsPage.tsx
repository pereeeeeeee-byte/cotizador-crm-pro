import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { organizationApi } from '@/api/organization.api';
import { usersApi } from '@/api/resources.api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { User, Role } from '@/types';
import { Spinner } from '@/components/ui/Spinner';

export default function SettingsPage() {
  const { data: me } = useCurrentUser();
  const queryClient = useQueryClient();
  const branding = me?.organization?.branding;

  const [form, setForm] = useState({
    responsibleName: branding?.responsibleName ?? '',
    jobTitle: branding?.jobTitle ?? '',
    phone: branding?.phone ?? '',
    email: branding?.email ?? '',
    address: branding?.address ?? '',
    primaryColor: branding?.primaryColor ?? '#FACC15',
    currency: branding?.currency ?? 'CLP',
    quotePrefix: branding?.quotePrefix ?? 'COT',
    pdfFooterNote: branding?.pdfFooterNote ?? '',
  });
  const [saving, setSaving] = useState(false);

  const onSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await organizationApi.updateBranding(form);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Configuración actualizada.');
    } catch {
      toast.error('No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Configuración</h1>
        <p className="text-sm text-ink-500">Identidad corporativa, plan y equipo</p>
      </div>

      <form onSubmit={onSaveBranding} className="card space-y-4">
        <h2 className="text-sm font-semibold text-ink-700">Identidad corporativa</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Nombre responsable</label>
            <input className="input-field" value={form.responsibleName} onChange={(e) => setForm({ ...form, responsibleName: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Cargo</label>
            <input className="input-field" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
          </div>
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
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label-field">Color principal</label>
            <input
              className="input-field h-10"
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">Moneda</label>
            <input className="input-field" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Prefijo cotización</label>
            <input className="input-field" value={form.quotePrefix} onChange={(e) => setForm({ ...form, quotePrefix: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label-field">Nota de pie de página en PDF</label>
          <input className="input-field" value={form.pdfFooterNote} onChange={(e) => setForm({ ...form, pdfFooterNote: e.target.value })} />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <Spinner size={16} />}
            Guardar cambios
          </button>
        </div>
      </form>

      {me?.role === 'ADMIN' && <TeamSection />}

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-ink-700">Plan actual</h2>
        <p className="text-lg font-bold text-ink-900">{me?.organization?.subscription?.plan?.name ?? '—'}</p>
        <p className="text-xs text-ink-500">Estado: {me?.organization?.subscription?.status}</p>
      </div>
    </div>
  );
}

function TeamSection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'VENDEDOR' as Role });
  const [saving, setSaving] = useState(false);

  const { data: users = [] } = useQuery<User[]>({ queryKey: ['users'], queryFn: usersApi.list });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const onAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.create(form);
      toast.success('Usuario agregado.');
      setShowForm(false);
      setForm({ fullName: '', email: '', password: '', role: 'VENDEDOR' });
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'No se pudo agregar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    try {
      await usersApi.remove(id);
      toast.success('Usuario desactivado.');
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'No se pudo desactivar el usuario.');
    }
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-700">Equipo</h2>
        <button onClick={() => setShowForm((s) => !s)} className="btn-secondary text-xs">
          <Plus size={14} /> Agregar usuario
        </button>
      </div>

      {showForm && (
        <form onSubmit={onAddUser} className="space-y-3 rounded-lg border border-ink-100 p-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input-field"
              placeholder="Nombre completo"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Correo"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Contraseña temporal"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="VENDEDOR">Vendedor</option>
              <option value="OPERADOR">Operador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-xs">
              {saving && <Spinner size={14} />}
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-ink-100">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium text-ink-900">{u.fullName}</p>
              <p className="text-xs text-ink-500">
                {u.email} · {u.role}
              </p>
            </div>
            <button onClick={() => handleRemove(u.id)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
