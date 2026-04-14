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
npm run typecheck
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

## Flujo de auth base

- `register` crea cuenta con email/password
- guarda `account_type` y `full_name` en `user_metadata`
- `login` usa Supabase Auth
- `logout` cierra sesión
- rutas bajo `/app` requieren sesión
- la sesión persiste al recargar si Supabase está configurado

## Estado

El frontend ya está listo para continuar con esquema de base de datos, RLS y storage en las siguientes fases.
