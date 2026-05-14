# Dockerization Setup (Backend + Frontend)

Fecha: 2026-05-14
Branch objetivo: `feature/dockerization-setup`

## Objetivo
Levantar backend y frontend con Docker Compose, manteniendo la base de datos fuera de Docker (local en host).

## Archivos creados
- `docker-compose.yml` (raiz del repo)
- `aicrm_backend/Dockerfile`
- `aicrm_backend/.dockerignore`
- `aicrm_frontend/Dockerfile`
- `aicrm_frontend/.dockerignore`

## Archivos actualizados
- `aicrm_backend/.env.example`
- `aicrm_frontend/.env.example`
- `aicrm_backend/PROGRESS.md`

## Estrategia usada
- Backend:
  - Imagen Node 20 Alpine.
  - Build de produccion en etapa `builder`.
  - Runtime con `npm run start:prod`.
  - Puerto expuesto: `3000`.
- Frontend:
  - Contenedor orientado a desarrollo (Vite dev server).
  - Comando: `npm run dev -- --host 0.0.0.0 --port 5173`.
  - Puerto expuesto: `5173`.
  - Se prioriza velocidad de iteracion local.

## docker-compose.yml (resumen)
- Servicio `backend`:
  - build: `./aicrm_backend`
  - `env_file`: `./aicrm_backend/.env`
  - `ports`: `3000:3000`
  - `DB_HOST` forzado a `host.docker.internal` para acceso a DB local del host.
  - `extra_hosts`: `host.docker.internal:host-gateway` para compatibilidad.
- Servicio `frontend`:
  - build: `./aicrm_frontend`
  - `ports`: `5173:5173`
  - variables Vite para API local:
    - `VITE_API_URL=http://localhost:3000/api/v1`
    - `VITE_GOOGLE_LOGIN_START_URL=http://localhost:3000/api/v1/auth/google/start`
  - volumenes para desarrollo:
    - `./aicrm_frontend:/app`
    - `/app/node_modules`

## Variables de entorno backend con Docker
- El backend carga variables desde:
  - `aicrm_backend/.env` (via `env_file` en Compose).
- No se incluyen secretos en archivos versionados.
- Para DB local desde contenedor:
  - usar `DB_HOST=host.docker.internal`.
  - mantener `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` segun tu entorno local.

## Comandos de ejecucion
Desde la raiz del repo:

```bash
docker compose up --build
```

Para detener y limpiar contenedores de esta compose:

```bash
docker compose down
```

## Puertos
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

## Checklist rapido de validacion manual
1. Levantar con `docker compose up --build`.
2. Abrir frontend en `http://localhost:5173`.
3. Verificar que el frontend consume backend en `http://localhost:3000/api/v1`.
4. Validar que backend conecta a MySQL local del host.

## Troubleshooting comun
1. Backend no conecta a DB local:
- revisar `DB_HOST` efectivo en contenedor (`host.docker.internal`).
- verificar que MySQL local acepta conexiones externas/no solo socket local.

2. Frontend no refleja cambios:
- confirmar volumen `./aicrm_frontend:/app`.
- revisar logs del contenedor frontend.

3. Error por `.env` faltante backend:
- crear `aicrm_backend/.env` a partir de `.env.example` con valores reales locales.

4. Linux sin resolucion `host.docker.internal`:
- Compose ya agrega `extra_hosts: host.docker.internal:host-gateway`.
- si la distribucion Docker es muy antigua, actualizar Docker Engine/Compose plugin.

## Alcance y restricciones respetadas
- No se dockerizo la base de datos.
- No se ejecutaron migraciones.
- No se cambio logica de negocio.
- No se modificaron flujos OAuth, WhatsApp, SMTP, PDF, carrito, checkout ni IA.
