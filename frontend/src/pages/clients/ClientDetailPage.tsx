import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Phone, Mail, MapPin, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clientsApi, activitiesApi, remindersApi } from '@/api/resources.api';
import { Client, ActivityType, ActivityResult } from '@/types';
import { ClientStatusBadge, QuoteStatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import ClientFormModal from './ClientFormModal';

const ACTIVITY_TYPES: ActivityType[] = ['LLAMADA', 'WHATSAPP', 'CORREO', 'REUNION', 'VISITA_TECNICA'];

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: 'LLAMADA' as ActivityType, comment: '', result: '' as ActivityResult | '' });
  const [savingActivity, setSavingActivity] = useState(false);

  const { data: client, isLoading } = useQuery<Client & { quotes: any[]; activities: any[]; reminders: any[] }>({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id!),
    enabled: !!id,
  });

  const refreshClient = () => queryClient.invalidateQueries({ queryKey: ['client', id] });

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingActivity(true);
    try {
      await activitiesApi.create({
        clientId: id,
        type: activityForm.type,
        comment: activityForm.comment || undefined,
        result: activityForm.result || undefined,
      });
      toast.success('Actividad registrada.');
      setShowActivityForm(false);
      setActivityForm({ type: 'LLAMADA', comment: '', result: '' });
      refreshClient();
    } catch {
      toast.error('No se pudo registrar la actividad.');
    } finally {
      setSavingActivity(false);
    }
  };

  const handleQuickReminder = async (days: number, label: string) => {
    try {
      await remindersApi.createQuick({ clientId: id, title: label, daysFromNow: days });
      toast.success('Recordatorio programado.');
    } catch {
      toast.error('No se pudo programar el recordatorio.');
    }
  };

  if (isLoading || !client) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} className="text-brand-500" />
      </div>
    );
  }

  // Construir timeline combinando cotizaciones y actividades
  const timeline = [
    ...client.quotes.map((q) => ({ type: 'quote' as const, date: q.createdAt, data: q })),
    ...client.activities.map((a) => ({ type: 'activity' as const, date: a.occurredAt, data: a })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/clientes')} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
        <ArrowLeft size={16} /> Volver a clientes
      </button>

      <div className="card flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-ink-900">{client.fullName}</h1>
            <ClientStatusBadge status={client.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-500">
            {client.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={14} /> {client.phone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={14} /> {client.email}
              </span>
            )}
            {client.city && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {client.city}{client.comuna ? `, ${client.comuna}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/cotizaciones/nueva?clientId=${client.id}`)} className="btn-primary">
            <Plus size={16} /> Nueva cotización
          </button>
          <button onClick={() => setShowEdit(true)} className="btn-secondary">
            Editar
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 text-sm font-semibold text-ink-700">Recordatorio rápido</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleQuickReminder(1, 'Seguimiento')} className="btn-secondary text-xs">
            En 1 día
          </button>
          <button onClick={() => handleQuickReminder(3, 'Seguimiento')} className="btn-secondary text-xs">
            En 3 días
          </button>
          <button onClick={() => handleQuickReminder(7, 'Seguimiento')} className="btn-secondary text-xs">
            En 7 días
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-700">Línea de tiempo</h3>
            <button onClick={() => setShowActivityForm(true)} className="text-xs font-medium text-brand-600 hover:underline">
              + Registrar actividad
            </button>
          </div>

          {showActivityForm && (
            <form onSubmit={handleAddActivity} className="card space-y-3">
              <select
                className="input-field"
                value={activityForm.type}
                onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as ActivityType })}
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <textarea
                className="input-field"
                placeholder="Comentario"
                rows={2}
                value={activityForm.comment}
                onChange={(e) => setActivityForm({ ...activityForm, comment: e.target.value })}
              />
              <select
                className="input-field"
                value={activityForm.result}
                onChange={(e) => setActivityForm({ ...activityForm, result: e.target.value as ActivityResult })}
              >
                <option value="">Sin resultado definido</option>
                <option value="POSITIVO">Positivo</option>
                <option value="NEUTRO">Neutro</option>
                <option value="NEGATIVO">Negativo</option>
                <option value="SIN_RESPUESTA">Sin respuesta</option>
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowActivityForm(false)} className="btn-secondary text-xs">
                  Cancelar
                </button>
                <button type="submit" disabled={savingActivity} className="btn-primary text-xs">
                  {savingActivity && <Spinner size={14} />}
                  Guardar
                </button>
              </div>
            </form>
          )}

          <div className="card space-y-4">
            {timeline.length === 0 && <p className="text-sm text-ink-400">Aún no hay actividad registrada.</p>}
            {timeline.map((item, i) => (
              <div key={i} className="flex gap-3 border-b border-ink-50 pb-3 last:border-0 last:pb-0">
                <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500">
                  <Clock size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-ink-400">
                    {format(new Date(item.date), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                  </p>
                  {item.type === 'quote' ? (
                    <div className="mt-1">
                      <Link to={`/cotizaciones/${item.data.id}`} className="font-medium text-ink-900 hover:underline">
                        Cotización #{item.data.number}
                      </Link>
                      <QuoteStatusBadge status={item.data.status} />
                    </div>
                  ) : (
                    <div className="mt-1">
                      <span className="font-medium text-ink-900">{item.data.type}</span>
                      {item.data.comment && <p className="text-sm text-ink-600">{item.data.comment}</p>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-ink-700">Cotizaciones</h3>
            <div className="space-y-2">
              {client.quotes.length === 0 && <p className="text-sm text-ink-400">Sin cotizaciones aún.</p>}
              {client.quotes.map((q) => (
                <Link
                  key={q.id}
                  to={`/cotizaciones/${q.id}`}
                  className="flex items-center justify-between rounded-lg border border-ink-100 p-3 hover:bg-ink-50"
                >
                  <span className="text-sm font-medium text-ink-900">#{q.number}</span>
                  <QuoteStatusBadge status={q.status} />
                </Link>
              ))}
            </div>
          </div>

          {client.notes && (
            <div className="card">
              <h3 className="mb-2 text-sm font-semibold text-ink-700">Observaciones</h3>
              <p className="text-sm text-ink-600">{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <ClientFormModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            refreshClient();
          }}
        />
      )}
    </div>
  );
}
