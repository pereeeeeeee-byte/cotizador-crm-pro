import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, MessageCircle, Copy, Trash2, FileText } from 'lucide-react';
import { quotesApi } from '@/api/resources.api';
import { Quote, QuoteStatus } from '@/types';
import { QuoteStatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';

function formatCLP(value: string | number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value));
}

const STATUS_OPTIONS: QuoteStatus[] = ['BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA'];

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: ['quote', id],
    queryFn: () => quotesApi.getById(id!),
    enabled: !!id,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['quote', id] });

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const { pdfUrl } = await quotesApi.generatePdf(id!);
      window.open(pdfUrl, '_blank');
      refresh();
    } catch {
      toast.error('No se pudo generar el PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!quote) return;
    const text = `Hola ${quote.client?.fullName}, te comparto la cotización N°${quote.number} por ${formatCLP(quote.finalPrice)}.${quote.pdfUrl ? ' ' + quote.pdfUrl : ''}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleStatusChange = async (status: QuoteStatus) => {
    try {
      await quotesApi.update(id!, { status });
      toast.success('Estado actualizado.');
      refresh();
    } catch {
      toast.error('No se pudo actualizar el estado.');
    }
  };

  const handleDuplicate = async () => {
    try {
      const newQuote = await quotesApi.duplicate(id!);
      toast.success('Cotización duplicada como borrador.');
      navigate(`/cotizaciones/${newQuote.id}`);
    } catch {
      toast.error('No se pudo duplicar la cotización.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) return;
    try {
      await quotesApi.remove(id!);
      toast.success('Cotización eliminada.');
      navigate('/cotizaciones');
    } catch {
      toast.error('No se pudo eliminar la cotización.');
    }
  };

  const handleToggleInstallment = async (installmentId: string, isPaid: boolean) => {
    try {
      await quotesApi.toggleInstallmentPaid(id!, installmentId, isPaid);
      refresh();
    } catch {
      toast.error('No se pudo actualizar el estado de la cuota.');
    }
  };

  if (isLoading || !quote) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} className="text-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button onClick={() => navigate('/cotizaciones')} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
        <ArrowLeft size={16} /> Volver a cotizaciones
      </button>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink-900">Cotización #{quote.number}</h1>
            <p className="text-sm text-ink-500">{quote.client?.fullName}</p>
          </div>
          <select
            className="input-field max-w-[180px]"
            value={quote.status}
            onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
          {quote.service && (
            <div className="flex justify-between">
              <span className="text-ink-500">Servicio</span>
              <span className="font-medium text-ink-900">{quote.service.name}</span>
            </div>
          )}
          <div>
            <span className="text-ink-500">Descripción</span>
            <p className="mt-1 text-ink-800">{quote.description}</p>
          </div>

          {quote.items && quote.items.length > 0 ? (
            <div className="space-y-1 rounded-lg bg-ink-50 p-3">
              {quote.items.map((item, i) => (
                <div key={item.id ?? i} className="flex justify-between text-ink-700">
                  <span>
                    {item.description} {item.quantity !== 1 && <span className="text-ink-400">× {item.quantity}</span>}
                  </span>
                  <span className="font-medium text-ink-900">{formatCLP(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-ink-500">Precio base</span>
              <span className="text-ink-900">{formatCLP(quote.basePrice)}</span>
            </div>
          )}

          {Number(quote.discount) > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-500">Descuento</span>
              <span className="text-ink-900">- {formatCLP(quote.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold">
            <span className="text-ink-900">Total</span>
            <span className="text-brand-600">{formatCLP(quote.finalPrice)}</span>
          </div>

          {quote.installments && quote.installments.length > 0 ? (
            <div className="space-y-1.5 pt-2">
              <span className="text-ink-500">Forma de pago</span>
              {quote.installments.map((inst, i) => (
                <label
                  key={inst.id ?? i}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-ink-100 p-2"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(inst.isPaid)}
                      onChange={(e) => handleToggleInstallment(inst.id!, e.target.checked)}
                      className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
                    />
                    <span className={inst.isPaid ? 'text-ink-400 line-through' : 'text-ink-700'}>
                      {i + 1}. {inst.description}
                    </span>
                  </span>
                  <span className="font-medium text-ink-900">{formatCLP(inst.amount ?? 0)}</span>
                </label>
              ))}
            </div>
          ) : (
            quote.paymentTerms && (
              <div className="flex justify-between">
                <span className="text-ink-500">Forma de pago</span>
                <span className="text-ink-900">{quote.paymentTerms}</span>
              </div>
            )
          )}

          {quote.validUntil && (
            <div className="flex justify-between">
              <span className="text-ink-500">Vigencia</span>
              <span className="text-ink-900">{new Date(quote.validUntil).toLocaleDateString('es-CL')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 text-sm font-semibold text-ink-700">Acciones</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleGeneratePdf} disabled={generatingPdf} className="btn-primary text-sm">
            {generatingPdf ? <Spinner size={14} /> : <FileText size={14} />}
            {quote.pdfUrl ? 'Regenerar PDF' : 'Generar PDF'}
          </button>
          {quote.pdfUrl && (
            <a href={quote.pdfUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
              <Download size={14} /> Descargar PDF
            </a>
          )}
          <button onClick={handleShareWhatsApp} className="btn-secondary text-sm">
            <MessageCircle size={14} /> Compartir WhatsApp
          </button>
          <button onClick={handleDuplicate} className="btn-secondary text-sm">
            <Copy size={14} /> Duplicar
          </button>
          <button onClick={handleDelete} className="btn-danger text-sm">
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
