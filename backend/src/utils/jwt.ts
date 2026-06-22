import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';

export interface AccessTokenPayload {
  sub: string; // userId
  organizationId: string;
  role: 'ADMIN' | 'VENDEDOR' | 'OPERADOR';
}

export interface RefreshTokenPayload {
  sub: string; // userId
  jti: string; // identificador único del token (para poder revocarlo)
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = { expiresIn: env.jwt.accessExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwt.accessSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = { expiresIn: env.jwt.refreshExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwt.refreshSecret, options);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
}
