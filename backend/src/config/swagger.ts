import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Quotia API',
      version: '1.0.0',
      description:
        'API REST multi-tenant para gestión de clientes, cotizaciones y seguimiento comercial para profesionales independientes (topógrafos, arquitectos, constructores, ingenieros).',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Registro, login, tokens, verificación de correo, recuperación de contraseña' },
      { name: 'Organizations', description: 'Onboarding y configuración de identidad corporativa' },
      { name: 'Users', description: 'Gestión de usuarios del equipo (roles: ADMIN, VENDEDOR, OPERADOR)' },
      { name: 'Clients', description: 'CRUD de clientes y filtros' },
      { name: 'Services', description: 'Catálogo de servicios' },
      { name: 'Quotes', description: 'Cotizaciones, PDF, numeración correlativa' },
      { name: 'Activities', description: 'Actividades de seguimiento comercial' },
      { name: 'Reminders', description: 'Recordatorios programados' },
      { name: 'Notifications', description: 'Centro de notificaciones' },
      { name: 'Dashboard', description: 'Estadísticas y gráficos' },
      { name: 'AI', description: 'Generación asistida de cotizaciones' },
    ],
  },
  apis: [],
});
