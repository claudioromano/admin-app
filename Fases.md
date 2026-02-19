## Fases completadas

### Fase 5: Cuentas de Cobro — Completada
**Backend (NestJS)**

**Módulo `payment-accounts` (`api/src/modules/payment-accounts/`)**

- **Archivo:** `dto/create-payment-account.dto.ts`  
  **Descripción:** Validación con `name`, `holder`, `type` (enum), `description?`, `alias?`
- **Archivo:** `dto/update-payment-account.dto.ts`  
  **Descripción:** Todos los campos opcionales para `PATCH`
- **Archivo:** `dto/link-payment-account.dto.ts`  
  **Descripción:** Valida `paymentAccountId` (UUID) para vincular
- **Archivo:** `payment-accounts.service.ts`  
  **Descripción:** CRUD del usuario + lógica de vincular/desvincular con validación de propiedad
- **Archivo:** `payment-accounts.controller.ts`  
  **Descripción:** `GET/POST/PATCH/DELETE /payment-accounts` protegido con `JwtAuthGuard`
- **Archivo:** `org-payment-accounts.controller.ts`  
  **Descripción:** `GET/POST/DELETE /organizations/:orgId/payment-accounts` protegido con `JwtAuthGuard + OrganizationRoleGuard`
- **Archivo:** `payment-accounts.module.ts`  
  **Descripción:** Registra ambos controllers y el service

El módulo fue registrado en `app.module.ts`.

Frontend (Next.js)

- **Archivo:** `types/payment-account.ts`  
  **Descripción:** Tipos `PaymentAccount`, `CreatePaymentAccountData`, `UpdatePaymentAccountData`, labels por tipo
- **Archivo:** `lib/api/payment-accounts.ts`  
  **Descripción:** Funciones cliente: CRUD de cuentas + vincular/desvincular a org
- **Archivo:** `app/api/payment-accounts/route.ts`  
  **Descripción:** Proxy Next.js → `GET/POST/PATCH/DELETE /payment-accounts`
- **Archivo:** `app/api/organizations/payment-accounts/route.ts`  
  **Descripción:** Proxy Next.js → `GET/POST/DELETE /organizations/:orgId/payment-accounts`
- **Archivo:** `app/(dashboard)/dashboard/payment-accounts/page.tsx`  
  **Descripción:** Página completa con CRUD + vinculación

La página incluye:

- "Mis cuentas": cards con tipo, nombre, titular, alias — con botones Editar/Eliminar
- Vinculación en línea: cada card muestra si está vinculada a la org activa, con botón "Vincular / Desvincular"
- "Cuentas en {org}": tabla de cuentas disponibles para usar en facturas
- Modal crear/editar: campos nombre, titular, tipo (select), alias/CBU, descripción
- Modal de confirmación antes de eliminar


### Fase 6 Facturas — Backend completado
**Dependencias instaladas**

- `minio` — SDK cliente de MinIO
- `@types/multer` — Tipos TypeScript para manejo de archivos multipart

---

**Módulo `files` (`src/modules/files/`)**

- **Archivo:** `minio.provider.ts`  
  **Responsabilidad:** Crea e inyecta el cliente `Minio.Client` via variables de entorno (`MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`)
- **Archivo:** `files.service.ts`  
  **Responsabilidad:** `uploadFile(key, buffer, mimeType, size)` · `getSignedUrl(key, expirySeconds=3600)` · `deleteFile(key)` · `ensureBucket()` al init
- **Archivo:** `files.controller.ts`  
  **Responsabilidad:** `GET /files/*key` → devuelve `{ url }` con URL firmada. Acepta claves con `/` (paths completos en MinIO)
- **Archivo:** `files.module.ts`  
  **Responsabilidad:** Exporta `FilesService` para uso en otros módulos

---

**Módulo `invoices` (`src/modules/invoices/`)**

DTOs:

- **DTO:** `CreateInvoiceDto`  
  **Campos clave:** `clientId` (UUID, req), `paymentAccountId?`, `number?`, `description?`, `amount` (>= 0, 2 dec), `date` (ISO), `dueDate?`
- **DTO:** `UpdateInvoiceDto`  
  **Campos clave:** Todos opcionales, misma validación
