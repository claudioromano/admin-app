# Plan de Proyecto: AdminApp

## 1. Visión General

**AdminApp** es una aplicación web para administración básica de pequeños emprendimientos, freelancers y equipos de trabajo. Permite registrar clientes, facturas emitidas, gastos, y llevar un control claro de cobros y pagos, con archivos adjuntos como respaldo documental.

La app está diseñada con arquitectura desacoplada (API REST + cliente web) para facilitar la futura implementación de un cliente mobile con Ionic.

---

## 2. Arquitectura General

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Next.js App   │────▶│   NestJS API    │────▶│    MySQL     │
│   (Frontend)    │ JWT │   (Backend)     │     │   (Docker)   │
│   Port 3000     │     │   Port 4000     │     │   Port 3306  │
└─────────────────┘     └────────┬────────┘     └──────────────┘
                                 │
                                 ▼
                        ┌──────────────┐
                        │    MinIO      │
                        │  (S3 storage) │
                        │  Port 9000    │
                        └──────────────┘
```

### Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend API | NestJS (Node.js + TypeScript) |
| ORM | Prisma |
| Base de datos | MySQL 8 (Docker) |
| Almacenamiento de archivos | MinIO (Docker, S3-compatible) |
| Autenticación | JWT (access token + refresh token) |
| Frontend | Next.js 16 (App Router) |
| UI Components | HeroUI (NextUI rebrand) |
| Estilos | TailwindCSS |
| Containerización | Docker + docker-compose |

---

## 3. Modelo de Datos

### 3.1 Diagrama de Entidades

```
User ──┐
       ├── many-to-many ──▶ Organization (con rol)
       │
       └── PaymentAccount (cuentas de cobro del usuario)

Organization
  ├── Client
  │     └── Invoice
  │           ├── InvoiceFile (adjuntos)
  │           └── PaymentAccount (cuenta donde se cobra)
  ├── Expense
  │     └── ExpenseFile (adjuntos)
  └── OrganizationPaymentAccount (enlace a PaymentAccount de un usuario)
