import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { clientsApi, servicesApi, quotesApi, aiApi } from '@/api/resources.api';
import { Client, Service, QuoteItem, QuoteInstallment } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { ClientSearchSelect } from '@/components/ui/ClientSearchSelect';
import { QuoteItemsTable } from '@/components/ui/QuoteItemsTable';
import { QuoteInstallmentsEditor } from '@/components/ui/QuoteInstallmentsEditor';
import clsx from 'clsx';

function formatCLP(value: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
}

type PricingMode = 'simple' | 'items';

export default function QuoteFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('clientId') ?? '';

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<string | null>(null);

  const [pricingMode, setPricingMode] = useState<PricingMode>('simple');
  const [useInstallments, setUseInstallments] = useState(false);

  const [form, setForm] = useState({
    clientId: preselectedClientId,
    serviceId: '',
    description: '',
    basePrice: '',
    discount: '0',
    paymentTerms: '50% al iniciar, 50% al finalizar',
    validUntil: '',
    status: 'BORRADOR' as const,
  });
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [installments, setInstallments] = useState<QuoteInstallment[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients-all-light'],
    queryFn: clientsApi.listAllLight,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
  });

  const handleAiAssist = async () => {
    if (!aiInput.trim()) {
      toast.error('Describe lo que necesita el cliente.');
      return;
    }
    setAiLoading(true);
    try {
      const draft = await aiApi.draftQuote(aiInput);
      setForm((f) => ({
        ...f,
        serviceId: draft.suggestedServiceId ?? f.serviceId,
        description: draft.professionalDescription,
        basePrice: draft.suggestedBasePrice ? String(draft.suggestedBasePrice) : f.basePrice,
      }));
      setAiConfidence(draft.confidence);
      toast.success('Borrador generado. Revísalo antes de guardar.');
    } catch {
      toast.error('No se pudo generar el borrador con IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const itemsTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const basePrice = pricingMode === 'items' ? itemsTotal : Number(form.basePrice || 0);
  const finalPrice = Math.max(0, basePrice - Number(form.discount || 0));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.clientId || !form.description) {
      toast.error('Cliente y descripción son obligatorios.');
      return;
    }
    if (pricingMode === 'simple' && !form.basePrice) {
      toast.error('Ingresa el precio base.');
      return;
    }
    if (pricingMode === 'items' && items.length === 0) {
      toast.error('Agrega al menos un ítem.');
      return;
    }

    setSaving(true);
    try {
      const quote = await quotesApi.create({
        clientId: form.clientId,
        serviceId: form.serviceId || undefined,
        description: form.description,
        discount: Number(form.discount || 0),
        paymentTerms: useInstallments ? undefined : form.paymentTerms,
        validUntil: form.validUntil || undefined,
        status: form.status,
        ...(pricingMode === 'items' ? { items } : { basePrice: Number(form.basePrice) }),
        ...(useInstallments && installments.length > 0 ? { installments } : {}),
      });
      toast.success('Cotización creada.');
      navigate(`/cotizaciones/${quote.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'No se pudo crear la cotización.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button onClick={() => navigate('/cotizaciones')} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
        <ArrowLeft size={16} /> Volver a cotizaciones
      </button>

      <div>
        <h1 className="text-2xl font-bold text-ink-900">Nueva cotización</h1>
        <p className="text-sm text-ink-500">Genera una cotización profesional en menos de un minuto</p>
      </div>

      <div className="card border-2 border-brand-100 bg-brand-50/40">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={18} className="text-brand-600" />
          <h3 className="text-sm font-semibold text-ink-900">Asistente con IA</h3>
        </div>
        <p className="mb-3 text-xs text-ink-500">Describe lo que necesita el cliente y te ayudamos a armar el borrador.</p>
        <textarea
          className="input-field"
          rows={2}
          placeholder="Ej: Parcela de 5000 m² para subdividir en dos lotes."
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
        />
        <button type="button" onClick={handleAiAssist} disabled={aiLoading} className="btn-secondary mt-2 text-sm">
          {aiLoading && <Spinner size={14} />}
          <Sparkles size={14} /> Generar borrador
        </button>
        {aiConfidence && <p className="mt-2 text-xs text-ink-400">Confianza de la sugerencia: {aiConfidence}</p>}
      </div>

      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="label-field">Cliente *</label>
          <ClientSearchSelect clients={clients} value={form.clientId} onChange={(clientId) => setForm({ ...form, clientId })} />
        </div>

        <div>
          <label className="label-field">Servicio</label>
          <select
            className="input-field"
            value={form.serviceId}
            onChange={(e) => {
              const service = services.find((s) => s.id === e.target.value);
              setForm({ ...form, serviceId: e.target.value, basePrice: service ? service.basePrice : form.basePrice });
            }}
          >
            <option value="">Sin servicio específico</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field">Descripción *</label>
          <textarea
            className="input-field"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Selector de modo de precio: simple (un solo monto) o detallado (tabla de ítems) */}
        <div>
          <label className="label-field">¿Cómo quieres cotizar el valor?</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPricingMode('simple')}
              className={clsx(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition',
                pricingMode === 'simple' ? 'border-brand-400 bg-brand-50 text-ink-900' : 'border-ink-200 text-ink-500'
              )}
            >
              Precio único
            </button>
            <button
              type="button"
              onClick={() => setPricingMode('items')}
              className={clsx(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition',
                pricingMode === 'items' ? 'border-brand-400 bg-brand-50 text-ink-900' : 'border-ink-200 text-ink-500'
              )}
            >
              Detalle por ítems
            </button>
          </div>
        </div>

        {pricingMode === 'simple' ? (
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
              <label className="label-field">Descuento (CLP)</label>
              <input
                className="input-field"
                type="number"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="label-field">Ítems de la cotización *</label>
            <QuoteItemsTable items={items} onChange={setItems} />
            <div>
              <label className="label-field">Descuento (CLP)</label>
              <input
                className="input-field max-w-[160px]"
                type="number"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="rounded-lg bg-ink-50 p-3 text-right">
          <span className="text-sm text-ink-500">Valor final: </span>
          <span className="text-lg font-bold text-ink-900">{formatCLP(finalPrice)}</span>
        </div>

        {/* Forma de pago: cuotas por hito (opcional) o texto libre */}
        <div className="space-y-3 border-t border-ink-100 pt-4">
          <label className="flex items-center justify-between">
            <span className="label-field mb-0">Pago en cuotas por avance del proyecto</span>
            <input
              type="checkbox"
              checked={useInstallments}
              onChange={(e) => setUseInstallments(e.target.checked)}
              className="h-5 w-5 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
            />
          </label>

          {useInstallments ? (
            <QuoteInstallmentsEditor installments={installments} onChange={setInstallments} total={finalPrice} />
          ) : (
            <div>
              <label className="label-field">Forma de pago</label>
              <input
                className="input-field"
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
              />
            </div>
          )}
        </div>

        <div>
          <label className="label-field">Vigencia hasta</label>
          <input
            className="input-field max-w-[200px]"
            type="date"
            value={form.validUntil}
            onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => navigate('/cotizaciones')} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <Spinner size={16} />}
            Crear cotización
          </button>
        </div>
      </form>
    </div>
  );
}
