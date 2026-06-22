# Desplegar el backend en Railway (gratis para empezar)

Railway te da un plan de prueba con créditos gratis mensuales — suficiente para una app pequeña en sus primeros meses, sin pedir tarjeta de crédito al inicio. Esta guía asume que no tienes servidor propio ni dominio todavía.

## Paso 0: sube el proyecto a GitHub

Railway despliega leyendo desde un repositorio Git. Si no tienes el proyecto en GitHub aún:

1. Crea una cuenta en [github.com](https://github.com) si no tienes una.
2. Crea un repositorio nuevo (puede ser privado), por ejemplo `cotizador-crm-pro`.
3. Desde la carpeta del proyecto en tu computador:
   ```bash
   cd cotizador-crm-pro
   git init
   git add .
   git commit -m "Cotizador CRM Pro inicial"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/cotizador-crm-pro.git
   git push -u origin main
   ```

## Paso 1: crea la cuenta y el proyecto en Railway

1. Ve a [railway.app](https://railway.app) y crea una cuenta (puedes usar tu cuenta de GitHub para entrar más rápido).
2. Click en **"New Project"**.
3. Elige **"Deploy from GitHub repo"** y selecciona tu repositorio `cotizador-crm-pro`.
4. Railway va a detectar que hay múltiples carpetas (`backend/`, `frontend/`). Cuando te pregunte la carpeta raíz del servicio, indica **`backend`** — es el único que necesitamos desplegar aquí (el frontend va dentro del APK, no en Railway).

## Paso 2: agrega la base de datos PostgreSQL

1. Dentro de tu proyecto en Railway, click en **"+ New"** → **"Database"** → **"Add PostgreSQL"**.
2. Railway crea automáticamente una base de datos y genera una variable `DATABASE_URL` interna.
3. Ve a tu servicio de **backend** → pestaña **"Variables"** → click en **"Add Reference"** (o similar) y enlaza `DATABASE_URL` desde el servicio de PostgreSQL. Esto evita que tengas que copiar/pegar la cadena de conexión a mano.

## Paso 3: configura las variables de entorno del backend

En tu servicio de backend → pestaña **"Variables"**, agrega (basándote en `backend/.env.example`):

```
NODE_ENV=production
JWT_ACCESS_SECRET=<genera una cadena aleatoria larga, ej: openssl rand -hex 32>
JWT_REFRESH_SECRET=<otra cadena distinta, igual de larga>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=*
STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=<de tu cuenta Cloudinary, ver Paso 4>
CLOUDINARY_API_KEY=<de tu cuenta Cloudinary>
CLOUDINARY_API_SECRET=<de tu cuenta Cloudinary>
```

> `FRONTEND_URL=*` es temporal y permisivo (CORS abierto) para que el APK pueda llamar a la API sin problemas mientras no tengas un dominio fijo para el frontend. Cuando tengas uno, puedes restringirlo.

No necesitas definir `PORT` ni `DATABASE_URL` a mano — Railway los inyecta automáticamente.

## Paso 4: crea tu cuenta gratis de Cloudinary (para logos, firmas y PDFs)

1. Ve a [cloudinary.com/users/register/free](https://cloudinary.com/users/register/free) y crea una cuenta gratis (25GB incluidos, no pide tarjeta).
2. En tu **Dashboard** de Cloudinary verás de inmediato: `Cloud name`, `API Key`, `API Secret`. Cópialos a las variables de Railway del paso anterior.

## Paso 5: despliega

1. Railway despliega automáticamente apenas detecta el repo conectado. Si no, click en **"Deploy"**.
2. Mira los **"Logs"** del servicio. Deberías ver al final algo como:
   ```
   ✅ Conectado a la base de datos.
   🚀 Cotizador CRM Pro API corriendo en http://localhost:XXXX
   ```
3. Ve a la pestaña **"Settings"** de tu servicio backend → sección **"Networking"** → click en **"Generate Domain"**. Railway te da una URL pública HTTPS gratuita, algo como:
   ```
   https://cotizador-crm-pro-backend-production.up.railway.app
   ```
   **Esta es la URL que vamos a usar como `VITE_API_URL` para compilar el APK.**

## Paso 6: carga los datos de demostración (opcional)

Desde tu computador, con la [CLI de Railway](https://docs.railway.app/guides/cli) instalada:

```bash
railway login
railway link   # selecciona tu proyecto
railway run --service backend npm run prisma:seed
```

## Verificación final

Abre en tu navegador: `https://TU-URL-DE-RAILWAY.up.railway.app/health` — deberías ver `{"status":"ok", ...}`. Si ves eso, el backend está vivo y listo para que el APK se conecte a él.

---

**Siguiente paso:** una vez tengas tu URL de Railway, dímela (o solo confírmame que ya la tienes) y la usamos para compilar el APK con la configuración correcta.
