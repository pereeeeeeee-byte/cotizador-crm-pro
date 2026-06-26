import { Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { QuoteInstallment } from '@/types';
import clsx from 'clsx';

interface Props {
  installments: QuoteInstallment[];
  onChange: (installments: QuoteInstallment[]) => void;
  total: number;
}

function formatCLP(value: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
}

function resolveAmount(inst: QuoteInstallment, total: number): number {
  if (inst.amountType === 'FIXED') return Number(inst.fixedAmount ?? 0);
  return Math.round((total * Number(inst.percentage ?? 0)) / 100);
}

/**
 * Lista editable de cuotas de pago ligadas a hitos de avance del proyecto
 * (ej. "Al ingresar expediente a DOM"), no a fechas. Cada cuota puede
 * definirse como monto fijo en pesos o como porcentaje del total — el
 * profesional elige caso a caso según cómo está distribuido el trabajo
 * real, igual a como ya cotiza en sus documentos manuales.
 */
export function QuoteInstallmentsEditor({ installments, onChange, total }: Props) {
  const addInstallment = () => {
    onChange([...installments, { description: '', amountType: 'PERCENTAGE', percentage: 0 }]);
  };

  const updateInstallment = (index: number, patch: Partial<QuoteInstallment>) => {
    const next = installments.map((inst, i) => (i === index ? { ...inst, ...patch } : inst));
    onChange(next);
  };

  const removeInstallment = (index: number) => {
    onChange(installments.filter((_, i) => i !== index));
  };

  const sum = installments.reduce((acc, inst) => acc + resolveAmount(inst, total), 0);
  const diff = total - sum;
  const matches = installments.length > 0 && Math.abs(diff) <= installments.length;

  return (
    <div className="space-y-2">
      {installments.map((inst, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-lg border border-ink-100 p-3 sm:flex-row sm:items-center">
          <input
            className="input-field flex-1"
            placeholder={`Ej: Cuota ${index + 1} - al ingresar expediente`}
            value={inst.description}
            onChange={(e) => updateInstallment(index, { description: e.target.value })}
          />
          <select
            className="input-field w-full sm:w-32"
            value={inst.amountType}
            onChange={(e) =>
              updateInstallment(index, {
                amountType: e.target.value as 'FIXED' | 'PERCENTAGE',
              })
            }
          >
            <option value="PERCENTAGE">Porcentaje</option>
            <option value="FIXED">Monto fijo</option>
          </select>
          {inst.amountType === 'PERCENTAGE' ? (
            <div className="relative w-full sm:w-28">
              <input
                className="input-field pr-7"
                type="number"
                min={0}
                max={100}
                placeholder="0"
                value={inst.percentage ?? ''}
                onChange={(e) => updateInstallment(index, { percentage: Number(e.target.value) })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">%</span>
            </div>
          ) : (
            <input
              className="input-field w-full sm:w-32"
              type="number"
              placeholder="0"
              value={inst.fixedAmount ?? ''}
              onChange={(e) => updateInstallment(index, { fixedAmount: Number(e.target.value) })}
            />
          )}
          <span className="w-28 text-right text-sm font-medium text-ink-900">{formatCLP(resolveAmount(inst, total))}</span>
          <button type="button" onClick={() => removeInstallment(index)} className="text-ink-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button type="button" onClick={addInstallment} className="btn-secondary text-xs">
        <Plus size={14} /> Agregar cuota
      </button>

      {installments.length > 0 && (
        <div
          className={clsx(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
            matches ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          )}
        >
          {matches ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {matches
            ? `Las cuotas suman ${formatCLP(sum)}, igual al total de la cotización.`
            : `Las cuotas suman ${formatCLP(sum)}. Faltan o sobran ${formatCLP(Math.abs(diff))} respecto al total (${formatCLP(total)}).`}
        </div>
      )}
    </div>
  );
}
