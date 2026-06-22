import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Genera un token aleatorio seguro (para verificación de email / reset password / refresh jti) */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Hashea un token largo antes de guardarlo en BD (igual que una password) */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