```

### 3.2 Esquema Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============================================
// USUARIOS Y AUTENTICACIÓN
// ============================================

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  password     String   // bcrypt hash
  name         String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relaciones
  memberships      OrganizationMember[]
  paymentAccounts  PaymentAccount[]
  refreshTokens    RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique @db.VarChar(500)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
}

// ============================================
// ORGANIZACIONES Y MEMBRESÍAS
// ============================================

model Organization {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  members         OrganizationMember[]
  clients         Client[]
  invoices        Invoice[]
  expenses        Expense[]
  paymentAccounts OrganizationPaymentAccount[]
}

model OrganizationMember {
  id             String       @id @default(uuid())
  userId         String
  organizationId String
  role           MemberRole   @default(MEMBER)
  createdAt      DateTime     @default(now())

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@index([organizationId])
}

enum MemberRole {
  OWNER    // Creador, control total
  ADMIN    // Puede gestionar todo excepto eliminar la org
  MEMBER   // Puede crear/editar registros
  VIEWER   // Solo lectura
}

// ============================================
// CUENTAS DE COBRO/PAGO
// ============================================

model PaymentAccount {
  id          String   @id @default(uuid())
  userId      String
  name        String   // Ej: "Banco Galicia - Cuenta Corriente"
  holder      String   // Titular de la cuenta
  description String?  @db.Text
  alias       String?  // Alias o CBU
  type        PaymentAccountType
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user          User                         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organizations OrganizationPaymentAccount[]
  invoices      Invoice[]

  @@index([userId])
}

enum PaymentAccountType {
  BANK              // Cuenta bancaria
  VIRTUAL_WALLET    // Mercado Pago, Ualá, etc.
  CRYPTO            // Wallet crypto
  OTHER
}

model OrganizationPaymentAccount {
  id               String   @id @default(uuid())
  organizationId   String
  paymentAccountId String
  createdAt        DateTime @default(now())

  organization   Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  paymentAccount PaymentAccount @relation(fields: [paymentAccountId], references: [id], onDelete: Cascade)

  @@unique([organizationId, paymentAccountId])
  @@index([organizationId])
}

// ============================================
// CLIENTES
// ============================================

model Client {
  id             String   @id @default(uuid())
  organizationId String
  name           String
  company        String?
  email          String?
  phone          String?
  notes          String?  @db.Text
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invoices     Invoice[]

  @@index([organizationId])
}

// ============================================
// FACTURAS EMITIDAS
// ============================================

model Invoice {
  id               String        @id @default(uuid())
  organizationId   String
  clientId         String
  paymentAccountId String?       // Cuenta donde se espera el cobro
  number           String?       // Número de factura (opcional, informativo)
  description      String?       @db.Text
  amount           Decimal       @db.Decimal(12, 2)
  date             DateTime      // Fecha de emisión
  dueDate          DateTime?     // Fecha de vencimiento
  status           InvoiceStatus @default(PENDING)
  paidAt           DateTime?     // Fecha real de cobro
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  organization   Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  client         Client          @relation(fields: [clientId], references: [id], onDelete: Restrict)
  paymentAccount PaymentAccount? @relation(fields: [paymentAccountId], references: [id], onDelete: SetNull)
  files          InvoiceFile[]

  @@index([organizationId])
  @@index([clientId])
  @@index([status])
  @@index([date])
}

enum InvoiceStatus {
  PENDING    // Emitida, pendiente de cobro
  PAID       // Cobrada
  OVERDUE    // Vencida sin cobrar
  CANCELLED  // Anulada
}

model InvoiceFile {
  id        String   @id @default(uuid())
  invoiceId String
  fileName  String
  fileKey   String   // Key en MinIO
  fileSize  Int
  mimeType  String
  createdAt DateTime @default(now())

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
}

// ============================================
// GASTOS
// ============================================

model Expense {
  id             String        @id @default(uuid())
  organizationId String
  description    String
  amount         Decimal       @db.Decimal(12, 2)
  date           DateTime      // Fecha del gasto
  dueDate        DateTime?     // Fecha de vencimiento del pago
  type           ExpenseType
  status         ExpenseStatus @default(PENDING)
  paidAt         DateTime?     // Fecha real de pago
  notes          String?       @db.Text
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  organization Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  files        ExpenseFile[]

  @@index([organizationId])
  @@index([status])
  @@index([date])
}

enum ExpenseType {
  FIXED      // Gasto fijo (alquiler, servicios, etc.)
  VARIABLE   // Gasto variable
}

enum ExpenseStatus {
  PENDING   // Pendiente de pago
  PAID      // Pagado
  OVERDUE   // Vencido sin pagar
}

model ExpenseFile {
  id        String          @id @default(uuid())
  expenseId String
  fileName  String
  fileKey   String          // Key en MinIO
  fileSize  Int
  mimeType  String
  type      ExpenseFileType
  createdAt DateTime        @default(now())

  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)

  @@index([expenseId])
}

enum ExpenseFileType {
  INVOICE   // Factura/recibo del proveedor
  RECEIPT   // Comprobante de pago/transferencia
  OTHER
}
```

---

## 4. Arquitectura del Backend (NestJS)

