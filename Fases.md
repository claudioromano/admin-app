## Fases completadas

### Fase 5: Cuentas de Cobro — Completada
                                                           
Backend (NestJS)                
                   
Módulo payment-accounts (api/src/modules/payment-accounts/):

Archivo: dto/create-payment-account.dto.ts
Descripción: Validación con name, holder, type (enum), description?, alias?
────────────────────────────────────────  
Archivo: dto/update-payment-account.dto.ts
Descripción: Todos los campos opcionales para PATCH
────────────────────────────────────────
Archivo: dto/link-payment-account.dto.ts
Descripción: Valida paymentAccountId (UUID) para vincular
────────────────────────────────────────
Archivo: payment-accounts.service.ts
Descripción: CRUD del usuario + lógica de vincular/desvincular con validación de propiedad
────────────────────────────────────────
Archivo: payment-accounts.controller.ts
Descripción: GET/POST/PATCH/DELETE /payment-accounts protegido con JwtAuthGuard
────────────────────────────────────────
Archivo: org-payment-accounts.controller.ts
Descripción: GET/POST/DELETE /organizations/:orgId/payment-accounts protegido con JwtAuthGuard + OrganizationRoleGuard
────────────────────────────────────────
Archivo: payment-accounts.module.ts
Descripción: Registra ambos controllers y el service
El módulo fue registrado en app.module.ts.

Frontend (Next.js)

Archivo: types/payment-account.ts
Descripción: Tipos PaymentAccount, CreatePaymentAccountData, UpdatePaymentAccountData, labels por tipo
────────────────────────────────────────
Archivo: lib/api/payment-accounts.ts
Descripción: Funciones cliente: CRUD de cuentas + vincular/desvincular a org
────────────────────────────────────────
Archivo: app/api/payment-accounts/route.ts
Descripción: Proxy Next.js → GET/POST/PATCH/DELETE /payment-accounts
────────────────────────────────────────
Archivo: app/api/organizations/payment-accounts/route.ts
Descripción: Proxy Next.js → GET/POST/DELETE /organizations/:orgId/payment-accounts
────────────────────────────────────────
Archivo: app/(dashboard)/dashboard/payment-accounts/page.tsx
Descripción: Página completa con CRUD + vinculación

La página incluye:

- "Mis cuentas": cards con tipo, nombre, titular, alias — con botones Editar/Eliminar
- Vinculación en línea: cada card muestra si está vinculada a la org activa, con botón "Vincular /
Desvincular"
- "Cuentas en {org}": tabla de cuentas disponibles para usar en facturas
- Modal crear/editar: campos nombre, titular, tipo (select), alias/CBU, descripción
- Modal de confirmación antes de eliminar


