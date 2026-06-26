import { Plus, Trash2 } from 'lucide-react';
import { QuoteItem } from '@/types';

interface Props {
  items: QuoteItem[];
  onChange: (items: QuoteItem[]) => void;
}

function formatCLP(value: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
}

/**
 * Tabla editable de ítems de cotización, estilo "Ítem / Precio Unitario /
 * Cantidad / Total" — igual al formato que ya usa el profesional en sus
 * cotizaciones manuales (ej. subdivisión por lote, donde cada lote es una
 * línea con su propio precio y cantidad).
 */
export function QuoteItemsTable({ items, onChange }: Props) {
  const addItem = () => {
    onChange([...items, { description: '', unitPrice: 0, quantity: 1 }]);
  };

  const updateItem = (index: number, patch: Partial<QuoteItem>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="hidden grid-cols-[1fr_120px_70px_120px_32px] gap-2 px-1 text-xs font-medium text-ink-500 sm:grid">
          <span>Ítem</span>
          <span>P. unitario</span>
          <span>Cant.</span>
          <span className="text-right">Total</span>
          <span />
        </div>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-2 rounded-lg border border-ink-100 p-2 sm:grid-cols-[1fr_120px_70px_120px_32px] sm:border-0 sm:p-0"
        >
          <input
            className="input-field"
            placeholder="Descripción del ítem"
            value={item.description}
            onChange={(e) => updateItem(index, { description: e.target.value })}
          />
          <div>
            <span className="mb-1 block text-xs text-ink-500 sm:hidden">Precio unitario (CLP)</span>
            <input
              className="input-field"
              type="number"
              placeholder="Precio unitario"
              value={item.unitPrice || ''}
              onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
            />
          </div>
          <div>
            <span className="mb-1 block text-xs text-ink-500 sm:hidden">Cantidad</span>
            <input
              className="input-field"
              type="number"
              min={0.01}
              step="any"
              placeholder="Cantidad"
              value={item.quantity || ''}
              onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center justify-between sm:justify-end sm:px-0">
            <span className="text-xs text-ink-500 sm:hidden">Total línea</span>
            <span className="text-sm font-medium text-ink-900">{formatCLP(item.unitPrice * item.quantity)}</span>
          </div>
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="flex items-center justify-center gap-2 text-ink-400 hover:text-red-600 sm:justify-self-end"
          >
            <Trash2 size={16} />
            <span className="text-sm sm:hidden">Quitar ítem</span>
          </button>
        </div>
      ))}

      <button type="button" onClick={addItem} className="btn-secondary text-xs">
        <Plus size={14} /> Agregar ítem
      </button>

      {items.length > 0 && (
        <div className="flex justify-end border-t border-ink-100 pt-2 text-sm">
          <span className="text-ink-500">Subtotal: </span>
          <span className="ml-2 font-semibold text-ink-900">{formatCLP(total)}</span>
        </div>
      )}
    </div>
  );
}
