# Cotizador CRM Pro

SaaS multi-tenant para topógrafos, arquitectos, constructores e ingenieros independientes: gestión de clientes, cotizaciones profesionales en PDF, seguimiento comercial (CRM), recordatorios, dashboard de ventas y un asistente con IA para redactar cotizaciones.

## Arquitectura

- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL. Multi-tenant real: cada organización (empresa) tiene sus datos completamente aislados vía `organizationId`, derivado del JWT en cada request — nunca del body/query del cliente.
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + React Query + Zustand. PWA instalable (manifest + service worker).
- **Planes y suscripciones**: modelo `Plan`/`Subscription` listo para conectar un gateway de pago (Stripe u otro) — los límites de uso (usuarios, clientes, cotizaciones/mes) ya se validan en el backend.

## Requisitos

- [Docker](https://www.docker.com/products/docker-desktop/) y Docker Compose (viene incluido en Docker Desktop)
- Eso es todo — no necesitas instalar Node, PostgreSQL ni nada más en tu máquina si usas Docker.

## Instalación (con Docker — recomendado)

1. Clona o copia esta carpeta `cotizador-crm-pro` a tu computador.

2. Crea el archivo de variables de entorno del backend:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edita `backend/.env` y cambia al menos `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` por cadenas largas y aleatorias.

3. Desde la carpeta raíz del proyecto, levanta todo:
   ```bash
   docker compose up --build
   ```
   Esto levanta 3 contenedores: PostgreSQL, backend (puerto 4000) y frontend (puerto 5173). Las migraciones de Prisma se aplican automáticamente al iniciar el backend.

4. Carga los datos de demostración (en otra terminal, con los contenedores corriendo):
   ```bash
   docker compose exec backend npm run prisma:seed
   ```
   Esto crea:
   - Una organización demo "DC Topografía"
   - Usuario admin: `demo@dctopografia.cl` / `Demo1234`
   - Usuario vendedor: `vendedor@dctopografia.cl` / `Demo1234`
   - 6 servicios, 7 clientes y varias cotizaciones de ejemplo

5. Abre el navegador en **http://localhost:5173** e inicia sesión con el usuario demo, o crea tu propia cuenta desde "Crea una gratis".

6. La documentación interactiva de la API (Swagger) queda disponible en **http://localhost:4000/api/docs**.

## Instalación para desarrollo (sin Docker)

Necesitas Node.js 20+, PostgreSQL 16 corriendo localmente, y npm.

### Backend

```bash
cd backend
cp .env.example .env
# Edita .env y asegúrate que DATABASE_URL apunte a tu PostgreSQL local
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

El backend queda en `http://localhost:4000`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

El frontend queda en `http://localhost:5173`.

## Estructura del proyecto

```
cotizador-crm-pro/
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Modelo de datos completo (multi-tenant)
│   │   └── seed.ts            # Datos de demostración
│   └── src/
│       ├── modules/           # Un módulo por dominio (auth, clients, quotes, ai, etc.)
│       ├── middlewares/       # auth (JWT), manejo de errores
│       └── config/            # env, prisma client, swagger
└── frontend/
    └── src/
        ├── pages/             # Páginas por dominio (auth, onboarding, dashboard, clients, quotes...)
        ├── api/                # Llamadas a la API REST
        ├── store/              # Estado global (auth) con Zustand
        └── layouts/            # Layout principal con sidebar y notificaciones
```

## Funcionalidades incluidas

- ✅ Registro, login, recuperación de contraseña, verificación de correo (JWT + refresh tokens con rotación)
- ✅ Multi-tenant real con roles (Administrador, Vendedor, Operador)
- ✅ Onboarding de 4 pasos: datos de empresa, logo, firma (subida o dibujada), preferencias de uso
- ✅ CRUD completo de clientes con búsqueda, filtros y estados
- ✅ Catálogo de servicios editable
- ✅ Cotizaciones con numeración correlativa automática, PDF profesional descargable, compartir por WhatsApp
- ✅ Seguimiento comercial: actividades (llamada, WhatsApp, correo, reunión, visita técnica) y línea de tiempo por cliente
- ✅ Recordatorios rápidos (1, 3, 7 días o fecha personalizada)
- ✅ Centro de notificaciones
- ✅ Dashboard con KPIs y gráficos (clientes, cotizaciones, ventas, conversión, servicios más vendidos)
- ✅ Asistente con IA para redactar cotizaciones a partir de una descripción en lenguaje natural (con integración OpenAI opcional vía `OPENAI_API_KEY`, y un modo heurístico que funciona sin IA externa)
- ✅ Planes y suscripciones con límites de uso por plan
- ✅ PWA instalable (manifest + service worker)
- ✅ Docker listo para producción

## App Android (APK)

El frontend está preparado con [Capacitor](https://capacitorjs.com) para compilarse como app nativa de Android, con el código empaquetado offline dentro del APK (ícono y splash screen propios, identidad amarillo/negro de DC Topografía). El backend sigue viviendo en un servidor — la app llama a la API por internet igual que la versión web.

- **`DESPLIEGUE_RAILWAY.md`** — cómo subir el backend gratis a Railway y obtener una URL HTTPS pública.
- **`GENERAR_APK.md`** — cómo compilar el `.apk` con Android Studio o en la nube con GitHub Actions (sin instalar nada).
- **`MONETIZACION.md`** — qué falta para activar cobros de suscripción (la base de datos ya está lista).

## Notas importantes antes de producción real

- Cambia **todos** los secretos en `backend/.env` (JWT, SMTP) antes de exponer esto a internet.
- Por defecto los archivos (logos, firmas, PDFs) se guardan en disco local dentro del contenedor backend. Para producción a escala, considera activar `STORAGE_DRIVER=s3` o `cloudinary` (las credenciales ya están en `.env.example`, pero el código de esos drivers queda pendiente de implementar — actualmente solo "local" está implementado).
- Configura un proveedor SMTP real (`SMTP_HOST`, `SMTP_USER`, etc.) para que los correos de verificación y recuperación de contraseña se envíen de verdad — sin esto, solo se imprimen en los logs del backend.
- El módulo de IA funciona sin `OPENAI_API_KEY` (usa un emparejamiento heurístico de palabras clave contra tu catálogo de servicios), pero con la API key configurada obtienes mejores descripciones y sugerencias de alcance.
