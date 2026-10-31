/**
 * Nombre legible del archivo PDF de una cotización, por ejemplo
 * "COT-01060 Manuel Caro" (sin extensión). Se usa tanto al guardar el PDF
 * como al compartirlo, para que el cliente reciba un archivo con nombre claro.
 */
export function buildQuoteFileBaseName(prefix: string | null | undefined, number: number, clientName: string): string {
  const code = `${prefix || 'COT'}-${String(number).padStart(5, '0')}`;
  const client = clientName
    // caracteres no permitidos en nombres de archivo o problemáticos en URLs
    .replace(/[\\/:*?"<>|#%&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return client ? `${code} ${client}` : code;
}

/** Versión sin espacios ni tildes para usar como identificador en la URL de almacenamiento. */
export function slugifyFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