### Fase 6 Facturas — Backend completado
                                                                                        
  Dependencias instaladas                                        
  - minio — SDK cliente de MinIO                                   
  - @types/multer — Tipos TypeScript para manejo de archivos multipart

  ---
  Módulo files (src/modules/files/)

  Archivo: minio.provider.ts
  Responsabilidad: Crea e inyecta el cliente Minio.Client via variables de entorno (MINIO_ENDPOINT, MINIO_PORT, MINIO_USE_SSL, MINIO_ACCESS_KEY, MINIO_SECRET_KEY)
  ────────────────────────────────────────
  Archivo: files.service.ts
  Responsabilidad: uploadFile(key, buffer, mimeType, size) · getSignedUrl(key, expirySeconds=3600) · deleteFile(key) · ensureBucket() al init
  ────────────────────────────────────────
  Archivo: files.controller.ts
  Responsabilidad: GET /files/*key → devuelve { url } con URL firmada. Acepta claves con / (paths completos en MinIO)
  ────────────────────────────────────────
  Archivo: files.module.ts
  Responsabilidad: Exporta FilesService para uso en otros módulos
  ---
  
  Módulo invoices (src/modules/invoices/)

  DTOs:

  DTO: CreateInvoiceDto
  Campos clave: clientId (UUID, req), paymentAccountId?, number?, description?, amount (≥0, 2 dec), date (ISO), dueDate?
  ────────────────────────────────────────
  DTO: UpdateInvoiceDto
  Campos clave: Todos opcionales, misma validación
  ────────────────────────────────────────
  DTO: InvoiceFiltersDto
  Campos clave: page, limit, status (enum), clientId, dateFrom, dateTo
  ────────────────────────────────────────
  DTO: UpdateInvoiceStatusDto
  Campos clave: status (enum req), paidAt? (auto-now cuando PAID si se omite)

  Service — lógica destacada:
  - findAll: filtros combinables (status + clientId + rango de fechas), paginado, incluye client, paymentAccount, _count.files
  - findById: incluye relaciones completas + array de files
  - create/update: valida que el clientId pertenezca a la org y que el paymentAccountId esté
  vinculado a la org via OrganizationPaymentAccount
  - delete: borra los objetos de MinIO antes de eliminar la factura en DB
  - updateStatus: setea paidAt = now() al marcar PAID, lo limpia en cualquier otro estado
  - addFile: sube a MinIO con key invoices/{invoiceId}/{uuid}-{safeName}, crea registro InvoiceFile
  - removeFile: elimina de MinIO y de DB, verificando pertenencia a la org

  Controller — endpoints bajo /organizations/:orgId/invoices:

  ┌────────┬────────────────────┬──────────────────────────────────────┐
  │ Método │        Ruta        │             Descripción              │
  ├────────┼────────────────────┼──────────────────────────────────────┤
  │ GET    │ /                  │ Listar con filtros + paginación      │
  ├────────┼────────────────────┼──────────────────────────────────────┤
  │ POST   │ /                  │ Crear factura                        │
  ├────────┼────────────────────┼──────────────────────────────────────┤
  │ GET    │ /:id               │ Detalle con archivos                 │
  ├────────┼────────────────────┼──────────────────────────────────────┤
  │ PATCH  │ /:id               │ Actualizar                           │
  ├────────┼────────────────────┼──────────────────────────────────────┤
  │ DELETE │ /:id               │ Eliminar (limpia MinIO)              │
  ├────────┼────────────────────┼──────────────────────────────────────┤
  │ PATCH  │ /:id/status        │ Cambiar estado                       │
  ├────────┼────────────────────┼──────────────────────────────────────┤
  │ POST   │ /:id/files         │ Subir adjunto (multipart, máx 20 MB) │
  ├────────┼────────────────────┼──────────────────────────────────────┤
  │ DELETE │ /:id/files/:fileId │ Eliminar adjunto                     │
  └────────┴────────────────────┴──────────────────────────────────────┘

  Todo protegido con JwtAuthGuard + OrganizationRoleGuard. El upload usa FileInterceptor (multer en
  memoria) + ParseFilePipe con MaxFileSizeValidator.

### Fase 6: Facturas — Frontend completado                                                          
                                                                                                    
  Archivos nuevos creados                                                                           

  Types y utilidades:

  Archivo: types/invoice.ts
  Contenido: Invoice, InvoiceFile, InvoicesPage, tipos de datos, CreateInvoiceData, UpdateInvoiceStatusData,INVOICE_STATUS_LABELS
  ────────────────────────────────────────
  Archivo: lib/utils/format.ts
  Contenido: formatCurrency (ARS), formatDate (es-AR), toDateInput (ISO→YYYY-MM-DD), formatFileSize
  ────────────────────────────────────────
  Archivo: lib/api/invoices.ts
  Contenido: listInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus, uploadInvoiceFile, deleteInvoiceFile, getFileUrl

  Rutas proxy Next.js:

  ┌──────────────────────────────────┬───────────────────────────────────────────────────────────┐
  │               Ruta               │                        Descripción                        │
  ├──────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ app/api/invoices/route.ts        │ CRUD completo: GET (lista + detalle), POST, PATCH, DELETE │
  ├──────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ app/api/invoices/status/route.ts │ PATCH para cambio de estado                               │
  ├──────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ app/api/invoices/files/route.ts  │ POST (multipart upload re-ensamblado con Blob) + DELETE   │
  ├──────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ app/api/files/route.ts           │ GET → retorna URL firmada de MinIO                        │
  └──────────────────────────────────┴───────────────────────────────────────────────────────────┘

  Componente:

  Archivo: components/invoices/InvoiceStatusBadge.tsx
  Descripción: Badge reutilizable con colores: warning/success/danger/default por estado

  Páginas:

  /dashboard/invoices (listado):
  - Alerta amarilla clickeable con conteo de facturas pendientes (carga PENDING count por separado)
  - Filtros combinables: estado (select), cliente (select), mes (<input type="month">) + botón
  "Limpiar filtros"
  - Tabla con columnas: #, cliente+empresa, monto formateado, fecha, vencimiento, estado badge,
  acciones
  - Filas pendientes con borde izquierdo amarillo, vencidas con borde rojo
  - Modal create/edit con: selector de cliente, selector de cuenta de cobro vinculada a la org,
  número, monto, fecha emisión + vencimiento, descripción
  - Paginación
  - Modal de confirmación de eliminación (advierte que elimina adjuntos)

  /dashboard/invoices/[id] (detalle):
  - Grid de datos: monto destacado, fechas, cuenta de cobro, fecha de cobro
  - Sección de cambio de estado con botones contextuales (muestra solo los estados distintos al
  actual)
  - Sección de archivos adjuntos: upload via <input type="file"> oculto, lista con ícono por tipo
  (imagen/PDF/otro), tamaño, fecha, botones "Ver / Descargar" (obtiene URL firmada y abre nueva
  pestaña) y "Eliminar"
  - Modal de edición con todos los campos
  - Modal de confirmación de eliminación de factura