### 4.1 Estructura de Módulos

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts      // @CurrentUser()
│   │   └── current-organization.decorator.ts // @CurrentOrg()
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── organization-role.guard.ts     // Verifica rol en org
│   ├── interceptors/
│   │   └── transform.interceptor.ts       // Respuestas consistentes
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── dto/
│       └── pagination.dto.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts             // POST /auth/register, /auth/login, /auth/refresh
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       └── auth-response.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts            // GET /users/me, PATCH /users/me
│   │   ├── users.service.ts
│   │   └── dto/
│   │       └── update-user.dto.ts
│   ├── organizations/
│   │   ├── organizations.module.ts
│   │   ├── organizations.controller.ts    // CRUD /organizations
│   │   ├── organizations.service.ts
│   │   ├── members.controller.ts          // GET/POST/PATCH/DELETE /organizations/:id/members
│   │   ├── members.service.ts
│   │   └── dto/
│   │       ├── create-organization.dto.ts
│   │       ├── update-organization.dto.ts
│   │       ├── invite-member.dto.ts
│   │       └── update-member-role.dto.ts
│   ├── clients/
│   │   ├── clients.module.ts
│   │   ├── clients.controller.ts          // CRUD /organizations/:orgId/clients
│   │   ├── clients.service.ts
│   │   └── dto/
│   │       ├── create-client.dto.ts
│   │       └── update-client.dto.ts
│   ├── invoices/
│   │   ├── invoices.module.ts
│   │   ├── invoices.controller.ts         // CRUD /organizations/:orgId/invoices
│   │   ├── invoices.service.ts
│   │   └── dto/
│   │       ├── create-invoice.dto.ts
│   │       ├── update-invoice.dto.ts
│   │       └── invoice-filters.dto.ts
│   ├── expenses/
│   │   ├── expenses.module.ts
│   │   ├── expenses.controller.ts         // CRUD /organizations/:orgId/expenses
│   │   ├── expenses.service.ts
│   │   └── dto/
│   │       ├── create-expense.dto.ts
│   │       ├── update-expense.dto.ts
│   │       └── expense-filters.dto.ts
│   ├── payment-accounts/
│   │   ├── payment-accounts.module.ts
│   │   ├── payment-accounts.controller.ts // CRUD /payment-accounts (del usuario)
│   │   ├── payment-accounts.service.ts
│   │   └── dto/
│   │       ├── create-payment-account.dto.ts
│   │       └── update-payment-account.dto.ts
│   ├── files/
│   │   ├── files.module.ts
│   │   ├── files.controller.ts            // POST /files/upload, GET /files/:key
│   │   ├── files.service.ts               // Interacción con MinIO
│   │   └── minio.provider.ts
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
└── config/
    ├── app.config.ts
    ├── jwt.config.ts
    └── minio.config.ts
```

### 4.2 Endpoints de la API

#### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Login, devuelve access + refresh token |
| POST | `/auth/refresh` | Renueva access token con refresh token |
| POST | `/auth/logout` | Invalida refresh token |

#### Users
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/users/me` | Perfil del usuario autenticado |
| PATCH | `/users/me` | Actualizar perfil |

#### Organizations
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/organizations` | Listar orgs del usuario |
| POST | `/organizations` | Crear nueva org |
| GET | `/organizations/:id` | Detalle de org |
| PATCH | `/organizations/:id` | Actualizar org |
| DELETE | `/organizations/:id` | Eliminar org (solo OWNER) |
| GET | `/organizations/:id/members` | Listar miembros |
| POST | `/organizations/:id/members` | Invitar miembro |
| PATCH | `/organizations/:id/members/:memberId` | Cambiar rol |
| DELETE | `/organizations/:id/members/:memberId` | Remover miembro |

#### Payment Accounts
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/payment-accounts` | Cuentas del usuario |
| POST | `/payment-accounts` | Crear cuenta |
| PATCH | `/payment-accounts/:id` | Actualizar cuenta |
| DELETE | `/payment-accounts/:id` | Eliminar cuenta |
| GET | `/organizations/:orgId/payment-accounts` | Cuentas vinculadas a org |
| POST | `/organizations/:orgId/payment-accounts` | Vincular cuenta a org |
| DELETE | `/organizations/:orgId/payment-accounts/:id` | Desvincular cuenta |

#### Clients
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/organizations/:orgId/clients` | Listar clientes (filtros, paginación) |
| POST | `/organizations/:orgId/clients` | Crear cliente |
| GET | `/organizations/:orgId/clients/:id` | Detalle de cliente |
| PATCH | `/organizations/:orgId/clients/:id` | Actualizar cliente |
| DELETE | `/organizations/:orgId/clients/:id` | Eliminar cliente |

#### Invoices
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/organizations/:orgId/invoices` | Listar facturas (filtros por estado, fecha, cliente) |
| POST | `/organizations/:orgId/invoices` | Crear factura |
| GET | `/organizations/:orgId/invoices/:id` | Detalle de factura |
| PATCH | `/organizations/:orgId/invoices/:id` | Actualizar factura |
| DELETE | `/organizations/:orgId/invoices/:id` | Eliminar factura |
| PATCH | `/organizations/:orgId/invoices/:id/status` | Cambiar estado (marcar pagada, etc.) |
| POST | `/organizations/:orgId/invoices/:id/files` | Subir archivo adjunto |
| DELETE | `/organizations/:orgId/invoices/:id/files/:fileId` | Eliminar adjunto |

