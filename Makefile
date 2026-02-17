.PHONY: help up down build rebuild ps logs logs-api logs-web mysql minio-console api-shell web-shell db-ip migrate migrate-reset prisma-studio seed dev-api dev-web

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# =============================================
# DOCKER
# =============================================

up: ## Levanta todos los servicios
	docker compose up -d

down: ## Baja todos los servicios
	docker compose down

build: ## Construye las imágenes
	docker compose build

rebuild: ## Reconstruye y levanta (sin cache)
	docker compose up -d --build --force-recreate

ps: ## Estado de los contenedores
	docker compose ps

logs: ## Logs de todos los servicios (follow)
	docker compose logs -f

logs-api: ## Logs del API (follow)
	docker compose logs -f api

logs-web: ## Logs del frontend (follow)
	docker compose logs -f web

# =============================================
# SHELLS Y ACCESOS
# =============================================

mysql: ## CLI MySQL como root
	docker compose exec mysql mysql -uroot -p$${MYSQL_ROOT_PASSWORD} adminapp

api-shell: ## Shell dentro del contenedor API
	docker compose exec api sh

web-shell: ## Shell dentro del contenedor Web
	docker compose exec web sh

minio-console: ## Abre MinIO Console en el navegador
	@echo "MinIO Console: http://localhost:9001"
	@open http://localhost:9001 2>/dev/null || xdg-open http://localhost:9001 2>/dev/null || echo "Abrí http://localhost:9001 en tu navegador"

# =============================================
# PRISMA (ejecutar en local, no en Docker)
# =============================================

migrate: ## Ejecuta migraciones pendientes (requiere MySQL corriendo)
	cd api && DATABASE_URL="mysql://root:$${MYSQL_ROOT_PASSWORD}@localhost:3306/adminapp" npx prisma migrate dev

migrate-reset: ## Reset completo de la DB y re-aplica migraciones
	cd api && DATABASE_URL="mysql://root:$${MYSQL_ROOT_PASSWORD}@localhost:3306/adminapp" npx prisma migrate reset

prisma-studio: ## Abre Prisma Studio (GUI para la DB)
	cd api && npx prisma studio

generate: ## Regenera el Prisma Client
	cd api && npx prisma generate

# =============================================
# DESARROLLO LOCAL (sin Docker para API/Web)
# =============================================

dev-api: ## Inicia el API en modo desarrollo (local, sin Docker)
	cd api && npm run start:dev

dev-web: ## Inicia el frontend en modo desarrollo (local, sin Docker)
	cd web && npm run dev

dev: ## Inicia API y Web en modo desarrollo (local)
	@echo "Asegurate de tener MySQL y MinIO corriendo (make infra)"
	@make dev-api & make dev-web

infra: ## Levanta solo MySQL y MinIO (para desarrollo local)
	docker compose up -d mysql minio

# =============================================
# UTILIDADES
# =============================================

db-ip: ## IP del contenedor MySQL
	docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' adminapp-mysql

clean: ## Baja todo y elimina volúmenes (BORRA datos)
	@echo "⚠️  Esto eliminará todos los datos de MySQL y MinIO"
	@read -p "¿Estás seguro? [y/N] " confirm && [ "$$confirm" = "y" ] && docker compose down -v || echo "Cancelado"