- **DTO:** `InvoiceFiltersDto`  
  **Campos clave:** `page`, `limit`, `status` (enum), `clientId`, `dateFrom`, `dateTo`
- **DTO:** `UpdateInvoiceStatusDto`  
  **Campos clave:** `status` (enum req), `paidAt?` (auto-now cuando `PAID` si se omite)

Service — lógica destacada:

- findAll: filtros combinables (status + clientId + rango de fechas), paginado, incluye client, paymentAccount, _count.files
- findById: incluye relaciones completas + array de files
- create/update: valida que el clientId pertenezca a la org y que el paymentAccountId esté vinculado a la org via OrganizationPaymentAccount
- delete: borra los objetos de MinIO antes de eliminar la factura en DB
- updateStatus: setea paidAt = now() al marcar PAID, lo limpia en cualquier otro estado
- addFile: sube a MinIO con key invoices/{invoiceId}/{uuid}-{safeName}, crea registro InvoiceFile
- removeFile: elimina de MinIO y de DB, verificando pertenencia a la org

Controller — endpoints bajo /organizations/:orgId/invoices:

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar con filtros + paginación |
| POST | `/` | Crear factura |
| GET | `/:id` | Detalle con archivos |
| PATCH | `/:id` | Actualizar |
| DELETE | `/:id` | Eliminar (limpia MinIO) |
| PATCH | `/:id/status` | Cambiar estado |
| POST | `/:id/files` | Subir adjunto (multipart, máx 20 MB) |
| DELETE | `/:id/files/:fileId` | Eliminar adjunto |

Todo protegido con `JwtAuthGuard + OrganizationRoleGuard`. El upload usa `FileInterceptor` (multer en memoria) + `ParseFilePipe` con `MaxFileSizeValidator`.

### Fase 6: Facturas — Frontend completado

Archivos nuevos creados

Types y utilidades:

- **Archivo:** `types/invoice.ts`  
  **Contenido:** `Invoice`, `InvoiceFile`, `InvoicesPage`, tipos de datos, `CreateInvoiceData`, `UpdateInvoiceStatusData`, `INVOICE_STATUS_LABELS`
- **Archivo:** `lib/utils/format.ts`  
  **Contenido:** `formatCurrency` (ARS), `formatDate` (es-AR), `toDateInput` (ISO->YYYY-MM-DD), `formatFileSize`
- **Archivo:** `lib/api/invoices.ts`  
  **Contenido:** `listInvoices`, `getInvoice`, `createInvoice`, `updateInvoice`, `deleteInvoice`, `updateInvoiceStatus`, `uploadInvoiceFile`, `deleteInvoiceFile`, `getFileUrl`

Rutas proxy Next.js:

| Ruta | Descripción |
|---|---|
| `app/api/invoices/route.ts` | CRUD completo: `GET` (lista + detalle), `POST`, `PATCH`, `DELETE` |
| `app/api/invoices/status/route.ts` | `PATCH` para cambio de estado |
| `app/api/invoices/files/route.ts` | `POST` (multipart upload re-ensamblado con `Blob`) + `DELETE` |
| `app/api/files/route.ts` | `GET` -> retorna URL firmada de MinIO |

Componente:

- **Archivo:** `components/invoices/InvoiceStatusBadge.tsx`  
  **Descripción:** Badge reutilizable con colores: `warning/success/danger/default` por estado

Páginas:

`/dashboard/invoices` (listado):

- Alerta amarilla clickeable con conteo de facturas pendientes (carga PENDING count por separado)
- Filtros combinables: estado (select), cliente (select), mes (`<input type="month">`) + botón "Limpiar filtros"
- Tabla con columnas: `#`, cliente+empresa, monto formateado, fecha, vencimiento, estado badge, acciones
- Filas pendientes con borde izquierdo amarillo, vencidas con borde rojo
- Modal create/edit con: selector de cliente, selector de cuenta de cobro vinculada a la org, número, monto, fecha emisión + vencimiento, descripción
- Paginación
- Modal de confirmación de eliminación (advierte que elimina adjuntos)

`/dashboard/invoices/[id]` (detalle):

