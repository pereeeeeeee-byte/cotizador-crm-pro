import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, FileText, TrendingUp, DollarSign } from 'lucide-react';
import { dashboardApi } from '@/api/resources.api';
import { DashboardSummary, DashboardCharts } from '@/types';

function formatCLP(value: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-medium text-ink-500">{label}</p>
        <p className="text-xl font-bold text-ink-900">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
  });

  const { data: charts } = useQuery<DashboardCharts>({
    queryKey: ['dashboard-charts'],
    queryFn: () => dashboardApi.charts(6),
  });

  const chartData = charts?.months.map((m, i) => ({
    month: m.slice(5),
    clientes: charts.clientsByMonth[i],
    cotizaciones: charts.quotesByMonth[i],
    ventas: charts.salesByMonth[i],
    conversion: charts.conversionByMonth[i],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500">Resumen de tu actividad comercial</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Clientes totales" value={String(summary?.totalClients ?? 0)} accent="bg-blue-50 text-blue-600" />
        <KpiCard icon={FileText} label="Cotizaciones este mes" value={String(summary?.quotesThisMonth ?? 0)} accent="bg-purple-50 text-purple-600" />
        <KpiCard icon={TrendingUp} label="Conversión" value={`${summary?.conversionRate ?? 0}%`} accent="bg-emerald-50 text-emerald-600" />
        <KpiCard icon={DollarSign} label="Ventas este mes" value={formatCLP(summary?.salesThisMonth ?? 0)} accent="bg-brand-50 text-brand-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-ink-700">Clientes y cotizaciones por mes</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="clientes" stroke="#3b82f6" strokeWidth={2} name="Clientes" />
              <Line type="monotone" dataKey="cotizaciones" stroke="#eab308" strokeWidth={2} name="Cotizaciones" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-ink-700">Ventas mensuales (CLP)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCLP(v)} />
              <Bar dataKey="ventas" fill="#facc15" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-ink-700">Conversión mensual (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="conversion" stroke="#10b981" strokeWidth={2} name="Conversión %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-ink-700">Servicios más vendidos</h3>
          <div className="space-y-3">
            {charts?.topServices.length ? (
              charts.topServices.map((s) => (
                <div key={s.serviceId} className="flex items-center justify-between">
                  <span className="text-sm text-ink-700">{s.serviceName}</span>
                  <span className="badge bg-brand-50 text-brand-700">{s.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-400">Aún no hay cotizaciones aceptadas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
