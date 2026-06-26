import { app } from '@/app';
import { env } from '@/config/env';
import { prisma } from '@/config/prisma';

async function main() {
  await prisma.$connect();
  // eslint-disable-next-line no-console
  console.log('✅ Conectado a la base de datos.');

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Quotia API corriendo en http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`📄 Documentación Swagger en http://localhost:${env.port}/api/docs`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Error al iniciar el servidor:', err);
  process.exit(1);
});