- Grid de datos: monto destacado, fechas, cuenta de cobro, fecha de cobro
- Sección de cambio de estado con botones contextuales (muestra solo los estados distintos al actual)
- Sección de archivos adjuntos: upload via `<input type="file">` oculto, lista con ícono por tipo (imagen/PDF/otro), tamaño, fecha, botones "Ver / Descargar" (obtiene URL firmada y abre nueva pestaña) y "Eliminar"
- Modal de edición con todos los campos
- Modal de confirmación de eliminación de factura

### Fase 7: Expenses — Completada

Resumen de todo lo creado:

---

**Backend (`api/src/modules/expenses/`)**

- **Archivo:** `dto/create-expense.dto.ts`  
  **Descripción:** Valida `description`, `amount`, `date`, `dueDate?`, `type` (`FIXED/VARIABLE`), `notes?`
- **Archivo:** `dto/update-expense.dto.ts`  
  **Descripción:** Todos los campos opcionales
- **Archivo:** `dto/expense-filters.dto.ts`  
  **Descripción:** Filtros `status`, `type`, `dateFrom`, `dateTo`, paginación
- **Archivo:** `dto/update-expense-status.dto.ts`  
  **Descripción:** `status` (`PENDING/PAID/OVERDUE`) + `paidAt?`
- **Archivo:** `expenses.service.ts`  
  **Descripción:** CRUD, `updateStatus` (setea/limpia `paidAt`), `addFile` (con `fileType`), `removeFile`
- **Archivo:** `expenses.controller.ts`  
  **Descripción:** Endpoints bajo `/organizations/:orgId/expenses`, upload con `@Body('fileType')` + validación del enum
- **Archivo:** `expenses.module.ts`  
  **Descripción:** Importa `FilesModule`
- **Archivo:** `app.module.ts`  
  **Descripción:** Agrega `ExpensesModule`

**Frontend**

- **Archivo:** `web/src/types/expense.ts`  
  **Descripción:** Tipos `Expense`, `ExpenseFile`, `ExpensesPage`, labels para `status/type/fileType`
- **Archivo:** `web/src/lib/api/expenses.ts`  
  **Descripción:** Cliente con `listExpenses`, `getExpense`, `createExpense`, `updateExpense`, `deleteExpense`, `updateExpenseStatus`, `uploadExpenseFile`, `deleteExpenseFile`
- **Archivo:** `web/src/app/api/expenses/route.ts`  
  **Descripción:** Proxy `GET/POST/PATCH/DELETE`
- **Archivo:** `web/src/app/api/expenses/status/route.ts`  
  **Descripción:** Proxy `PATCH` de estado
- **Archivo:** `web/src/app/api/expenses/files/route.ts`  
  **Descripción:** Proxy `POST/DELETE` de archivos (incluye `fileType` en el `FormData` upstream)
- **Archivo:** `web/src/app/(dashboard)/dashboard/expenses/page.tsx`  
  **Descripción:** Listado con filtros por estado/tipo/mes, alerta de pendientes, tabla con badges coloreados, modal de creación
- **Archivo:** `web/src/app/(dashboard)/dashboard/expenses/[id]/page.tsx`  
  **Descripción:** Detalle con cambio de estado, adjuntos categorizados (selector `INVOICE/RECEIPT/OTHER` antes de subir), proxy para descarga sin tocar MinIO

### Fase 8: Home y Vista Operativa — Completada

**Backend**

- **Archivo:** `organizations.service.ts`  
  **Cambios:** Nuevo método `getSummary(organizationId)` con 6 queries en paralelo usando `Promise.all`:
  - `invoiceAggregate`: `count + sum` de facturas con status `PENDING | OVERDUE`
  - `pendingInvoices`: top 5 facturas por cobrar, ordenadas por `dueDate asc` (más urgentes primero), incluye datos del cliente
  - `expenseAggregate`: `count + sum` de gastos con status `PENDING`
  - `pendingExpenses`: top 5 gastos pendientes, ordenados por `dueDate asc`
  - `recentInvoices`: últimas 5 facturas (cualquier estado), por `createdAt desc`
  - `recentExpenses`: últimos 5 gastos (cualquier estado), por `createdAt desc`
- **Archivo:** `organizations.controller.ts`  
  **Cambios:** Nuevo endpoint `GET /organizations/:id/summary` protegido con `JwtAuthGuard + OrganizationRoleGuard`

**Frontend**

