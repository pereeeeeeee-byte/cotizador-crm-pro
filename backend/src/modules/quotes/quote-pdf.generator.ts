import { PDFDocument, PDFFont, PDFPage, rgb, RGB, StandardFonts } from 'pdf-lib';

export interface QuotePdfItem {
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface QuotePdfInstallment {
  description: string;
  amount: number;
  isPaid?: boolean;
}

interface QuotePdfData {
  quoteNumber: number;
  quotePrefix: string;
  date: Date;
  organizationName: string;
  responsibleName?: string | null;
  jobTitle?: string | null;
  rut?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  primaryColorHex?: string | null;

  clientName: string;
  clientPhone?: string | null;
  clientEmail?: string | null;
  clientAddress?: string | null;

  serviceName?: string | null;
  description: string;
  basePrice: number;
  discount: number;
  finalPrice: number;
  paymentTerms?: string | null;
  validUntil?: Date | null;
  currency: string;
  footerNote?: string | null;

  items?: QuotePdfItem[];
  installments?: QuotePdfInstallment[];

  logoBuffer?: Buffer | null;
  signatureBuffer?: Buffer | null;
  useSignature: boolean;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 50;
const FOOTER_LINE_Y = 70;
const FOOTER_TEXT_Y = 50;
const CONTENT_BOTTOM_LIMIT = 100; // por debajo de esto, se debe saltar de página

function hexToRgb(hex?: string | null) {
  const fallback = { r: 0.97, g: 0.8, b: 0.08 }; // amarillo por defecto
  if (!hex) return fallback;
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return fallback;
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return { r, g, b };
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

/**
 * Limpia un texto antes de dibujarlo con pdf-lib. La fuente estándar
 * (WinAnsi) no puede codificar saltos de línea ni otros caracteres de
 * control dentro de una sola llamada a drawText — si el usuario pegó un
 * texto con Enter dentro de un campo de una sola línea (ej. la descripción
 * de un ítem), el salto de línea queda incrustado y pdf-lib lanza un error
 * ("WinAnsi cannot encode...") en vez de ignorarlo. Reemplazamos cualquier
 * salto de línea por un espacio y quitamos otros caracteres de control,
 * dejando el resto del texto intacto (tildes, ñ, etc. sí son soportados).
 */
function sanitizeText(text: string): string {
  return text
    .replace(/\r\n|\r|\n/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Encapsula el estado de "dónde estamos dibujando" a través de posiblemente
 * varias páginas. Cada llamada a ensureSpace() chequea si queda espacio
 * suficiente antes de la siguiente línea; si no, crea una página nueva y
 * continúa desde arriba. Esto es lo que permite que cotizaciones con muchos
 * ítems o muchas cuotas no corten contenido ni se solapen con el footer.
 */
class PdfCursor {
  page: PDFPage;
  y: number;
  pageNumber = 1;

  constructor(
    private pdfDoc: PDFDocument,
    private accent: RGB
  ) {
    this.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - 55;
    this.drawAccentStripe();
  }

  private drawAccentStripe() {
    this.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 12, width: PAGE_WIDTH, height: 12, color: this.accent });
  }

  /** Asegura que queden al menos `needed` puntos de espacio antes del footer; si no, crea página nueva. */
  ensureSpace(needed: number) {
    if (this.y - needed < CONTENT_BOTTOM_LIMIT) {
      this.page = this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.pageNumber += 1;
      this.y = PAGE_HEIGHT - 55;
      this.drawAccentStripe();
    }
  }

  /**
   * Dibuja texto con manejo seguro de errores de codificación. Aunque el
   * texto ya pasó por sanitizeText() antes de llegar aquí, esta es una
   * última línea de defensa: si por algún motivo quedó un carácter que
   * WinAnsi no puede codificar (emoji, símbolo exótico, etc.), se omite ese
   * texto puntual en vez de hacer fallar la generación completa del PDF.
   */
  drawTextSafe(text: string, options: Parameters<PDFPage['drawText']>[1]) {
    try {
      this.page.drawText(text, options);
    } catch {
      try {
        // Reintento quitando cualquier carácter no-ASCII básico como último recurso
        // eslint-disable-next-line no-control-regex
        const fallback = text.replace(/[^\x20-\x7EÁÉÍÓÚáéíóúÑñÜü¿¡€$%.,:;()\-/]/g, '');
        this.page.drawText(fallback, options);
      } catch {
        // Si incluso el fallback falla, omitimos el texto silenciosamente
        // en vez de romper todo el documento.
      }
    }
  }
}

export async function generateQuotePdf(rawData: QuotePdfData): Promise<Uint8Array> {
  // Saneamos TODOS los campos de texto que vienen de datos del usuario (no
  // los textos fijos como "CLIENTE", "DETALLE", que ya son seguros) en un
  // solo punto, antes de cualquier dibujo. Esto evita que un salto de línea
  // pegado accidentalmente en cualquier campo (descripción de la cotización,
  // de un ítem, de una cuota, dirección del cliente, etc.) rompa la
  // generación completa del PDF.
  const data: QuotePdfData = {
    ...rawData,
    organizationName: sanitizeText(rawData.organizationName),
    responsibleName: rawData.responsibleName ? sanitizeText(rawData.responsibleName) : rawData.responsibleName,
    jobTitle: rawData.jobTitle ? sanitizeText(rawData.jobTitle) : rawData.jobTitle,
    rut: rawData.rut ? sanitizeText(rawData.rut) : rawData.rut,
    contactPhone: rawData.contactPhone ? sanitizeText(rawData.contactPhone) : rawData.contactPhone,
    contactEmail: rawData.contactEmail ? sanitizeText(rawData.contactEmail) : rawData.contactEmail,
    clientName: sanitizeText(rawData.clientName),
    clientPhone: rawData.clientPhone ? sanitizeText(rawData.clientPhone) : rawData.clientPhone,
    clientEmail: rawData.clientEmail ? sanitizeText(rawData.clientEmail) : rawData.clientEmail,
    clientAddress: rawData.clientAddress ? sanitizeText(rawData.clientAddress) : rawData.clientAddress,
    serviceName: rawData.serviceName ? sanitizeText(rawData.serviceName) : rawData.serviceName,
    description: sanitizeText(rawData.description),
    paymentTerms: rawData.paymentTerms ? sanitizeText(rawData.paymentTerms) : rawData.paymentTerms,
    footerNote: rawData.footerNote ? sanitizeText(rawData.footerNote) : rawData.footerNote,
    items: rawData.items?.map((item) => ({ ...item, description: sanitizeText(item.description) })),
    installments: rawData.installments?.map((inst) => ({ ...inst, description: sanitizeText(inst.description) })),
  };

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const accentRgbValues = hexToRgb(data.primaryColorHex);
  const accent = rgb(accentRgbValues.r, accentRgbValues.g, accentRgbValues.b);
  const dark = rgb(0.1, 0.1, 0.12);
  const gray = rgb(0.45, 0.45, 0.48);

  const cursor = new PdfCursor(pdfDoc, accent);

  // --- Encabezado: logo + datos de la empresa ---
  const HEADER_LOGO_MAX_W = 160;
  const HEADER_LOGO_MAX_H = 95;
  const HEADER_TEXT_X = 225;

  let logoHeight = 0;
  if (data.logoBuffer) {
    try {
      let image;
      try {
        image = await pdfDoc.embedPng(data.logoBuffer);
      } catch {
        image = await pdfDoc.embedJpg(data.logoBuffer);
      }
      const scale = Math.min(HEADER_LOGO_MAX_W / image.width, HEADER_LOGO_MAX_H / image.height, 1);
      const w = image.width * scale;
      const h = image.height * scale;
      logoHeight = h;
      cursor.page.drawImage(image, { x: 45, y: PAGE_HEIGHT - 30 - h, width: w, height: h });
    } catch {
      // Si el logo no se puede decodificar, simplemente se omite sin romper el PDF.
    }
  }

  let headerY = logoHeight > 0 ? PAGE_HEIGHT - 45 - logoHeight / 2 + 18 : cursor.y;
  cursor.drawTextSafe(data.organizationName, { x: HEADER_TEXT_X, y: headerY, size: 16, font: fontBold, color: dark });
  headerY -= 18;
  if (data.responsibleName) {
    cursor.drawTextSafe(`${data.responsibleName}${data.jobTitle ? ' · ' + data.jobTitle : ''}`, {
      x: HEADER_TEXT_X,
      y: headerY,
      size: 10,
      font: fontRegular,
      color: gray,
    });
    headerY -= 14;
  }
  const contactLine = [data.contactPhone, data.contactEmail].filter(Boolean).join('  ·  ');
  if (contactLine) {
    cursor.drawTextSafe(contactLine, { x: HEADER_TEXT_X, y: headerY, size: 10, font: fontRegular, color: gray });
  }

  cursor.y = PAGE_HEIGHT - Math.max(140, 50 + logoHeight + 20);
  cursor.page.drawLine({
    start: { x: MARGIN_X, y: cursor.y },
    end: { x: PAGE_WIDTH - MARGIN_X, y: cursor.y },
    thickness: 1,
    color: gray,
  });
  cursor.y -= 30;

  // --- Título cotización ---
  const quoteCode = `${data.quotePrefix}-${String(data.quoteNumber).padStart(5, '0')}`;
  cursor.drawTextSafe('COTIZACIÓN', { x: MARGIN_X, y: cursor.y, size: 20, font: fontBold, color: dark });
  cursor.drawTextSafe(quoteCode, {
    x: PAGE_WIDTH - 200,
    y: cursor.y,
    size: 14,
    font: fontBold,
    color: accent,
  });
  cursor.y -= 18;
  cursor.drawTextSafe(`Fecha: ${data.date.toLocaleDateString('es-CL')}`, {
    x: PAGE_WIDTH - 200,
    y: cursor.y,
    size: 10,
    font: fontRegular,
    color: gray,
  });
  cursor.y -= 35;

  // --- Datos del cliente ---
  cursor.drawTextSafe('CLIENTE', { x: MARGIN_X, y: cursor.y, size: 11, font: fontBold, color: gray });
  cursor.y -= 16;
  cursor.drawTextSafe(data.clientName, { x: MARGIN_X, y: cursor.y, size: 12, font: fontBold, color: dark });
  cursor.y -= 16;
  if (data.clientPhone) {
    cursor.drawTextSafe(`Tel: ${data.clientPhone}`, { x: MARGIN_X, y: cursor.y, size: 10, font: fontRegular, color: gray });
    cursor.y -= 14;
  }
  if (data.clientEmail) {
    cursor.drawTextSafe(`Correo: ${data.clientEmail}`, { x: MARGIN_X, y: cursor.y, size: 10, font: fontRegular, color: gray });
    cursor.y -= 14;
  }
  if (data.clientAddress) {
    cursor.drawTextSafe(`Dirección: ${data.clientAddress}`, { x: MARGIN_X, y: cursor.y, size: 10, font: fontRegular, color: gray });
    cursor.y -= 14;
  }

  cursor.y -= 20;

  // --- Servicio / Descripción ---
  if (data.serviceName) {
    cursor.ensureSpace(40);
    cursor.drawTextSafe('SERVICIO', { x: MARGIN_X, y: cursor.y, size: 11, font: fontBold, color: gray });
    cursor.y -= 16;
    cursor.drawTextSafe(data.serviceName, { x: MARGIN_X, y: cursor.y, size: 12, font: fontBold, color: dark });
    cursor.y -= 20;
  }

  cursor.ensureSpace(20);
  cursor.drawTextSafe('DESCRIPCIÓN', { x: MARGIN_X, y: cursor.y, size: 11, font: fontBold, color: gray });
  cursor.y -= 16;

  const maxLineWidth = PAGE_WIDTH - 100;
  const words = data.description.split(' ');
  let line = '';
  const descFontSize = 10.5;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = fontRegular.widthOfTextAtSize(testLine, descFontSize);
    if (testWidth > maxLineWidth) {
      cursor.ensureSpace(15);
      cursor.drawTextSafe(line, { x: MARGIN_X, y: cursor.y, size: descFontSize, font: fontRegular, color: dark });
      cursor.y -= 15;
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) {
    cursor.ensureSpace(15);
    cursor.drawTextSafe(line, { x: MARGIN_X, y: cursor.y, size: descFontSize, font: fontRegular, color: dark });
    cursor.y -= 15;
  }

  cursor.y -= 20;

  // --- Tabla de ítems (si la cotización usa ítems en vez de modo simple) ---
  if (data.items && data.items.length > 0) {
    cursor.ensureSpace(30);
    cursor.drawTextSafe('DETALLE', { x: MARGIN_X, y: cursor.y, size: 11, font: fontBold, color: gray });
    cursor.y -= 18;

    const colDescX = MARGIN_X + 8;
    const colUnitX = PAGE_WIDTH - 280;
    const colQtyX = PAGE_WIDTH - 180;
    const colTotalX = PAGE_WIDTH - 110;

    const drawTableHeader = () => {
      cursor.page.drawRectangle({
        x: MARGIN_X,
        y: cursor.y - 6,
        width: PAGE_WIDTH - MARGIN_X * 2,
        height: 22,
        color: rgb(0.95, 0.95, 0.95),
      });
      cursor.drawTextSafe('Ítem', { x: colDescX, y: cursor.y, size: 9.5, font: fontBold, color: gray });
      cursor.drawTextSafe('P. Unitario', { x: colUnitX, y: cursor.y, size: 9.5, font: fontBold, color: gray });
      cursor.drawTextSafe('Cant.', { x: colQtyX, y: cursor.y, size: 9.5, font: fontBold, color: gray });
      cursor.drawTextSafe('Total', { x: colTotalX, y: cursor.y, size: 9.5, font: fontBold, color: gray });
      cursor.y -= 22;
    };

    cursor.ensureSpace(22);
    drawTableHeader();

    for (const item of data.items) {
      const itemMaxWidth = colUnitX - colDescX - 10;
      const itemWords = item.description.split(' ');
      const itemLines: string[] = [];
      let itemLine = '';
      for (const word of itemWords) {
        const testLine = itemLine ? `${itemLine} ${word}` : word;
        if (fontRegular.widthOfTextAtSize(testLine, 9.5) > itemMaxWidth) {
          itemLines.push(itemLine);
          itemLine = word;
        } else {
          itemLine = testLine;
        }
      }
      if (itemLine) itemLines.push(itemLine);

      const rowHeight = Math.max(18, itemLines.length * 12 + 6);
      const yBeforeRow = cursor.y;
      cursor.ensureSpace(rowHeight + 4);
      // Si la página cambió (ensureSpace creó una nueva), repetimos el encabezado
      if (cursor.y !== yBeforeRow - 0 && cursor.y === PAGE_HEIGHT - 55) {
        drawTableHeader();
      }

      let lineY = cursor.y;
      for (const l of itemLines) {
        cursor.drawTextSafe(l, { x: colDescX, y: lineY, size: 9.5, font: fontRegular, color: dark });
        lineY -= 12;
      }
      cursor.drawTextSafe(formatCurrency(item.unitPrice, data.currency), {
        x: colUnitX,
        y: cursor.y,
        size: 9.5,
        font: fontRegular,
        color: dark,
      });
      cursor.drawTextSafe(String(item.quantity), { x: colQtyX, y: cursor.y, size: 9.5, font: fontRegular, color: dark });
      cursor.drawTextSafe(formatCurrency(item.total, data.currency), {
        x: colTotalX,
        y: cursor.y,
        size: 9.5,
        font: fontBold,
        color: dark,
      });

      cursor.y -= rowHeight;
      cursor.page.drawLine({
        start: { x: MARGIN_X, y: cursor.y + 4 },
        end: { x: PAGE_WIDTH - MARGIN_X, y: cursor.y + 4 },
        thickness: 0.5,
        color: rgb(0.92, 0.92, 0.92),
      });
    }

    cursor.y -= 10;
  }

  // --- Tabla de valores (resumen) ---
  cursor.ensureSpace(95);
  cursor.page.drawRectangle({
    x: MARGIN_X,
    y: cursor.y - 80,
    width: PAGE_WIDTH - MARGIN_X * 2,
    height: 90,
    color: rgb(0.97, 0.97, 0.97),
  });
  cursor.y -= 15;

  const drawSummaryRow = (label: string, value: string, bold = false) => {
    cursor.drawTextSafe(label, { x: MARGIN_X + 15, y: cursor.y, size: 11, font: fontRegular, color: gray });
    cursor.drawTextSafe(value, {
      x: PAGE_WIDTH - 65 - fontBold.widthOfTextAtSize(value, 12),
      y: cursor.y,
      size: bold ? 13 : 11,
      font: bold ? fontBold : fontRegular,
      color: dark,
    });
    cursor.y -= 20;
  };

  drawSummaryRow(
    data.items && data.items.length > 0 ? 'Subtotal' : 'Precio base',
    formatCurrency(data.basePrice, data.currency)
  );
  if (data.discount > 0) {
    drawSummaryRow('Descuento', `- ${formatCurrency(data.discount, data.currency)}`);
  }
  drawSummaryRow('VALOR TOTAL', formatCurrency(data.finalPrice, data.currency), true);

  cursor.y -= 15;

  // --- Cuotas de pago (si la cotización usa cuotas configurables) ---
  if (data.installments && data.installments.length > 0) {
    cursor.ensureSpace(24 + data.installments.length * 16);
    cursor.drawTextSafe('FORMA DE PAGO', { x: MARGIN_X, y: cursor.y, size: 11, font: fontBold, color: gray });
    cursor.y -= 18;

    data.installments.forEach((inst, index) => {
      cursor.ensureSpace(16);
      const label = `${index + 1}. ${inst.description}`;
      cursor.drawTextSafe(label, { x: MARGIN_X, y: cursor.y, size: 10, font: fontRegular, color: dark });
      const amountText = formatCurrency(inst.amount, data.currency);
      cursor.drawTextSafe(amountText, {
        x: PAGE_WIDTH - MARGIN_X - fontBold.widthOfTextAtSize(amountText, 10),
        y: cursor.y,
        size: 10,
        font: fontBold,
        color: dark,
      });
      cursor.y -= 16;
    });
    cursor.y -= 10;
  } else if (data.paymentTerms) {
    cursor.ensureSpace(16);
    cursor.drawTextSafe(`Forma de pago: ${data.paymentTerms}`, { x: MARGIN_X, y: cursor.y, size: 10, font: fontRegular, color: gray });
    cursor.y -= 16;
  }

  if (data.validUntil) {
    cursor.ensureSpace(16);
    cursor.drawTextSafe(`Vigencia de la cotización: ${data.validUntil.toLocaleDateString('es-CL')}`, {
      x: MARGIN_X,
      y: cursor.y,
      size: 10,
      font: fontRegular,
      color: gray,
    });
    cursor.y -= 16;
  }

  // --- Firma ---
  // El bloque de identidad (nombre, profesión, RUT) se muestra siempre que
  // haya datos del responsable. Se reserva espacio suficiente para la
  // imagen + línea + hasta 3 líneas de texto; si no cabe en la página
  // actual, se salta a una nueva en vez de solaparse con el footer.
  //
  // IMPORTANTE: ensureSpace garantiza que cursor.y - needed >= 100, pero NO
  // garantiza que cursor.y quede holgado — puede quedar justo en el mínimo.
  // Por eso sigY se calcula pidiendo el espacio exacto que el bloque de
  // firma necesita (constante SIGNATURE_BLOCK_HEIGHT) y luego posicionando
  // la firma directamente desde cursor.y, en vez de un valor fijo "ideal"
  // de 150 que podía terminar más abajo que el footer en cotizaciones
  // largas (muchos ítems o muchas cuotas).
  const SIGNATURE_BLOCK_HEIGHT = 95; // imagen + línea + hasta 3 líneas de texto
  cursor.ensureSpace(SIGNATURE_BLOCK_HEIGHT);
  const sigY = cursor.y - 15;

  if (data.useSignature && data.signatureBuffer) {
    try {
      let sigImage;
      try {
        sigImage = await pdfDoc.embedPng(data.signatureBuffer);
      } catch {
        sigImage = await pdfDoc.embedJpg(data.signatureBuffer);
      }
      const sigMaxW = 140;
      const sigMaxH = 60;
      const scale = Math.min(sigMaxW / sigImage.width, sigMaxH / sigImage.height, 1);
      const w = sigImage.width * scale;
      const h = sigImage.height * scale;
      cursor.page.drawImage(sigImage, { x: MARGIN_X, y: sigY, width: w, height: h });
    } catch {
      // Si la firma no se puede decodificar, se omite sin romper el PDF.
    }
  }

  if (data.responsibleName || data.organizationName) {
    cursor.page.drawLine({
      start: { x: MARGIN_X, y: sigY - 5 },
      end: { x: 220, y: sigY - 5 },
      thickness: 0.5,
      color: gray,
    });

    let signatureLineY = sigY - 18;
    cursor.drawTextSafe(data.responsibleName ?? data.organizationName, {
      x: MARGIN_X,
      y: signatureLineY,
      size: 9,
      font: fontBold,
      color: dark,
    });

    if (data.jobTitle) {
      signatureLineY -= 13;
      cursor.drawTextSafe(data.jobTitle, { x: MARGIN_X, y: signatureLineY, size: 8.5, font: fontRegular, color: gray });
    }

    if (data.rut) {
      signatureLineY -= 13;
      cursor.drawTextSafe(`RUT: ${data.rut}`, { x: MARGIN_X, y: signatureLineY, size: 8.5, font: fontRegular, color: gray });
    }
  }

  // --- Footer en todas las páginas generadas ---
  const footerNote = data.footerNote ?? 'Documento generado por Quotia';
  const allPages = pdfDoc.getPages();
  for (const page of allPages) {
    page.drawLine({
      start: { x: MARGIN_X, y: FOOTER_LINE_Y },
      end: { x: PAGE_WIDTH - MARGIN_X, y: FOOTER_LINE_Y },
      thickness: 0.5,
      color: gray,
    });
    page.drawText(footerNote, { x: MARGIN_X, y: FOOTER_TEXT_Y, size: 8, font: fontRegular, color: gray });
  }

  return pdfDoc.save();
}
