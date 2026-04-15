# Zucarlink

Base técnica del MVP de Zucarlink con Semana 4 cerrada y el módulo de perfiles de Semana 5 en marcha.

## Objetivo actual

Este repositorio cubre:

- frontend con `Vite + React + TypeScript`
- rutas públicas y privadas base
- integración con `Supabase`
- autenticación mínima con email/password
- onboarding técnico progresivo
- perfil propio editable
- especialidades, experiencia y avatar conectados a Supabase

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
npm run seed:week5-demo
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
- `/app/profile`
  - ficha técnica-profesional del usuario autenticado
  - muestra resumen, especialidades, experiencia y contacto con privacidad básica
- `/app/profile/edit`
  - edición de identidad profesional
  - multi-select de especialidades
  - CRUD básico de experiencia
  - upload de avatar con `Supabase Storage`

## SQL adicional de Semana 5

- `supabase/migrations/20260414_000004_profiles_week5.sql`
  - agrega `profile_status`, contacto opcional y seed de especialidades
  - amplía `verification_status`
  - agrega `description` y `achievements` a `experiences`
- `supabase/migrations/20260414_000005_companies_insert_policy.sql`
  - habilita `INSERT` autenticado en `companies` para que onboarding, edición y experiencias puedan resolver empresa/ingenio sin romper RLS

## Seed demo de Semana 5

Para cerrar el pendiente de `TASKS.md`, el repo ahora incluye un seed idempotente con 10 perfiles técnicos demo distribuidos por país, experiencia y especialidades:

- script: `scripts/seed-week5-demo-profiles.mjs`
- comando: `npm run seed:week5-demo`
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
npm run seed:week5-demo
```

El script es idempotente para esas 10 cuentas: si ya existen, actualiza metadata, perfil, especialidades y experiencias para dejarlas en un estado consistente.

## Estado

El estado actual deja lista la transición a Semana 6:

- registro, login, logout y persistencia de sesión verificados
- rutas públicas y privadas funcionando
- migraciones SQL y storage listos para Supabase
- onboarding técnico y perfil editable funcionando en frontend
- experiencia, especialidades y avatar conectados al esquema actual
- deploy activo en Vercel
