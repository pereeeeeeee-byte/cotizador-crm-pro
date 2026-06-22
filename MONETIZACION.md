# Monetizar Cotizador CRM Pro (próximos pasos)

La base de datos y el backend ya están preparados para esto desde el diseño inicial — no se necesita rediseñar nada, solo conectar un gateway de pago. Esto queda pendiente como su propia conversación porque depende de decisiones de negocio, no solo técnicas.

## Lo que ya existe

- Modelo `Plan` (FREE, PRO, BUSINESS) con límites de usuarios, clientes y cotizaciones/mes.
- Modelo `Subscription` por organización, con estado (`TRIAL`, `ACTIVE`, `PAST_DUE`, `CANCELED`, `EXPIRED`) y campos `externalCustomerId` / `externalSubId` listos para guardar las referencias del gateway de pago.
- Modelo `Invoice` para historial de cobros.
- `PlanLimitService` en el backend ya bloquea la creación de clientes/usuarios/cotizaciones cuando se excede el límite del plan.

## Lo que falta decidir antes de implementar

1. **Gateway de pago**: para Chile, las opciones típicas son:
   - **Flow** o **MercadoPago**: más simple para suscripciones recurrentes en pesos chilenos, soporta webpay/tarjetas locales.
   - **Stripe**: más robusto y con mejor documentación, pero el cobro en CLP y métodos de pago locales (como tarjetas de débito chilenas) puede ser más limitado.
2. **Estructura de precios**: ¿planes mensuales, anuales, ambos? ¿Vas a ofrecer trial gratis (ya existe la lógica de 14 días) o freemium permanente?
3. **Quién paga qué**: ¿cada profesional que se registra paga directamente (modelo SaaS clásico), o tú vas a revender la plataforma a otros topógrafos con un margen?

## Cuando quieras avanzar

Retoma esta conversación o abre una nueva pidiendo "conectar [Flow/MercadoPago/Stripe] al sistema de planes que ya existe en Cotizador CRM Pro" — con eso como contexto, se puede implementar directamente:
- Endpoint de checkout que crea la sesión de pago.
- Webhook que recibe la confirmación del gateway y actualiza `Subscription.status` + crea el `Invoice`.
- Página de "Planes" en el frontend para que el usuario elija/actualice su plan.
