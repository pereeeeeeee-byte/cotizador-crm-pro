export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, code = 'APP_ERROR', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'No autorizado') {
    return new AppError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Acceso prohibido') {
    return new AppError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new AppError(409, message, 'CONFLICT');
  }

  static tooManyRequests(message = 'Demasiadas solicitudes') {
    return new AppError(429, message, 'TOO_MANY_REQUESTS');
  }

  static planLimitReached(message: string) {
    return new AppError(402, message, 'PLAN_LIMIT_REACHED');
  }

  static internal(message = 'Error interno del servidor') {
    return new AppError(500, message, 'INTERNAL_ERROR');
  }
}
