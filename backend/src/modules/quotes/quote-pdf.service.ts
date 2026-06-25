import { prisma } from '@/config/prisma';
import { AppError } from '@/common/AppError';
import { generateQuotePdf } from './quote-pdf.generator';
import { StorageService } from '@/modules/uploads/storage.service';
import { resolveInstallmentAmount } from './quote-calculations';
import type { QuoteItem, QuoteInstallment } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { env } from '@/config/env';

/**
 * Obtiene el contenido binario de un logo/firma a partir de su URL guardada
 * en Branding. Si el driver es "local", lee directo del disco. Si es
 * "cloudinary" (o cualquier URL remota http/https), la descarga por fetch.
 * Esto permite que la generación de PDF funcione igual sin importar dónde
 * esté alojado el archivo.
 */
async function resolveImageBuffer(url: string | null | undefined): Promise<Buffer | null> {
  if (!url) return null;

  if (env.storage.driver === 'local' && url.startsWith(env.storage.publicBaseUrl)) {
    const relative = url.replace(env.storage.publicBaseUrl, '');
    const fullPath = path.join(process.cwd(), env.storage.localPath, relative);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath);
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  return null;
}

export class QuotePdfService {
  static async generateAndStore(organizationId: string, quoteId: string): Promise<string> {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, organizationId },
      include: {
        client: true,
        service: true,
        items: { orderBy: { sortOrder: 'asc' } },
        installments: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!quote) throw AppError.notFound('Cotización no encontrada.');

    const branding = await prisma.branding.findUnique({ where: { organizationId } });
    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) throw AppError.notFound('Organización no encontrada.');

    const logoBuffer = await resolveImageBuffer(branding?.logoUrl);
    const useSignature = Boolean(branding?.useSignatureOnQuotes && branding?.signatureType !== 'none');
    const signatureBuffer = useSignature ? await resolveImageBuffer(branding?.signatureUrl) : null;

    const finalPrice = Number(quote.finalPrice);

    const pdfBytes = await generateQuotePdf({
      quoteNumber: quote.number,
      quotePrefix: branding?.quotePrefix ?? 'COT',
      date: quote.createdAt,
      organizationName: organization.name,
      responsibleName: branding?.responsibleName,
      jobTitle: branding?.jobTitle,
      rut: branding?.rut,
      contactPhone: branding?.phone,
      contactEmail: branding?.email,
      primaryColorHex: branding?.primaryColor,

      clientName: quote.client.fullName,
      clientPhone: quote.client.phone,
      clientEmail: quote.client.email,
      clientAddress: quote.client.address,

      serviceName: quote.service?.name,
      description: quote.description,
      basePrice: Number(quote.basePrice),
      discount: Number(quote.discount),
      finalPrice,
      paymentTerms: quote.paymentTerms,
      validUntil: quote.validUntil,
      currency: branding?.currency ?? 'CLP',
      footerNote: branding?.pdfFooterNote,

      items:
        quote.items.length > 0
          ? quote.items.map((item: QuoteItem) => ({
              description: item.description,
              unitPrice: Number(item.unitPrice),
              quantity: Number(item.quantity),
              total: Number(item.unitPrice) * Number(item.quantity),
            }))
          : undefined,

      installments:
        quote.installments.length > 0
          ? quote.installments.map((inst: QuoteInstallment) => ({
              description: inst.description,
              amount: resolveInstallmentAmount(
                {
                  description: inst.description,
                  amountType: inst.amountType,
                  fixedAmount: inst.fixedAmount !== null ? Number(inst.fixedAmount) : undefined,
                  percentage: inst.percentage !== null ? Number(inst.percentage) : undefined,
                },
                finalPrice
              ),
              isPaid: inst.isPaid,
            }))
          : undefined,

      logoBuffer: branding?.useLogoOnQuotes ? logoBuffer : null,
      signatureBuffer,
      useSignature,
    });

    const url = await StorageService.saveFile(
      { buffer: Buffer.from(pdfBytes), originalName: `cotizacion-${quote.number}.pdf`, mimeType: 'application/pdf' },
      `org-${organizationId}/quotes`
    );

    await prisma.quote.update({ where: { id: quote.id }, data: { pdfUrl: url } });

    return url;
  }
}

