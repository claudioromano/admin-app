import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as typeof import('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar datos existentes (en orden para respetar FK)
  await prisma.expenseFile.deleteMany();
  await prisma.invoiceFile.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.organizationPaymentAccount.deleteMany();
  await prisma.paymentAccount.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // USUARIO DE PRUEBA
  // ============================================
  const password = await bcrypt.hash('Admin1234!', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@adminapp.dev',
      password,
      name: 'Admin Demo',
    },
  });
  console.log(`✅ Usuario creado: ${user.email} / Admin1234!`);

  // ============================================
  // ORGANIZACIÓN
  // ============================================
  const org = await prisma.organization.create({
    data: {
      name: 'Estudio Demo SRL',
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  });
  console.log(`✅ Organización creada: ${org.name}`);

  // ============================================
  // CUENTA DE COBRO
  // ============================================
  const paymentAccount = await prisma.paymentAccount.create({
    data: {
      userId: user.id,
      name: 'Banco Nación - Cuenta Corriente',
      holder: 'Admin Demo',
      alias: 'DEMO.NACION.CC',
      type: 'BANK',
    },
  });

  await prisma.organizationPaymentAccount.create({
    data: {
      organizationId: org.id,
      paymentAccountId: paymentAccount.id,
    },
  });
  console.log(`✅ Cuenta de cobro vinculada: ${paymentAccount.name}`);

  // ============================================
  // CLIENTES
  // ============================================
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'María López',
        company: 'López & Asociados',
        email: 'maria@lopezasoc.com.ar',
        phone: '+54 11 4567-8900',
        notes: 'Cliente desde 2022. Paga siempre en término.',
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'Carlos Rodríguez',
        company: 'Constructora Rodríguez SA',
        email: 'carlos@constructorarod.com.ar',
        phone: '+54 351 456-7890',
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'Sofía Méndez',
        email: 'sofia.mendez@gmail.com',
        phone: '+54 11 2345-6789',
        notes: 'Freelance. Prefiere facturación mensual.',
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'Tech Innovación SAS',
        company: 'Tech Innovación SAS',
        email: 'pagos@techinnovacion.com',
        phone: '+54 11 9876-5432',
      },
    }),
  ]);
  console.log(`✅ ${clients.length} clientes creados`);

  const today = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };
  const daysFromNow = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };

  // ============================================
  // FACTURAS
  // ============================================
  await Promise.all([
    // Factura cobrada
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[0].id,
        paymentAccountId: paymentAccount.id,
        number: 'FC-0001',
        description: 'Consultoría contable - Enero 2026',
        amount: 85000,
        date: daysAgo(45),
        dueDate: daysAgo(15),
        status: 'PAID',
        paidAt: daysAgo(12),
      },
    }),
    // Factura pendiente con vencimiento próximo
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[0].id,
        paymentAccountId: paymentAccount.id,
        number: 'FC-0002',
        description: 'Consultoría contable - Febrero 2026',
        amount: 85000,
        date: daysAgo(18),
        dueDate: daysFromNow(5),
        status: 'PENDING',
      },
    }),
    // Factura vencida
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[1].id,
        paymentAccountId: paymentAccount.id,
        number: 'FC-0003',
        description: 'Auditoría contable Q4 2025',
        amount: 230000,
        date: daysAgo(60),
        dueDate: daysAgo(30),
        status: 'OVERDUE',
      },
    }),
    // Factura pendiente reciente
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[2].id,
        paymentAccountId: paymentAccount.id,
        number: 'FC-0004',
        description: 'Desarrollo web - Sprint 1',
        amount: 150000,
        date: daysAgo(10),
        dueDate: daysFromNow(20),
        status: 'PENDING',
      },
    }),
    // Factura pendiente - cliente grande
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[3].id,
        paymentAccountId: paymentAccount.id,
        number: 'FC-0005',
        description: 'Implementación sistema ERP - Módulo RRHH',
        amount: 580000,
        date: daysAgo(5),
        dueDate: daysFromNow(25),
        status: 'PENDING',
      },
    }),
    // Factura cancelada
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[1].id,
        number: 'FC-0006',
        description: 'Servicio cancelado por el cliente',
        amount: 45000,
        date: daysAgo(30),
        status: 'CANCELLED',
      },
    }),
  ]);
  console.log(`✅ Facturas creadas`);

  // ============================================
  // GASTOS
  // ============================================
  await Promise.all([
    // Gasto fijo pagado - alquiler
    prisma.expense.create({
      data: {
        organizationId: org.id,
        description: 'Alquiler oficina - Enero 2026',
        amount: 120000,
        date: daysAgo(45),
        dueDate: daysAgo(35),
        type: 'FIXED',
        status: 'PAID',
        paidAt: daysAgo(35),
      },
    }),
    // Gasto fijo pagado - servicios
    prisma.expense.create({
      data: {
        organizationId: org.id,
        description: 'Servicios (luz, internet, teléfono) - Enero 2026',
        amount: 28500,
        date: daysAgo(45),
        dueDate: daysAgo(30),
        type: 'FIXED',
        status: 'PAID',
        paidAt: daysAgo(28),
      },
    }),
    // Gasto fijo pendiente - alquiler febrero
    prisma.expense.create({
      data: {
        organizationId: org.id,
        description: 'Alquiler oficina - Febrero 2026',
        amount: 125000,
        date: daysAgo(18),
        dueDate: daysFromNow(5),
        type: 'FIXED',
        status: 'PENDING',
        notes: 'Acordar ajuste por inflación para marzo',
      },
    }),
    // Gasto fijo pendiente - servicios
    prisma.expense.create({
      data: {
        organizationId: org.id,
        description: 'Servicios (luz, internet, teléfono) - Febrero 2026',
        amount: 31000,
        date: daysAgo(15),
        dueDate: daysFromNow(10),
        type: 'FIXED',
        status: 'PENDING',
      },
    }),
    // Gasto variable pagado
    prisma.expense.create({
      data: {
        organizationId: org.id,
        description: 'Software contable - licencia anual',
        amount: 95000,
        date: daysAgo(20),
        type: 'VARIABLE',
        status: 'PAID',
        paidAt: daysAgo(20),
        notes: 'Renovación licencia ContaPlus Pro',
      },
    }),
    // Gasto variable pendiente
    prisma.expense.create({
      data: {
        organizationId: org.id,
        description: 'Capacitación equipo - Curso Excel avanzado',
        amount: 42000,
        date: daysAgo(5),
        dueDate: daysFromNow(15),
        type: 'VARIABLE',
        status: 'PENDING',
      },
    }),
    // Gasto vencido
    prisma.expense.create({
      data: {
        organizationId: org.id,
        description: 'Monotributo - Enero 2026',
        amount: 18500,
        date: daysAgo(50),
        dueDate: daysAgo(20),
        type: 'FIXED',
        status: 'OVERDUE',
        notes: 'Pago atrasado - regularizar urgente',
      },
    }),
  ]);
  console.log(`✅ Gastos creados`);

  console.log('\n🎉 Seed completado con éxito!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Credenciales de acceso:');
  console.log('  Email:    admin@adminapp.dev');
  console.log('  Password: Admin1234!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
