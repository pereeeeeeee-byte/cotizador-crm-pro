export interface QuoteTip {
  kind: 'consejo' | 'dato';
  text: string;
  /** Solo para datos: de dónde sale la cifra o afirmación */
  source?: string;
}

/**
 * Consejos para quien cotiza. Los "datos" llevan su fuente: no se agregan
 * cifras sin respaldo verificable. Para sumar uno, citar el estudio original.
 */
export const QUOTE_TIPS: QuoteTip[] = [
  { kind: 'consejo', text: 'Define siempre una vigencia. Una cotización sin fecha límite se puede dejar "para después" indefinidamente.' },
  { kind: 'consejo', text: 'Divide el pago en cuotas por hito: el cliente ve avance y tú reduces el riesgo de quedar sin cobrar.' },
  { kind: 'consejo', text: 'Escribe qué incluye el trabajo y también qué NO incluye. Evita la mayoría de las discusiones posteriores.' },
  { kind: 'consejo', text: 'Muestra un valor total claro. Si el cliente tiene que sumar por su cuenta, es más fácil que dude.' },
  { kind: 'consejo', text: 'Si pasan 2 o 3 días sin respuesta, un mensaje breve preguntando si tiene dudas suele reactivar la conversación.' },
  { kind: 'consejo', text: 'Pide la primera cuota al aceptar la cotización: formaliza el acuerdo y compromete ambas partes.' },
  { kind: 'consejo', text: 'Aclara quién paga derechos y gastos de terceros (notaría, municipalidad, SAG, conservador). Es una duda frecuente del cliente.' },
  { kind: 'consejo', text: 'No compitas solo por precio: muestra qué incluye tu servicio, tu experiencia y tu forma de trabajar.' },
  { kind: 'consejo', text: 'Tu firma, tu RUT y un archivo con nombre claro (COT-01234 Cliente.pdf) transmiten formalidad antes de que el cliente lea el detalle.' },
  { kind: 'consejo', text: 'Registra cada llamada, visita y mensaje en la ficha del cliente: así retomas cualquier conversación sin depender de la memoria.' },
  { kind: 'consejo', text: 'Separa la visita técnica del trabajo principal: te permite cobrar el diagnóstico aunque el cliente no siga adelante.' },
  { kind: 'consejo', text: 'Una cotización aceptada es un respaldo de experiencia. Guárdala: te sirve para licitaciones y para mostrar tu trayectoria.' },
  { kind: 'consejo', text: 'Cotiza mientras el cliente aún está interesado. Cuanto más tardas, más cotizaciones de la competencia se acumulan en su WhatsApp.' },
  {
    kind: 'dato',
    text: 'La mayoría de las empresas responde demasiado lento a las consultas de nuevos clientes, y quienes responden dentro de la primera hora tienen muchas más probabilidades de hablar con quien decide.',
    source: 'Harvard Business Review, "The Short Life of Online Sales Leads" (2011)',
  },
  {
    kind: 'dato',
    text: 'Un 70% de los consultados en Chile dice haber dejado de comprarle a alguna empresa por perder la confianza en ella.',
    source: 'Estudio de confianza empresarial reportado por Pauta (mayo 2026)',
  },
  {
    kind: 'dato',
    text: 'El 86% de los problemas de confianza de los consumidores chilenos se relaciona con fallas del producto o servicio, o con cobros indebidos. Claridad en lo que cobras = confianza.',
    source: 'PwC Chile, Estudio de Confianza 2024',
  },
];
