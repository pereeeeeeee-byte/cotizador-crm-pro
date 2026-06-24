import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload, Image as ImageIcon, PenTool } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import clsx from 'clsx';
import { organizationApi } from '@/api/organization.api';
import { usersApi } from '@/api/resources.api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { User, Role, Branding } from '@/types';
import { Spinner } from '@/components/ui/Spinner';

export default function SettingsPage() {
  const { data: me } = useCurrentUser();
  const queryClient = useQueryClient();
  const branding = me?.organization?.branding;

  const [form, setForm] = useState({
    responsibleName: branding?.responsibleName ?? '',
    jobTitle: branding?.jobTitle ?? '',
    rut: branding?.rut ?? '',
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
            <label className="label-field">RUT (aparece bajo tu firma en el PDF)</label>
            <input className="input-field" placeholder="12.345.678-9" value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} />
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

      <BrandingAssetsSection branding={branding} />

      <QuoteNumberingSection />

      {me?.role === 'ADMIN' && <TeamSection />}

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-ink-700">Plan actual</h2>
        <p className="text-lg font-bold text-ink-900">{me?.organization?.subscription?.plan?.name ?? '—'}</p>
        <p className="text-xs text-ink-500">Estado: {me?.organization?.subscription?.status}</p>
      </div>
    </div>
  );
}

function BrandingAssetsSection({ branding }: { branding?: Branding }) {
  const queryClient = useQueryClient();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'upload' | 'drawn' | null>(null);
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['me'] });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      await organizationApi.uploadLogo(file);
      toast.success('Logo actualizado.');
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'No se pudo subir el logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSignatureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSignature(true);
    try {
      await organizationApi.uploadSignatureImage(file);
      toast.success('Firma actualizada.');
      setSignatureMode(null);
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'No se pudo subir la firma.');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleSaveDrawnSignature = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast.error('Dibuja tu firma antes de guardar.');
      return;
    }
    setUploadingSignature(true);
    try {
      const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
      await organizationApi.saveDrawnSignature(dataUrl);
      toast.success('Firma actualizada.');
      setSignatureMode(null);
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'No se pudo guardar la firma.');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleClearSignature = async () => {
    if (!confirm('¿Quitar la firma actual? No se mostrará firma en tus documentos hasta que subas una nueva.')) return;
    try {
      await organizationApi.clearSignature();
      toast.success('Firma eliminada.');
      refresh();
    } catch {
      toast.error('No se pudo eliminar la firma.');
    }
  };

  return (
    <div className="card space-y-5">
      <h2 className="text-sm font-semibold text-ink-700">Logo y firma</h2>
      <p className="text-xs text-ink-500">
        Aquí puedes cambiar tu logo y firma en cualquier momento — no solo durante la configuración inicial.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Logo */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-ink-700">
            <ImageIcon size={16} />
            <span className="text-sm font-medium">Logo</span>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ink-200 p-5">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo actual" className="h-20 max-w-full object-contain" />
            ) : (
              <Upload className="text-ink-300" size={28} />
            )}
            <label className="btn-secondary cursor-pointer text-xs">
              {uploadingLogo && <Spinner size={14} />}
              {branding?.logoUrl ? 'Cambiar logo' : 'Subir logo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={handleLogoChange}
                disabled={uploadingLogo}
              />
            </label>
          </div>
        </div>

        {/* Firma */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-ink-700">
            <PenTool size={16} />
            <span className="text-sm font-medium">Firma</span>
          </div>

          {signatureMode === null ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ink-200 p-5">
              {branding?.signatureUrl && branding?.signatureType !== 'none' ? (
                <img src={branding.signatureUrl} alt="Firma actual" className="h-16 max-w-full object-contain" />
              ) : (
                <p className="text-xs text-ink-400">Sin firma configurada</p>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => setSignatureMode('upload')} className="btn-secondary text-xs">
                  Subir imagen
                </button>
                <button type="button" onClick={() => setSignatureMode('drawn')} className="btn-secondary text-xs">
                  Dibujar firma
                </button>
                {branding?.signatureUrl && branding?.signatureType !== 'none' && (
                  <button type="button" onClick={handleClearSignature} className="btn-danger text-xs">
                    Quitar firma
                  </button>
                )}
              </div>
            </div>
          ) : signatureMode === 'upload' ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ink-200 p-5">
              <Upload className="text-ink-300" size={28} />
              <label className="btn-secondary cursor-pointer text-xs">
                {uploadingSignature && <Spinner size={14} />}
                Elegir imagen
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleSignatureFileChange}
                  disabled={uploadingSignature}
                />
              </label>
              <button type="button" onClick={() => setSignatureMode(null)} className="text-xs text-ink-400 hover:underline">
                Cancelar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-xl border-2 border-dashed border-ink-200 bg-white">
                <SignatureCanvas ref={sigCanvasRef} penColor="#111827" canvasProps={{ className: 'w-full h-32 rounded-xl' }} />
              </div>
              <div className="flex justify-between gap-2">
                <button type="button" onClick={() => sigCanvasRef.current?.clear()} className="btn-secondary text-xs">
                  Borrar
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSignatureMode(null)} className="text-xs text-ink-400 hover:underline">
                    Cancelar
                  </button>
                  <button type="button" onClick={handleSaveDrawnSignature} disabled={uploadingSignature} className="btn-primary text-xs">
                    {uploadingSignature && <Spinner size={14} />}
                    Guardar firma
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuoteNumberingSection() {
  const [startAt, setStartAt] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(startAt);
    if (!value || value < 1) {
      toast.error('Ingresa un número válido.');
      return;
    }
    if (!confirm(`Tu próxima cotización comenzará en el número ${value}. ¿Confirmas?`)) return;

    setSaving(true);
    try {
      await organizationApi.setQuoteStartingNumber(value);
      toast.success(`Listo. Tu próxima cotización será la #${value}.`);
      setStartAt('');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ?? 'No se pudo ajustar la numeración. Es posible que ya tengas cotizaciones creadas.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card space-y-3">
      <h2 className="text-sm font-semibold text-ink-700">Numeración de cotizaciones</h2>
      <p className="text-xs text-ink-500">
        Si tu empresa ya emitía cotizaciones antes de usar el sistema, puedes definir desde qué número continuar (por
        ejemplo, 1001) en vez de comenzar desde el 1. <strong>Esto solo se puede hacer antes de crear tu primera
        cotización en el sistema.</strong>
      </p>
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="label-field">Mi próxima cotización será la N°</label>
          <input
            className="input-field"
            type="number"
            min={1}
            placeholder="Ej: 1001"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <Spinner size={16} />}
          Aplicar
        </button>
      </form>
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
