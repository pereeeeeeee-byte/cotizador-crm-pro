import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando planes del sistema...');

  const plans = [
    {
      code: 'FREE',
      name: 'Gratis',
      description: 'Plan de prueba para comenzar.',
      priceMonthly: 0,
      priceYearly: 0,
      maxUsers: 1,
      maxClients: 25,
      maxQuotesMo: 10,
      maxStorageMb: 100,
      features: { ai: false, customBranding: true },
    },
    {
      code: 'PRO',
      name: 'Profesional',
      description: 'Para profesionales independientes activos.',
      priceMonthly: 14990,
      priceYearly: 149900,
      maxUsers: 3,
      maxClients: 500,
      maxQuotesMo: 100,
      maxStorageMb: 2000,
      features: { ai: true, customBranding: true },
    },
    {
      code: 'BUSINESS',
      name: 'Empresa',
      description: 'Para equipos comerciales con varios vendedores.',
      priceMonthly: 39990,
      priceYearly: 399900,
      maxUsers: -1,
      maxClients: -1,
      maxQuotesMo: -1,
      maxStorageMb: 20000,
      features: { ai: true, customBranding: true, advancedReports: true },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }

  console.log('🌱 Sembrando organización demo (DC Topografía)...');

  const existingOrg = await prisma.organization.findUnique({ where: { slug: 'dc-topografia-demo' } });
  if (existingOrg) {
    console.log('La organización demo ya existe. Abortando seed de datos de ejemplo.');
    return;
  }

  const proPlan = await prisma.plan.findUniqueOrThrow({ where: { code: 'PRO' } });

  const organization = await prisma.organization.create({
    data: { name: 'DC Topografía', slug: 'dc-topografia-demo', onboardingDone: true },
  });

  await prisma.branding.create({
    data: {
      organizationId: organization.id,
      responsibleName: 'Diego Contreras',
      jobTitle: 'Topógrafo',
      phone: '+56 9 1234 5678',
      email: 'contacto@dctopografia.cl',
      primaryColor: '#FACC15',
      secondaryColor: '#111827',
      currency: 'CLP',
      quotePrefix: 'COT',
    },
  });

  await prisma.quoteCounter.create({ data: { organizationId: organization.id, lastNumber: 0 } });

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  await prisma.subscription.create({
    data: { organizationId: organization.id, planId: proPlan.id, status: 'ACTIVE', trialEndsAt },
  });

  const passwordHash = await bcrypt.hash('Demo1234', 12);

  const admin = await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: 'Diego Contreras',
      email: 'demo@dctopografia.cl',
      passwordHash,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      organizationId: organization.id,
      fullName: 'Vendedor Demo',
      email: 'vendedor@dctopografia.cl',
      passwordHash,
      role: 'VENDEDOR',
      emailVerifiedAt: new Date(),
    },
  });

  const services = await Promise.all([
    prisma.service.create({
      data: {
        organizationId: organization.id,
        name: 'Subdivisión predial',
        description: 'Subdivisión de terreno conforme a normativa vigente.',
        basePrice: 450000,
        estimatedDays: 20,
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        name: 'Regularización de vivienda',
        description: 'Regularización de construcción bajo DS49/DS19/Ley 21.301.',
        basePrice: 380000,
        estimatedDays: 30,
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        name: 'Levantamiento topográfico',
        description: 'Levantamiento planimétrico y altimétrico de terreno.',
        basePrice: 250000,
        estimatedDays: 7,
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        name: 'Loteo',
        description: 'Loteo de terreno para fines habitacionales.',
        basePrice: 600000,
        estimatedDays: 45,
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        name: 'Fusión predial',
        description: 'Fusión de dos o más predios en uno solo.',
        basePrice: 320000,
        estimatedDays: 15,
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        name: 'Certificación de deslindes',
        description: 'Certificación técnica de límites de terreno.',
        basePrice: 180000,
        estimatedDays: 5,
      },
    }),
  ]);

  const clientsData = [
    { fullName: 'Juan Pérez Soto', phone: '+56911111111', email: 'juan.perez@gmail.com', city: 'Temuco', comuna: 'Temuco', source: 'FACEBOOK' as const, status: 'TRABAJO_CONTRATADO' as const },
    { fullName: 'María González Vidal', phone: '+56922222222', email: 'maria.gonzalez@gmail.com', city: 'Padre Las Casas', comuna: 'Padre Las Casas', source: 'WHATSAPP' as const, status: 'COTIZADO' as const },
    { fullName: 'Carlos Muñoz Reyes', phone: '+56933333333', email: 'carlos.munoz@gmail.com', city: 'Villarrica', comuna: 'Villarrica', source: 'INSTAGRAM' as const, status: 'EN_NEGOCIACION' as const },
    { fullName: 'Ana Sandoval Lara', phone: '+56944444444', email: 'ana.sandoval@gmail.com', city: 'Temuco', comuna: 'Temuco', source: 'REFERIDO' as const, status: 'NUEVO' as const },
    { fullName: 'Pedro Llanquileo', phone: '+56955555555', email: 'pedro.llanquileo@gmail.com', city: 'Pucón', comuna: 'Pucón', source: 'GOOGLE' as const, status: 'TRABAJO_TERMINADO' as const },
    { fullName: 'Francisca Torres', phone: '+56966666666', email: 'francisca.torres@gmail.com', city: 'Temuco', comuna: 'Temuco', source: 'MARKETPLACE' as const, status: 'PENDIENTE_DOCUMENTOS' as const },
    { fullName: 'Rodrigo Sepúlveda', phone: '+56977777777', email: 'rodrigo.sepulveda@gmail.com', city: 'Angol', comuna: 'Angol', source: 'OTRO' as const, status: 'CLIENTE_PERDIDO' as const },
  ];

  const clients = [];
  for (const c of clientsData) {
    const client = await prisma.client.create({ data: { ...c, organizationId: organization.id } });
    clients.push(client);
  }

  let quoteNumber = 0;
  const quoteStatuses: Array<'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA'> = [
    'ACEPTADA',
    'ENVIADA',
    'BORRADOR',
    'ACEPTADA',
    'RECHAZADA',
  ];

  for (let i = 0; i < clients.length - 2; i++) {
    quoteNumber++;
    const service = services[i % services.length];
    const status = quoteStatuses[i % quoteStatuses.length];
    const basePrice = Number(service.basePrice);
    const discount = i % 3 === 0 ? basePrice * 0.05 : 0;

    await prisma.quote.create({
      data: {
        organizationId: organization.id,
        number: quoteNumber,
        clientId: clients[i].id,
        serviceId: service.id,
        description: `${service.description} Solicitado por ${clients[i].fullName}.`,
        basePrice,
        discount,
        finalPrice: basePrice - discount,
        paymentTerms: '50% al iniciar, 50% al finalizar',
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
        status,
        createdById: admin.id,
      },
    });
  }

  await prisma.quoteCounter.update({ where: { organizationId: organization.id }, data: { lastNumber: quoteNumber } });

  await prisma.activity.create({
    data: {
      organizationId: organization.id,
      clientId: clients[0].id,
      userId: admin.id,
      type: 'VISITA_TECNICA',
      comment: 'Visita técnica inicial para evaluar el terreno.',
      result: 'POSITIVO',
    },
  });

  await prisma.reminder.create({
    data: {
      organizationId: organization.id,
      clientId: clients[1].id,
      userId: admin.id,
      title: 'Llamar para confirmar cotización',
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  console.log('✅ Seed completado.');
  console.log('   Usuario admin demo: demo@dctopografia.cl / Demo1234');
  console.log('   Usuario vendedor demo: vendedor@dctopografia.cl / Demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
