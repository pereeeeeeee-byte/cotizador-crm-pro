# Generar el APK de Android

Tienes dos caminos. No son excluyentes — puedes usar ambos.

---

## Antes de compilar (cualquiera de los dos caminos): define la URL del backend

El APK necesita saber dónde está tu API. Esto se fija **en el momento de compilar**, no después — si cambias de servidor más adelante, necesitas recompilar y reinstalar el APK.

1. Sigue `DESPLIEGUE_RAILWAY.md` para obtener tu URL pública (algo como `https://tu-app.up.railway.app`).
2. Tu `VITE_API_URL` completa es esa URL + `/api/v1`, por ejemplo:
   ```
   https://tu-app.up.railway.app/api/v1
   ```

---

## Camino A: Android Studio (en tu computador)

1. Instala [Android Studio](https://developer.android.com/studio) si aún no lo tienes (ya lo estás haciendo).
2. En `frontend/.env`, define:
   ```
   VITE_API_URL=https://tu-app.up.railway.app/api/v1
   ```
3. Desde la carpeta `frontend/`:
   ```bash
   npm install
   npm run build
   npx cap sync android
   npx cap open android
   ```
   El último comando abre Android Studio directamente con el proyecto cargado.
4. En Android Studio, espera que termine de sincronizar Gradle (barra de progreso abajo). La primera vez puede tardar varios minutos descargando dependencias — es normal.
5. Para generar el APK: menú **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
6. Cuando termine, aparece una notificación abajo a la derecha: click en **"locate"** para abrir la carpeta. El archivo queda en:
   ```
   frontend/android/app/build/outputs/apk/debug/app-debug.apk
   ```
7. Copia ese `.apk` a tu celular (por cable USB, Google Drive, WhatsApp Web, lo que prefieras) y ábrelo para instalar. Android te va a pedir permitir "instalar apps de fuentes desconocidas" la primera vez — es normal para apps que no vienen de Play Store.

### Si quieres probar en un emulador en vez de tu celular
Dentro de Android Studio: **Device Manager** → crea un dispositivo virtual → botón ▶️ Run.

---

## Camino B: Compilar en la nube con GitHub Actions (sin instalar nada)

Ya dejé el archivo `.github/workflows/build-android.yml` configurado en el proyecto. Esto hace que GitHub compile el APK por ti, gratis, cada vez que subas cambios.

1. Sube el proyecto a GitHub (si no lo has hecho, sigue el "Paso 0" de `DESPLIEGUE_RAILWAY.md`).
2. En tu repositorio de GitHub: **Settings** → **Secrets and variables** → **Actions** → **"New repository secret"**.
   - Nombre: `VITE_API_URL`
   - Valor: `https://tu-app.up.railway.app/api/v1`
3. Ve a la pestaña **"Actions"** de tu repositorio. Si no se disparó automáticamente, click en **"Compilar APK Android"** en la lista de la izquierda → **"Run workflow"** → **"Run workflow"** (botón verde).
4. Espera unos 3-5 minutos a que el workflow termine (ícono verde ✔️).
5. Click en el workflow que terminó → al final de la página hay una sección **"Artifacts"** → descarga `cotizador-crm-pro-debug-apk`. Es un .zip que contiene el `.apk` adentro.
6. Pasa ese `.apk` a tu celular e instálalo igual que en el Camino A.

### Ventaja de este camino
No necesitas Android Studio, ni siquiera necesitas tu computador prendido — todo corre en los servidores de GitHub. Ideal para cuando ya tengas el proyecto funcionando y solo quieras generar una nueva versión del APK tras un cambio.

---

## Notas importantes

- **Este APK es de "debug"**, lo cual significa que se instala sin problema para pruebas, pero no está firmado para publicarse en Google Play. Para publicar en Play Store eventualmente, se necesita generar una build "release" firmada con una clave — eso es un paso aparte que hacemos cuando llegues a ese punto.
- **Cada vez que cambies el código del frontend o la URL del backend**, necesitas repetir el proceso de compilación (A o B) y volver a instalar el APK actualizado en el celular.
- Si Android marca la app como "no segura" o similar al instalar, es normal para apps fuera de Play Store — significa que viene de fuera de la tienda oficial, no que tenga un problema real.
