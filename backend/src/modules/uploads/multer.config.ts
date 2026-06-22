import multer from 'multer';
import { AppError } from '@/common/AppError';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(AppError.badRequest('Formato de archivo no permitido. Usa PNG, JPG o SVG.') as unknown as Error);
    }
    cb(null, true);
  },
});