- **Archivo:** `web/src/app/api/organizations/summary/route.ts`  
  **Cambios:** Proxy `GET /api/organizations/summary?orgId=` -> `GET /organizations/:orgId/summary`
- **Archivo:** `web/src/app/(dashboard)/dashboard/page.tsx`  
  **Cambios:** Home completamente reemplazada con secciones:
  - **Accesos rápidos:** Botones `+ Nueva factura` (primary), `+ Nuevo gasto` (dark), `+ Nuevo cliente` (outline), `Ver facturas`, `Ver gastos`
  - **Cards de resumen:** "Facturas por cobrar" (monto + count, clickeable), "Gastos pendientes de pago" (monto + count, clickeable), "Balance estimado" (cobros - gastos, verde/rojo según signo)
  - **Facturas pendientes:** Lista de hasta 5, ordenadas por urgencia, con cliente, vencimiento, badge de estado y monto. Borde izquierdo rojo para vencidas, amarillo para pendientes
  - **Gastos pendientes:** Lista de hasta 5, ordenados por vencimiento, con descripción, tipo, vencimiento, badge y monto
  - **Actividad reciente:** Feed combinado de facturas + gastos (últimas 8 entradas), ordenado por `createdAt desc`, con ícono, badge de estado y monto, clickeable al detalle

### Fase 9: Hardening + UX — Completada

Resumen de todo lo implementado:

**Backend**

Rate Limiting:

- **Archivo:** `app.module.ts`  
  **Cambios:** Importa `ThrottlerModule` con límite de `10 req/min` por IP
- **Archivo:** `auth.controller.ts`  
  **Cambios:** Aplica `ThrottlerGuard` en endpoints de auth:
  - `/auth/register`: `5 intentos/min`
  - `/auth/login`: `10 intentos/min`

Seed Script:

- **Archivo:** `api/prisma/seed.ts`  
  **Cambios:** Script completo con datos de prueba:
  - Usuario: `admin@adminapp.dev / Admin1234!`
  - Organización: `"Estudio Demo SRL"`
  - 1 cuenta bancaria vinculada
  - 4 clientes con datos variados
  - 6 facturas (`PAID`, `PENDING`, `OVERDUE`, `CANCELLED`)
  - 7 gastos (`PAID`, `PENDING`, `OVERDUE`, con distintos tipos)
- **Archivo:** `api/tsconfig.seed.json`  
  **Cambios:** Override de `tsconfig` para ejecutar seed como CommonJS
- **Archivo:** `api/package.json`  
  **Cambios:** Script `"seed"` y sección `"prisma": { "seed": "..." }`

Para ejecutar el seed:

```bash
cd api && npm run seed
```

**Frontend**

Toast Notifications:

- **Archivo:** `web/src/lib/context/ToastContext.tsx`  
  **Cambios:** `Provider + hook useToast` con auto-dismiss en 4s
- **Archivo:** `web/src/components/ui/Toast.tsx`  
  **Cambios:** `ToastContainer` con 4 tipos (`success/error/warning/info`)
- **Archivo:** `providers.tsx`  
  **Cambios:** Integrado `ToastProvider + ToastContainer`

Skeleton Components:

- **Archivo:** `web/src/components/ui/Skeleton.tsx`  
  **Cambios:** `SkeletonLine`, `SkeletonTable`, `SkeletonCard`, `SkeletonDetail`

Mobile Responsive:

- **Archivo:** `layout.tsx`  
  **Cambios:** Overlay móvil + sidebar con slide-in
- **Archivo:** `Sidebar.tsx`  
  **Cambios:** Botón de cierre en móvil, cierra al navegar
- **Archivo:** `Header.tsx`  
  **Cambios:** Hamburger visible solo en móvil (`md:hidden`)

Páginas actualizadas:

- Todos los `alert()` reemplazados por `showToast()`
- Todos los "Cargando..." reemplazados por `<SkeletonTable>` o `<SkeletonDetail>`
- Empty states con ícono + mensaje + CTA en: clientes, facturas, gastos
- Toast de éxito en: crear/editar/eliminar clientes, facturas, gastos; cambios de estado; adjuntar/eliminar archivos
- Columnas de tabla ocultas en pantallas pequeñas (`hidden sm:table-cell`, `hidden md:table-cell`)
