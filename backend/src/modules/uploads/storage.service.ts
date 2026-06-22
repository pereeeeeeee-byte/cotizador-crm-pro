import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config/env';

export interface UploadedFileInfo {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

let cloudinaryConfigured = false;
function ensureCloudinaryConfigured() {
  if (cloudinaryConfigured) return;
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
  cloudinaryConfigured = true;
}

/**
 * Abstracción de almacenamiento. driver=local guarda en disco (solo
 * recomendado para desarrollo local, ya que en plataformas como Railway el
 * disco se reinicia en cada despliegue). driver=cloudinary es la opción
 * recomendada para producción gratuita: sube el archivo y devuelve una URL
 * pública permanente, sin depender del disco del contenedor.
 */
export class StorageService {
  static async saveFile(file: UploadedFileInfo, folder: string): Promise<string> {
    switch (env.storage.driver) {
      case 'local':
        return this.saveLocal(file, folder);
      case 'cloudinary':
        return this.saveCloudinary(file, folder);
      case 's3':
        throw new Error('Driver S3 no implementado aún. Usa STORAGE_DRIVER=cloudinary o local.');
      default:
        return this.saveLocal(file, folder);
    }
  }

  private static async saveLocal(file: UploadedFileInfo, folder: string): Promise<string> {
    const dir = path.join(process.cwd(), env.storage.localPath, folder);
    fs.mkdirSync(dir, { recursive: true });

    const ext = path.extname(file.originalName) || '';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const fullPath = path.join(dir, filename);

    fs.writeFileSync(fullPath, file.buffer);

    return `${env.storage.publicBaseUrl}/${folder}/${filename}`;
  }

  private static async saveCloudinary(file: UploadedFileInfo, folder: string): Promise<string> {
    ensureCloudinaryConfigured();

    const isPdf = file.mimeType === 'application/pdf';
    const base64 = file.buffer.toString('base64');
    const dataUri = `data:${file.mimeType};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `cotizador-crm-pro/${folder}`,
      resource_type: isPdf ? 'raw' : 'image',
      use_filename: true,
      unique_filename: true,
    });

    return result.secure_url;
  }
}

