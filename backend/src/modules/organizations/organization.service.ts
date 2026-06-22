import { prisma } from '@/config/prisma';
import { AppError } from '@/common/AppError';
import { StorageService, UploadedFileInfo } from '@/modules/uploads/storage.service';

export class OrganizationService {
  static async getMyOrganization(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { branding: true, subscription: { include: { plan: true } } },
    });
    if (!org) throw AppError.notFound('Organización no encontrada.');
    return org;
  }

  static async completeOnboardingStep1(
    organizationId: string,
    data: {
      organizationName: string;
      responsibleName: string;
      jobTitle?: string;
      phone?: string;
      email?: string;
      website?: string;
      address?: string;
    }
  ) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { name: data.organizationName },
    });

    return prisma.branding.update({
      where: { organizationId },
      data: {
        responsibleName: data.responsibleName,
        jobTitle: data.jobTitle,
        phone: data.phone,
        email: data.email,
        website: data.website,
        address: data.address,
      },
    });
  }

  static async uploadLogo(organizationId: string, file: UploadedFileInfo) {
    const url = await StorageService.saveFile(file, `org-${organizationId}/logo`);
    return prisma.branding.update({ where: { organizationId }, data: { logoUrl: url } });
  }

  static async uploadSignatureImage(organizationId: string, file: UploadedFileInfo) {
    const url = await StorageService.saveFile(file, `org-${organizationId}/signature`);
    return prisma.branding.update({
      where: { organizationId },
      data: { signatureUrl: url, signatureType: 'upload' },
    });
  }

  static async saveDrawnSignature(organizationId: string, dataUrlBase64: string) {
    // dataUrlBase64 viene como "data:image/png;base64,...."
    const matches = dataUrlBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) throw AppError.badRequest('Formato de imagen de firma inválido.');

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    const url = await StorageService.saveFile(
      { buffer, mimeType, originalName: 'firma.png' },
      `org-${organizationId}/signature`
    );

    return prisma.branding.update({
      where: { organizationId },
      data: { signatureUrl: url, signatureType: 'drawn' },
    });
  }

  static async clearSignature(organizationId: string) {
    return prisma.branding.update({
      where: { organizationId },
      data: { signatureUrl: null, signatureType: 'none' },
    });
  }

  static async updateUsagePreferences(
    organizationId: string,
    data: {
      useLogoOnQuotes?: boolean;
      useLogoOnReports?: boolean;
      useSignatureOnQuotes?: boolean;
      useSignatureOnReports?: boolean;
    }
  ) {
    return prisma.branding.update({ where: { organizationId }, data });
  }

  static async finishOnboarding(organizationId: string) {
    return prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingDone: true },
    });
  }

  static async updateBranding(organizationId: string, data: Record<string, unknown>) {
    return prisma.branding.update({ where: { organizationId }, data });
  }

  /**
   * Ajusta el contador de cotizaciones para que la PRÓXIMA cotización que se
   * cree use el número indicado. Por ejemplo, si la empresa ya tenía
   * cotizaciones manuales hasta la #1000, se pasa startAt=1001 para que la
   * numeración continúe de forma creíble en vez de reiniciar desde 1.
   * Solo se permite si la organización aún no tiene cotizaciones creadas
   * dentro del sistema, para evitar saltos o colisiones de numeración.
   */
  static async setQuoteStartingNumber(organizationId: string, startAt: number) {
    if (startAt < 1) {
      throw AppError.badRequest('El número inicial debe ser mayor o igual a 1.');
    }

    const existingQuotesCount = await prisma.quote.count({ where: { organizationId } });
    if (existingQuotesCount > 0) {
      throw AppError.badRequest(
        'Ya existen cotizaciones creadas en el sistema. El número inicial solo puede ajustarse antes de crear la primera cotización.'
      );
    }

    return prisma.quoteCounter.update({
      where: { organizationId },
      data: { lastNumber: startAt - 1 }, // la siguiente cotización incrementará esto en 1
    });
  }
}
