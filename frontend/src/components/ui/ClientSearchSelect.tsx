import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { Client } from '@/types';

interface Props {
  clients: Client[];
  value: string;
  onChange: (clientId: string) => void;
  placeholder?: string;
}

/**
 * Selector de cliente con búsqueda por escritura. Reemplaza un <select>
 * plano por un input filtrable, pensado para organizaciones con muchos
 * clientes donde desplazarse por una lista larga es poco práctico. Filtra
 * por nombre, teléfono y correo, y permite escribir cualquier parte del
 * texto (no solo el inicio).
 */
export function ClientSearchSelect({ clients, value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find((c) => c.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) =>
      [c.fullName, c.phone, c.email].filter(Boolean).some((field) => field!.toLowerCase().includes(term))
    );
  }, [clients, query]);

  const handleSelect = (client: Client) => {
    onChange(client.id);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {selectedClient && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="input-field flex w-full items-center justify-between text-left"
        >
          <span className="truncate text-ink-900">{selectedClient.fullName}</span>
          <span className="flex items-center gap-1 text-ink-400">
            <X size={14} onClick={handleClear} className="hover:text-red-500" />
            <ChevronDown size={14} />
          </span>
        </button>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={15} />
          <input
            className="input-field pl-9"
            placeholder={placeholder ?? 'Busca por nombre, teléfono o correo...'}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            autoFocus={open}
          />
        </div>
      )}

      {open && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-ink-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-ink-400">No se encontraron clientes.</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-ink-50"
              >
                <span className="text-sm font-medium text-ink-900">{c.fullName}</span>
                {(c.phone || c.email) && (
                  <span className="text-xs text-ink-400">{[c.phone, c.email].filter(Boolean).join(' · ')}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
