import { FileCheck } from 'lucide-react';

/**
 * Botón de plantilla rápida "Regularización Ley 20.898" — exclusivo para
 * la cuenta de DC Topografía. Al hacer click, pre-rellena el formulario de
 * cotización con los valores estándar del servicio: descripción, 7 ítems
 * típicos del trámite, y las 3 cuotas de pago por hito. El usuario puede
 * ajustar cualquier valor antes de guardar.
 *
 * El componente solo se renderiza si el email del usuario logueado es
 * dctopografia.cl@gmail.com — para todos los demás usuarios de Quotia
 * no existe ni se muestra.
 */

export interface Ley20898TemplateData {
  description: string;
  items: { description: string; unitPrice: number; quantity: number }[];
  installments: { description: string; amountType: 'FIXED'; fixedAmount: number }[];
  paymentTerms: string;
  validUntil: string;
}

// Valores fijos del servicio. El profesional puede ajustar los precios
// unitarios en el formulario antes de enviar.
const TEMPLATE_DATA: Ley20898TemplateData = {
  description:
    'Se cotiza la gestión integral para la regularización de vivienda existente ' +
    'conforme a la Ley N° 20.898, ante la Dirección de Obras Municipales correspondiente. ' +
    'El servicio incluye todas las gestiones técnicas y administrativas necesarias ' +
    'para la obtención del Certificado de Regularización.',

  items: [
    {
      description: 'Visita técnica y levantamiento de medidas en terreno',
      unitPrice: 80000,
      quantity: 1,
    },
    {
      description:
        'Elaboración de planos arquitectónicos (emplazamiento, planta, corte representativo y cuadro de superficies)',
      unitPrice: 120000,
      quantity: 1,
    },
    {
      description: 'Preparación de memoria descriptiva e informe técnico (INF)',
      unitPrice: 80000,
      quantity: 1,
    },
    {
      description: 'Elaboración de documento de acreditación de antigüedad de la vivienda',
      unitPrice: 50000,
      quantity: 1,
    },
    {
      description: 'Compilación del expediente técnico conforme a normativa vigente',
      unitPrice: 50000,
      quantity: 1,
    },
    {
      description: 'Ingreso del expediente a la Dirección de Obras Municipales',
      unitPrice: 70000,
      quantity: 1,
    },
    {
      description: 'Seguimiento del trámite hasta la obtención del Certificado de Regularización',
      unitPrice: 50000,
      quantity: 1,
    },
  ],

  installments: [
    {
      description: 'Primera cuota — al momento de realizar la medición del inmueble',
      amountType: 'FIXED',
      fixedAmount: 200000,
    },
    {
      description: 'Segunda cuota — al ingreso del expediente a la Dirección de Obras Municipales',
      amountType: 'FIXED',
      fixedAmount: 150000,
    },
    {
      description: 'Tercera cuota — contra entrega del Certificado de Regularización aprobado',
      amountType: 'FIXED',
      fixedAmount: 150000,
    },
  ],

  paymentTerms: 'Pago en 3 cuotas según avance del trámite',

  // Vigencia por defecto: 15 días desde hoy
  validUntil: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  })(),
};

interface Props {
  userEmail: string | null | undefined;
  onApply: (data: Ley20898TemplateData) => void;
}

export function QuickTemplateLey20898({ userEmail, onApply }: Props) {
  // Solo visible para la cuenta de DC Topografía
  if (userEmail !== 'dctopografia.cl@gmail.com') return null;

  return (
    <div className="rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/30 p-4">
      <div className="mb-2 flex items-center gap-2">
        <FileCheck size={18} className="text-brand-600" />
        <h3 className="text-sm font-semibold text-ink-900">Plantilla DC Topografía</h3>
      </div>
      <p className="mb-3 text-xs text-ink-500">
        Pre-rellena el formulario con los valores estándar de una regularización Ley 20.898.
        Puedes ajustar cualquier precio antes de enviar.
      </p>
      <button
        type="button"
        onClick={() => onApply(TEMPLATE_DATA)}
        className="btn-secondary text-xs"
      >
        <FileCheck size={13} />
        Usar plantilla Regularización Ley 20.898
      </button>
    </div>
  );
}
