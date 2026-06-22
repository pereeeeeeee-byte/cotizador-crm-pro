import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/common/AppError';
import { verifyAccessToken, AccessTokenPayload } from '@/utils/jwt';

// Extiende Express.Request para incluir el contexto de autenticación.
// IMPORTANTE: organizationId viaja siempre en el JWT, nunca en el body/query
// del request. Esto es lo que garantiza el aislamiento multi-tenant: un
// usuario autenticado de la Organización A físicamente no puede pedir datos
// de la Organización B, porque cada controller usa req.auth.organizationId
// para filtrar, ignorando cualquier organizationId que venga del cliente.
declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Token de acceso no proporcionado'));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.auth = payload;
    return next();
  } catch {
    return next(AppError.unauthorized('Token de acceso inválido o expirado'));
  }
}

export function requireRole(...roles: AccessTokenPayload['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.auth.role)) {
      return next(AppError.forbidden('No tienes permisos para realizar esta acción'));
    }
    return next();
  };
}
