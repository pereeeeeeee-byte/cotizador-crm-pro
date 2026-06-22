import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.dctopografia.cotizadorcrm',
  appName: 'Cotizador CRM Pro',
  webDir: 'dist',
  // Modo empaquetado offline: todo el HTML/CSS/JS de dist/ se copia dentro
  // del APK (carpeta android/app/src/main/assets/public). La app abre sin
  // depender de un servidor de hosting del frontend. Aun así, cada llamada
  // a la API (clientes, cotizaciones, etc.) sigue yendo por internet hacia
  // VITE_API_URL — eso no se puede empaquetar porque son datos dinámicos.
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
