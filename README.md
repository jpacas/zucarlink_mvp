# Zucarlink MVP

Plataforma de red profesional para la industria azucarera. Conecta técnicos de campo con proveedores de insumos y servicios.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Routing | React Router DOM v7 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Email | Resend vía Supabase Edge Functions |
| Deploy | Vercel |

## Arranque local

```bash
npm install
cp .env.example .env   # completar con credenciales de Supabase
npm run dev
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (frontend) |
| `VITE_SUPABASE_ANON_KEY` | Clave anon de Supabase (frontend) |
| `SUPABASE_URL` | URL del proyecto Supabase (scripts y CLI) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio para scripts de seed y Edge Functions |
| `RESEND_API_KEY` | API key de Resend para envío de emails |
| `RESEND_FROM_EMAIL` | Dirección de envío (default: `no-reply@zucarlink.com`) |
| `EMAIL_WEBHOOK_SECRET` | Token de autenticación del webhook de emails |

Las variables `RESEND_*` y `EMAIL_WEBHOOK_SECRET` se configuran como **Supabase Secrets**, no en Vercel.

## Scripts disponibles

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción (typecheck + vite build)
npm run preview      # previsualizar build local
npm run lint         # ESLint
npm run typecheck    # TypeScript sin emitir archivos
npm test             # tests con Vitest
npm run test:watch   # tests en modo watch
```

## Base de datos (Supabase)

Las migraciones se aplican en orden desde `supabase/migrations/`:

| # | Archivo | Qué agrega |
|---|---|---|
| 001 | `initial_schema` | 12 tablas base: perfiles, empresas, especialidades, experiencias, foro, conversaciones, mensajes, proveedores, leads |
| 002 | `avatars_storage` | Bucket privado `avatars` con RLS por usuario |
| 003 | `security_baseline` | Trigger que crea perfil al registrarse un nuevo usuario |
| 004 | `profiles_week5` | `profile_status`, campos de contacto, seed de 20 especialidades |
| 005 | `companies_insert_policy` | Permite crear empresas desde onboarding |
| 006 | `directory_week6` | Funciones RPC para resumen y búsqueda del directorio |
| 007 | `forum_week7` | Slugs, métricas, replies anidadas, funciones RPC del foro |
| 008 | `content_week8` | Tablas `content_items`, `events`, `price_items` |
| 009 | `providers_week9` | Modelo comercial de proveedores y leads, RPCs de búsqueda |
| 010 | `providers_admin_week9` | Funciones de administración de proveedores |
| 011 | `admin_operational_dashboard` | Función `get_admin_operational_dashboard()` con KPIs |
| 012 | `messages` | Funciones RPC de mensajería: hilos, envío, lectura |
| 013 | `admin_verifications` | Flujo de verificación de perfiles por admins |
| 014 | `public_profile_preview` | Función para previsualización pública de perfiles |
| 015 | `business_logic_fixes` | Reemplazo atómico de especialidades, deduplicación de empresas |

## Seeds de desarrollo

Estos scripts pueblan la base de datos con datos demo. Requieren `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

```bash
node scripts/seed-week5-demo-profiles.mjs   # 10 perfiles técnicos completos
node scripts/seed-week7-forum.mjs           # 6 categorías + 10 temas del foro
node scripts/seed-week8-content.mjs         # 8 noticias, 4 artículos, 4 eventos, 4 precios
node scripts/seed-week9-providers.mjs       # 5 proveedores activos con categorías
```

Cada script es idempotente: si los datos ya existen, los actualiza sin duplicar.

Contraseña para cuentas demo: obligatoria vía variable de entorno `SEED_DEMO_PASSWORD` (sin valor por defecto — los scripts fallan si no está seteada).

## Edge Functions (email)

`supabase/functions/send-email/` — webhook que dispara emails en tres eventos:

| Evento | Trigger | Email enviado |
|---|---|---|
| Perfil completado | `profiles.UPDATE` (status: incomplete → complete) | Bienvenida personalizada según tipo de cuenta |
| Mensaje recibido | `messages.INSERT` | Notificación con preview del mensaje (suprimida si el receptor estuvo activo en los últimos 5 min) |
| Lead de proveedor | `provider_leads.INSERT` | Notificación al proveedor con datos de contacto del solicitante |

## Estructura del proyecto

```
src/
  main.tsx              # punto de entrada
  routes/               # configuración de rutas (AppRouter)
  layouts/              # contenedores de página (PublicLayout, PrivateLayout)
  components/           # componentes compartidos (Logo, Skeleton, Breadcrumbs…)
  features/             # lógica de dominio
    auth/               # sesión, guards de ruta
    profile/            # perfil técnico del usuario
    providers/          # perfiles comerciales de proveedores
    directory/          # directorio de miembros
    forum/              # foro técnico
    messages/           # mensajería privada
    content/            # noticias, blog, eventos, precios
    admin-dashboard/    # panel de administración
  pages/                # componentes de nivel de ruta
  lib/                  # utilidades (supabase, storage, analytics)
  types/                # tipos compartidos
  styles/               # CSS global (design system completo)

supabase/
  migrations/           # esquema completo de base de datos (aplicar en orden)
  functions/            # Edge Functions de Supabase

scripts/                # seeds de datos demo para desarrollo
```

## Deploy

- Hosting: Vercel
- URL: `https://zucarlinkmvp.vercel.app`
- `vercel.json` configura el rewrite de SPA para que todas las rutas sirvan `index.html`
