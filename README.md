# Zucarlink

Base técnica inicial del MVP de Zucarlink para la Semana 4.

## Objetivo actual

Este repositorio cubre la base técnica inicial de Semana 4:

- frontend con `Vite + React + TypeScript`
- rutas públicas y privadas base
- integración con `Supabase`
- autenticación mínima con email/password

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

## Estado

La base técnica de Semana 4 quedó cerrada para continuar con Semana 5:

- registro, login, logout y persistencia de sesión verificados
- rutas públicas y privadas funcionando
- migraciones SQL y storage listos para Supabase
- deploy activo en Vercel
