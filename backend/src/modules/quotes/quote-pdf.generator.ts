import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface QuotePdfData {
  quoteNumber: number;
  quotePrefix: string;
  date: Date;
  organizationName: string;
  responsibleName?: string | null;
  jobTitle?: string | null;
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

  logoBuffer?: Buffer | null;
  signatureBuffer?: Buffer | null;
  useSignature: boolean;
}

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

export async function generateQuotePdf(data: QuotePdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const accent = hexToRgb(data.primaryColorHex);
  const dark = rgb(0.1, 0.1, 0.12);
  const gray = rgb(0.45, 0.45, 0.48);

  let cursorY = height - 50;

  // --- Encabezado: franja de color + logo ---
  page.drawRectangle({ x: 0, y: height - 12, width, height: 12, color: rgb(accent.r, accent.g, accent.b) });

  if (data.logoBuffer) {
    try {
      let image;
      try {
        image = await pdfDoc.embedPng(data.logoBuffer);
      } catch {
        image = await pdfDoc.embedJpg(data.logoBuffer);
      }
      const maxW = 110;
      const maxH = 60;
      const scale = Math.min(maxW / image.width, maxH / image.height, 1);
      const w = image.width * scale;
      const h = image.height * scale;
      page.drawImage(image, { x: 50, y: cursorY - h + 20, width: w, height: h });
    } catch {
      // Si el logo no se puede decodificar, simplemente se omite sin romper el PDF.
    }
  }

  page.drawText(data.organizationName, { x: 180, y: cursorY, size: 16, font: fontBold, color: dark });
  cursorY -= 18;
  if (data.responsibleName) {
    page.drawText(`${data.responsibleName}${data.jobTitle ? ' · ' + data.jobTitle : ''}`, {
      x: 180,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: gray,
    });
    cursorY -= 14;
  }
  const contactLine = [data.contactPhone, data.contactEmail].filter(Boolean).join('  ·  ');
  if (contactLine) {
    page.drawText(contactLine, { x: 180, y: cursorY, size: 10, font: fontRegular, color: gray });
  }

  cursorY = height - 130;
  page.drawLine({ start: { x: 50, y: cursorY }, end: { x: width - 50, y: cursorY }, thickness: 1, color: gray });
  cursorY -= 30;

  // --- Título cotización ---
  const quoteCode = `${data.quotePrefix}-${String(data.quoteNumber).padStart(5, '0')}`;
  page.drawText('COTIZACIÓN', { x: 50, y: cursorY, size: 20, font: fontBold, color: dark });
  page.drawText(quoteCode, { x: width - 200, y: cursorY, size: 14, font: fontBold, color: rgb(accent.r, accent.g, accent.b) });
  cursorY -= 18;
  page.drawText(`Fecha: ${data.date.toLocaleDateString('es-CL')}`, { x: width - 200, y: cursorY, size: 10, font: fontRegular, color: gray });
  cursorY -= 35;

  // --- Datos del cliente ---
  page.drawText('CLIENTE', { x: 50, y: cursorY, size: 11, font: fontBold, color: gray });
  cursorY -= 16;
  page.drawText(data.clientName, { x: 50, y: cursorY, size: 12, font: fontBold, color: dark });
  cursorY -= 16;
  if (data.clientPhone) {
    page.drawText(`Tel: ${data.clientPhone}`, { x: 50, y: cursorY, size: 10, font: fontRegular, color: gray });
    cursorY -= 14;
  }
  if (data.clientEmail) {
    page.drawText(`Correo: ${data.clientEmail}`, { x: 50, y: cursorY, size: 10, font: fontRegular, color: gray });
    cursorY -= 14;
  }
  if (data.clientAddress) {
    page.drawText(`Dirección: ${data.clientAddress}`, { x: 50, y: cursorY, size: 10, font: fontRegular, color: gray });
    cursorY -= 14;
  }

  cursorY -= 20;

  // --- Servicio / Descripción ---
  if (data.serviceName) {
    page.drawText('SERVICIO', { x: 50, y: cursorY, size: 11, font: fontBold, color: gray });
    cursorY -= 16;
    page.drawText(data.serviceName, { x: 50, y: cursorY, size: 12, font: fontBold, color: dark });
    cursorY -= 20;
  }

  page.drawText('DESCRIPCIÓN', { x: 50, y: cursorY, size: 11, font: fontBold, color: gray });
  cursorY -= 16;

  const maxLineWidth = width - 100;
  const words = data.description.split(' ');
  let line = '';
  const fontSize = 10.5;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = fontRegular.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxLineWidth) {
      page.drawText(line, { x: 50, y: cursorY, size: fontSize, font: fontRegular, color: dark });
      cursorY -= 15;
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) {
    page.drawText(line, { x: 50, y: cursorY, size: fontSize, font: fontRegular, color: dark });
    cursorY -= 15;
  }

  cursorY -= 25;

  // --- Tabla de valores ---
  page.drawRectangle({ x: 50, y: cursorY - 80, width: width - 100, height: 90, color: rgb(0.97, 0.97, 0.97) });
  cursorY -= 15;

  const drawRow = (label: string, value: string, bold = false) => {
    page.drawText(label, { x: 65, y: cursorY, size: 11, font: fontRegular, color: gray });
    page.drawText(value, {
      x: width - 65 - fontBold.widthOfTextAtSize(value, 12),
      y: cursorY,
      size: bold ? 13 : 11,
      font: bold ? fontBold : fontRegular,
      color: dark,
    });
    cursorY -= 20;
  };

  drawRow('Precio base', formatCurrency(data.basePrice, data.currency));
  if (data.discount > 0) {
    drawRow('Descuento', `- ${formatCurrency(data.discount, data.currency)}`);
  }
  drawRow('VALOR TOTAL', formatCurrency(data.finalPrice, data.currency), true);

  cursorY -= 25;

  if (data.paymentTerms) {
    page.drawText(`Forma de pago: ${data.paymentTerms}`, { x: 50, y: cursorY, size: 10, font: fontRegular, color: gray });
    cursorY -= 16;
  }
  if (data.validUntil) {
    page.drawText(`Vigencia de la cotización: ${data.validUntil.toLocaleDateString('es-CL')}`, {
      x: 50,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: gray,
    });
    cursorY -= 16;
  }

  // --- Firma ---
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
      const sigY = 110;
      page.drawImage(sigImage, { x: 50, y: sigY, width: w, height: h });
      page.drawLine({ start: { x: 50, y: sigY - 5 }, end: { x: 220, y: sigY - 5 }, thickness: 0.5, color: gray });
      page.drawText(data.responsibleName ?? data.organizationName, {
        x: 50,
        y: sigY - 18,
        size: 9,
        font: fontRegular,
        color: gray,
      });
    } catch {
      // Si la firma no se puede decodificar, se omite sin romper el PDF.
    }
  }

  // --- Footer ---
  page.drawLine({ start: { x: 50, y: 70 }, end: { x: width - 50, y: 70 }, thickness: 0.5, color: gray });
  page.drawText(data.footerNote ?? 'Documento generado por Cotizador CRM Pro', {
    x: 50,
    y: 50,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  return pdfDoc.save();
}
