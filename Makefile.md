# Makefile - Comandos disponibles

## Docker

| Comando | Descripción |
|---------|-------------|
| `make up` | Levanta todos los servicios |
| `make down` | Baja todos los servicios |
| `make build` | Construye las imágenes |
| `make rebuild` | Reconstruye y levanta (sin cache) |
| `make ps` | Estado de los contenedores |
| `make logs` | Logs de todos los servicios (follow) |
| `make logs-api` | Logs del API (follow) |
| `make logs-web` | Logs del frontend (follow) |

## Shells y accesos

| Comando | Descripción |
|---------|-------------|
| `make mysql` | CLI MySQL como root en la DB adminapp |
| `make api-shell` | Shell dentro del contenedor API |
| `make web-shell` | Shell dentro del contenedor Web |
| `make minio-console` | Abre MinIO Console en el navegador (http://localhost:9001) |

## Prisma

Estos comandos se ejecutan en local (no dentro de Docker). Requieren que MySQL esté corriendo.

| Comando | Descripción |
|---------|-------------|
| `make migrate` | Ejecuta migraciones pendientes |
| `make migrate-reset` | Reset completo de la DB y re-aplica migraciones |
| `make prisma-studio` | Abre Prisma Studio (GUI para explorar la DB) |
| `make generate` | Regenera el Prisma Client |

## Desarrollo local (sin Docker para API/Web)

| Comando | Descripción |
|---------|-------------|
| `make infra` | Levanta solo MySQL y MinIO (para desarrollo local) |
| `make dev-api` | Inicia el API en modo desarrollo (local, sin Docker) |
| `make dev-web` | Inicia el frontend en modo desarrollo (local, sin Docker) |
| `make dev` | Inicia API y Web en modo desarrollo (local) |

## Utilidades

| Comando | Descripción |
|---------|-------------|
| `make db-ip` | Muestra la IP del contenedor MySQL |
| `make clean` | Baja todo y elimina volúmenes (BORRA datos, pide confirmación) |
| `make help` | Muestra los comandos disponibles en la terminal |