#### Expenses
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/organizations/:orgId/expenses` | Listar gastos (filtros por estado, tipo, fecha) |
| POST | `/organizations/:orgId/expenses` | Crear gasto |
| GET | `/organizations/:orgId/expenses/:id` | Detalle de gasto |
| PATCH | `/organizations/:orgId/expenses/:id` | Actualizar gasto |
| DELETE | `/organizations/:orgId/expenses/:id` | Eliminar gasto |
| PATCH | `/organizations/:orgId/expenses/:id/status` | Cambiar estado |
| POST | `/organizations/:orgId/expenses/:id/files` | Subir archivo (tipo: INVOICE/RECEIPT/OTHER) |
| DELETE | `/organizations/:orgId/expenses/:id/files/:fileId` | Eliminar adjunto |

#### Files
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/files/:key` | Descargar/previsualizar archivo (URL firmada de MinIO) |

---

## 5. Arquitectura del Frontend (Next.js)

### 5.1 Estructura de Carpetas

```
src/
├── app/
│   ├── layout.tsx                          // Layout raíz
│   ├── page.tsx                            // Landing / redirect a login
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx                      // Layout con sidebar + org selector
│       ├── page.tsx                        // Home/resumen de la org activa
│       ├── clients/
│       │   ├── page.tsx                    // Listado de clientes
│       │   └── [id]/page.tsx              // Detalle/edición cliente
│       ├── invoices/
│       │   ├── page.tsx                    // Listado de facturas
│       │   └── [id]/page.tsx              // Detalle/edición factura
│       ├── expenses/
│       │   ├── page.tsx                    // Listado de gastos
│       │   └── [id]/page.tsx              // Detalle/edición gasto
│       ├── payment-accounts/
│       │   └── page.tsx                    // Gestión de cuentas
│       └── settings/
│           ├── page.tsx                    // Config de la org (miembros, datos)
│           └── profile/page.tsx           // Perfil personal
├── components/
│   ├── ui/                                 // Componentes base/wrappers HeroUI
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── OrgSelector.tsx
│   ├── clients/
│   │   ├── ClientList.tsx
│   │   ├── ClientForm.tsx
│   │   └── ClientCard.tsx
│   ├── invoices/
│   │   ├── InvoiceList.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoiceStatusBadge.tsx
│   │   └── InvoicePendingAlert.tsx
│   ├── expenses/
│   │   ├── ExpenseList.tsx
│   │   ├── ExpenseForm.tsx
│   │   └── ExpenseFileUpload.tsx
│   └── shared/
│       ├── DataTable.tsx                   // Tabla reutilizable con filtros
│       ├── FileUploader.tsx
│       ├── ConfirmDialog.tsx
│       ├── EmptyState.tsx
│       └── PageHeader.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts                      // Axios/fetch wrapper con JWT
│   │   ├── auth.ts
│   │   ├── organizations.ts
│   │   ├── clients.ts
│   │   ├── invoices.ts
│   │   ├── expenses.ts
│   │   ├── payment-accounts.ts
│   │   └── files.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOrganization.ts             // Org activa
│   │   └── useDebounce.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── OrganizationContext.tsx
│   └── utils/
│       ├── format.ts                      // Formateo de moneda, fechas
│       └── validators.ts
└── types/
    ├── auth.ts
    ├── organization.ts
    ├── client.ts
    ├── invoice.ts
    ├── expense.ts
    └── payment-account.ts
```

### 5.2 Pantallas Principales

1. **Login / Registro**: Formularios simples y limpios.
2. **Selector de Organización**: Al loguearse, si tiene más de una org, elige cuál usar. Si tiene una sola, entra directo.
3. **Home (org activa)**: Resumen rápido — facturas pendientes de cobro, gastos próximos a vencer. No es un dashboard de métricas complejo, es una vista operativa.
4. **Clientes**: Tabla con búsqueda y filtros. Click para ver detalle con sus facturas asociadas.
5. **Facturas**: Tabla filtrable por estado (pendientes destacadas), cliente, mes. Formulario de creación/edición con selector de cliente y cuenta de cobro. Upload de archivos adjuntos.
6. **Gastos**: Tabla filtrable por estado, tipo (fijo/variable), mes. Upload de comprobantes categorizados (factura proveedor / comprobante pago).
7. **Cuentas de Cobro**: CRUD simple de cuentas del usuario, con opción de vincular/desvincular de organizaciones.
8. **Settings**: Gestión de miembros de la org (invitar, cambiar roles, remover). Perfil personal del usuario.

