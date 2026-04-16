# Zucarlink

Base técnica del MVP de Zucarlink con Semana 4 cerrada, perfiles de Semana 5 operativos, directorio de Semana 6 y foro técnico de Semana 7 listos para iteración.

## Objetivo actual

Este repositorio cubre:

- frontend con `Vite + React + TypeScript`
- rutas públicas y privadas base
- integración con `Supabase`
- autenticación mínima con email/password
- onboarding técnico progresivo
- perfil propio editable
- especialidades, experiencia y avatar conectados a Supabase
- directorio público agregado y directorio privado con filtros
- foro técnico público con detalle, respuestas y creación de temas
- perfil público ligero del autor con actividad visible

## Stack actual

- React
- TypeScript
- Vite
- React Router DOM
- Supabase JS

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm test
```

## Variables de entorno

El archivo `.env.example` documenta las variables mínimas actuales.

```bash
cp .env.example .env
```

Variables requeridas:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WEEK5_DEMO_PASSWORD=
WEEK7_FORUM_PASSWORD=
```

## Base de datos y storage

La base inicial para Semana 4 quedó definida en SQL:

- `supabase/migrations/20260414_000001_initial_schema.sql`
- `supabase/migrations/20260414_000002_avatars_storage.sql`
- `supabase/migrations/20260414_000003_security_baseline.sql`
- `supabase/sql/verify_setup.sql`
- `supabase/sql/verify_security.sql`

Resumen:

- 12 tablas base del MVP
- relaciones mínimas explícitas
- RLS inicial en tablas sensibles
- bucket privado `avatars` listo para fotos de perfil
- trigger para crear `profiles` automáticamente desde `auth.users`
- helper frontend base para upload y signed URLs de avatars

Guía de aplicación:

- [docs/supabase-setup.md](/Users/np/Desktop/programming/zucarlink_mvp/docs/supabase-setup.md)
- [docs/avatar-storage.md](/Users/np/Desktop/programming/zucarlink_mvp/docs/avatar-storage.md)

## Estructura inicial

```text
src/
  app/
  components/
  features/
  layouts/
  lib/
  pages/
  routes/
  styles/
  types/
```

## Arranque local

```bash
npm install
npm run dev
```

## Deploy

- hosting: Vercel
- URL productiva actual: `https://zucarlinkmvp.vercel.app`
- config de SPA: `vercel.json`

Validado en producción:

- carga de la home
- registro real con Supabase
- redirección de rutas privadas sin sesión
- login real con Supabase
- acceso a `/app` y `/app/profile`
- persistencia de sesión después de recargar `/app/profile`
- logout y bloqueo posterior de rutas privadas

Validado localmente el 14 de abril de 2026:

- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm test`

## Flujo de auth base

- `register` crea cuenta con email/password
- guarda `account_type` y `full_name` en `user_metadata`
- `login` usa Supabase Auth
- `logout` cierra sesión
- rutas bajo `/app` requieren sesión
- la sesión persiste al recargar si Supabase está configurado
- después de login/registro el destino depende de `profile_status`
  - `incomplete` → `/onboarding`
  - `complete` → `/app/profile`

## Flujo de perfiles Semana 5

- `/onboarding`
  - onboarding técnico de 3 pasos
  - avatar opcional
  - perfil mínimo obligatorio para marcar `profile_status = complete`
- `/directory`
  - resumen público agregado del directorio
  - muestra masa crítica sin exponer fichas individuales
- `/directory/:profileId`
  - perfil público ligero del autor
  - muestra identidad profesional básica y actividad reciente en foro
- `/app/directory`
  - grid privado de perfiles completos
  - búsqueda por texto, filtro por país y filtro por especialidad
- `/app/directory/:profileId`
  - detalle profesional privado del perfil seleccionado
- `/app/profile`
  - ficha técnica-profesional del usuario autenticado
  - muestra resumen, especialidades, experiencia y contacto con privacidad básica
- `/app/profile/edit`
  - edición de identidad profesional
  - multi-select de especialidades
  - CRUD básico de experiencia
  - upload de avatar con `Supabase Storage`
- `/forum`
  - listado público de temas con categorías, metadata y CTA de participación
- `/forum/thread/:threadSlug`
  - detalle público del tema
  - respuestas públicas y composer autenticado
- `/forum/new`
  - creación de tema para usuarios autenticados con `profile_status = complete`

## SQL adicional de Semana 5

- `supabase/migrations/20260414_000004_profiles_week5.sql`
  - agrega `profile_status`, contacto opcional y seed de especialidades
  - amplía `verification_status`
  - agrega `description` y `achievements` a `experiences`
- `supabase/migrations/20260414_000005_companies_insert_policy.sql`
  - habilita `INSERT` autenticado en `companies` para que onboarding, edición y experiencias puedan resolver empresa/ingenio sin romper RLS
- `supabase/migrations/20260414_000006_directory_week6.sql`
  - agrega funciones seguras para resumen público y lectura privada del directorio
- `supabase/migrations/20260415_000007_forum_week7.sql`
  - agrega slugs, estados, replies anidadas, reply count y last activity al foro
  - agrega funciones RPC para lectura pública, publicación autenticada y perfil público ligero
- `supabase/migrations/20260416_000008_content_week8.sql`
  - agrega `content_items`, `events` y `price_items`
  - aplica índices y RLS de lectura pública solo para contenido `published`

## Seed demo de Semana 5

Para cerrar el pendiente de `TASKS.md`, el repo ahora incluye un seed idempotente con 10 perfiles técnicos demo distribuidos por país, experiencia y especialidades:

- script: `scripts/seed-week5-demo-profiles.mjs`
- comando: `node scripts/seed-week5-demo-profiles.mjs`
- alcance:
  - crea o actualiza 10 usuarios demo en `auth.users`
  - confirma el email automáticamente
  - completa `profiles` con `profile_status = complete`
  - sincroniza `profile_specialties`
  - recrea experiencias demo por perfil
  - crea empresas faltantes en `companies`

Variables necesarias para correrlo:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` o, si prefieres reutilizar el frontend, `VITE_SUPABASE_URL`
- `WEEK5_DEMO_PASSWORD` opcional

Si `WEEK5_DEMO_PASSWORD` no está definida, el script usa esta contraseña por defecto:

```text
ZucarlinkDemo2026!
```

Uso:

```bash
node scripts/seed-week5-demo-profiles.mjs
```

El script es idempotente para esas 10 cuentas: si ya existen, actualiza metadata, perfil, especialidades y experiencias para dejarlas en un estado consistente.

## Seed de foro Semana 7

El repo ahora incluye un seed reproducible para categorías, autores y publicaciones semilla del foro:

- script: `scripts/seed-week7-forum.mjs`
- comando: `node scripts/seed-week7-forum.mjs`
- alcance:
  - garantiza autores demo con perfil completo
  - inserta o actualiza las 6 categorías técnicas oficiales
  - inserta o actualiza 10 temas semilla
  - agrega respuestas iniciales a algunos hilos para evitar vacío

Variables necesarias:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` o `VITE_SUPABASE_URL`
- `WEEK7_FORUM_PASSWORD` opcional

Si `WEEK7_FORUM_PASSWORD` no está definida, el script usa esta contraseña por defecto:

```text
ZucarlinkForum2026!
```

## Seed editorial Semana 8

Semana 8 agrega un módulo público de `Información` con noticias, blog, eventos y precios curados manualmente.

- script: `scripts/seed-week8-content.mjs`
- guía editorial: `docs/week8-content-sources.md`
- verificación SQL: `supabase/sql/verify_content_week8.sql`

Uso esperado:

```bash
node scripts/seed-week8-content.mjs
```

Antes de correrlo:

1. aplicar `supabase/migrations/20260416_000008_content_week8.sql`
2. confirmar `SUPABASE_SERVICE_ROLE_KEY`
3. ejecutar el script de seed
4. correr la verificación con `supabase/sql/verify_content_week8.sql`

El seed carga 20 piezas iniciales distribuidas así:

- 8 noticias
- 4 artículos
- 4 eventos
- 4 precios o indicadores

## Estado

El estado actual deja lista la transición a activación y refinamiento de Semana 7:

- registro, login, logout y persistencia de sesión verificados
- rutas públicas y privadas funcionando
- migraciones SQL y storage listos para Supabase
- onboarding técnico y perfil editable funcionando en frontend
- experiencia, especialidades y avatar conectados al esquema actual
- resumen público de directorio y rutas privadas del directorio integradas al router
- foro público con categorías, detalle, respuestas y creación de temas
- perfil público del autor conectado desde el foro
- actividad del foro visible en home y perfil autenticado
- deploy activo en Vercel