---

## 6. Docker Compose

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8
    container_name: adminapp-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: adminapp
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - adminapp

  minio:
    image: minio/minio
    container_name: adminapp-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"   # MinIO Console
    volumes:
      - minio_data:/data
    networks:
      - adminapp

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: adminapp-api
    restart: unless-stopped
    environment:
      DATABASE_URL: mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@mysql:3306/adminapp
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      MINIO_BUCKET: adminapp
    ports:
      - "4000:4000"
    depends_on:
      - mysql
      - minio
    networks:
      - adminapp

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    container_name: adminapp-web
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    ports:
      - "3000:3000"
    depends_on:
      - api
    networks:
      - adminapp

volumes:
  mysql_data:
  minio_data:

networks:
  adminapp:
    driver: bridge
```

---

## 7. Plan de Ejecución por Fases

El desarrollo está dividido en fases incrementales. Cada fase produce algo funcional y testeable antes de avanzar a la siguiente.

### FASE 1: Infraestructura Base
**Objetivo**: Proyecto inicializado, Docker corriendo, base de datos lista.

**Tareas**:
1. Crear estructura de repositorio monorepo con carpetas `/api` y `/web`.
2. Inicializar proyecto NestJS en `/api` con TypeScript.
3. Configurar Prisma con MySQL, crear schema inicial completo (todos los modelos).
4. Ejecutar migraciones iniciales.
5. Inicializar proyecto Next.js en `/web` con App Router y TypeScript.
6. Instalar y configurar HeroUI + TailwindCSS en el frontend.
7. Crear `docker-compose.yml` con MySQL, MinIO, API y Web.
8. Crear Dockerfiles para API y Web.
9. Configurar `.env.example` con todas las variables.
10. Verificar que todo levanta correctamente con `docker-compose up`.

**Entregable**: Los 4 servicios corriendo en Docker. Prisma conectado a MySQL con las tablas creadas.

---

### FASE 2: Autenticación
**Objetivo**: Sistema de auth completo con JWT.

**Tareas**:
1. Módulo `auth` en NestJS: registro, login, refresh token, logout.
2. Hash de contraseñas con bcrypt.
3. Estrategia JWT con Passport.
4. Guard global para rutas protegidas.
5. Módulo `users`: endpoint GET/PATCH para perfil.
6. En el frontend: páginas de login y registro.
7. Context de autenticación (AuthContext) con manejo de tokens.
8. API client (axios/fetch) con interceptor para adjuntar JWT y renovar automáticamente con refresh token.
9. Middleware de Next.js para proteger rutas del dashboard.
10. Flujo completo: registrar usuario → login → acceder al dashboard → refresh → logout.

**Entregable**: Un usuario puede registrarse, loguearse y ver una página protegida vacía (shell del dashboard).

---

### FASE 3: Organizaciones y Layout Principal
**Objetivo**: Modelo de organizaciones funcionando, layout del dashboard completo.

**Tareas**:
1. Módulo `organizations` en NestJS: CRUD completo.
2. Al registrarse, crear automáticamente una organización personal (con nombre del usuario).
3. Módulo `members`: invitar por email, listar, cambiar rol, remover.
4. Guard de organización que valida que el usuario pertenece a la org y tiene el rol necesario.
5. En el frontend: layout del dashboard con sidebar, header, y selector de organización.
6. OrganizationContext para manejar la org activa.
7. Página de settings con gestión de miembros.
8. Flujo: crear org → invitar miembro → cambiar de org activa.

**Entregable**: Dashboard con navegación completa, posibilidad de crear orgs, invitar miembros y cambiar entre orgs.

---

### FASE 4: Clientes
**Objetivo**: CRUD completo de clientes.

**Tareas**:
1. Módulo `clients` en NestJS: CRUD con paginación, búsqueda y ordenamiento.
2. Validación de DTOs con class-validator.
3. En el frontend: página de listado con DataTable (búsqueda, filtros, paginación).
4. Formulario de creación/edición de cliente (modal o página).
5. Vista de detalle de cliente.
6. Confirmación antes de eliminar.

**Entregable**: Gestión completa de clientes dentro de una organización.

---

### FASE 5: Cuentas de Cobro
**Objetivo**: CRUD de cuentas de pago del usuario y vinculación a organizaciones.

**Tareas**:
1. Módulo `payment-accounts` en NestJS: CRUD para cuentas del usuario.
2. Endpoints para vincular/desvincular cuentas a organizaciones.
3. En el frontend: página de gestión de cuentas.
4. Selector de cuentas disponibles en la org (para uso en facturas).

**Entregable**: El usuario puede gestionar sus cuentas y vincularlas a las orgs donde participa.

---

### FASE 6: Facturas
**Objetivo**: CRUD completo de facturas con archivos adjuntos.

**Tareas**:
1. Módulo `invoices` en NestJS: CRUD con filtros (estado, cliente, rango de fechas, mes).
2. Endpoint para cambiar estado de factura.
3. Integración con MinIO para subida y descarga de archivos adjuntos.
4. Módulo `files` en NestJS: servicio de MinIO, upload, descarga con URL firmada.
5. En el frontend: listado de facturas con filtros y badges de estado.
6. Formulario de factura con selector de cliente y cuenta de cobro.
7. Upload de archivos adjuntos en el detalle de factura.
8. Vista destacada de facturas pendientes de cobro.

**Entregable**: Gestión completa de facturas con adjuntos. Vista clara de qué está pendiente de cobro.

---

### FASE 7: Gastos
**Objetivo**: CRUD completo de gastos con archivos categorizados.

**Tareas**:
1. Módulo `expenses` en NestJS: CRUD con filtros (estado, tipo, rango de fechas).
2. Endpoint para cambiar estado de gasto.
3. Subida de archivos con categoría (factura proveedor / comprobante pago / otro).
4. En el frontend: listado de gastos con filtros.
5. Formulario de gasto con upload categorizado.
6. Vista de gastos pendientes de pago.

**Entregable**: Gestión completa de gastos con documentación adjunta categorizada.

---

### FASE 8: Home y Vista Operativa
**Objetivo**: Página de inicio útil con resumen operativo.

**Tareas**:
1. Endpoint en API que devuelva resumen: facturas pendientes, gastos por vencer, últimos movimientos.
2. En el frontend: página Home con cards resumen.
3. Lista de facturas pendientes de cobro con acceso rápido.
4. Lista de gastos próximos a vencer.
5. Accesos rápidos a las acciones más comunes (nueva factura, nuevo gasto, etc.).

**Entregable**: Al entrar al dashboard, el usuario ve inmediatamente qué necesita atención.

---

### FASE 9: Pulido y Calidad
**Objetivo**: Refinar UX, manejo de errores, y preparar para producción.

**Tareas**:
1. Manejo global de errores en API (filtro de excepciones consistente).
2. Manejo de errores en frontend (toast notifications, estados de error).
3. Loading states y skeletons en todas las páginas.
4. Empty states para listas vacías.
5. Validaciones completas en formularios (frontend y backend).
6. Responsive design (mobile-first donde aplique).
7. Revisión de seguridad: sanitización de inputs, rate limiting en auth.
8. Seed script para datos de prueba.
9. README actualizado con instrucciones de setup y uso.

**Entregable**: App pulida, con buena UX, lista para uso real.

---

## 8. Notas para Claude Code

Cada fase debe ejecutarse como una unidad. Al iniciar una fase:

1. **Leer este documento completo** para tener contexto de la arquitectura.
2. **Seguir el schema de Prisma** tal como está definido (no modificar sin consultar).
3. **Respetar la estructura de carpetas** definida para backend y frontend.
4. **Usar convenciones de NestJS**: módulos, servicios, controladores, DTOs con class-validator, guards.
5. **En el frontend**: usar HeroUI como librería de componentes, TailwindCSS para estilos custom, App Router de Next.js.
6. **Cada endpoint debe tener**: validación de input, manejo de errores, verificación de pertenencia a la organización.
7. **Los archivos se suben a MinIO**, nunca al filesystem local.
8. **UUIDs en todos los IDs**, nunca auto-increment.
9. **Todas las fechas en UTC**.
10. **Decimal para montos**, nunca Float.

### Variables de Entorno (.env)

```env
# MySQL
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_USER=adminapp
MYSQL_PASSWORD=adminapp_password

# API
DATABASE_URL=mysql://adminapp:adminapp_password@localhost:3306/adminapp
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadminpassword
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_BUCKET=adminapp
MINIO_USE_SSL=false

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
```