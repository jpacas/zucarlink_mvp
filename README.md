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
| `ENGAGEMENT_CRON_SECRET` | Token de autenticación del cron de re-engagement (`engagement-emails`) |

Las variables `RESEND_*`, `EMAIL_WEBHOOK_SECRET` y `ENGAGEMENT_CRON_SECRET` se configuran como **Supabase Secrets**, no en Vercel.

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
| … | … | (016–027 omitidas de esta tabla; ver `supabase/migrations/` para el detalle) |
| 028 | `engagement_foundation` | `profiles.last_seen_at`, tabla `notification_preferences`, log `engagement_email_log`, RPCs de candidatos para re-engagement |
| 029 | `engagement_cron` | Habilita `pg_cron`/`pg_net` y programa la llamada horaria a `engagement-emails` |

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

`supabase/functions/send-email/` — webhook que dispara emails en eventos de la base de datos:

| Evento | Trigger | Email enviado |
|---|---|---|
| Perfil completado | `profiles.UPDATE` (status: incomplete → complete) | Bienvenida personalizada según tipo de cuenta |
| Lead de proveedor | `provider_leads.INSERT` | Notificación al proveedor con datos de contacto del solicitante |
| Respuesta en el foro | `forum_replies.INSERT` | Notifica al autor del tema y a quienes le dieron like (según sus preferencias) |

`supabase/functions/engagement-emails/` — invocada por `pg_cron` cada hora (no por webhooks), corre dos jobs de re-engagement:

| Job | Regla | Email enviado |
|---|---|---|
| Recordatorio de no leídos | Mensaje sin leer con más de 24h de antigüedad, receptor no activo recientemente | Resumen de conversaciones pendientes (máx. 1 por conversación cada 72h) |
| Digest de inactividad | Usuario sin `last_seen_at` en los últimos 7 días | Resumen personalizado (mensajes sin leer, respuestas en tus temas y en temas que likeaste, temas populares nuevos); reintenta cada 14 días, máximo 3 veces por racha de inactividad |

Ambas funciones comparten helpers en `supabase/functions/_shared/`: `resend.ts` (cliente de envío), `email-log.ts` (dedupe/rate-limit vía `engagement_email_log`), `notification-prefs.ts` (preferencias + token de unsubscribe) y `email-footer.ts` (pie con link de gestión de preferencias).

`supabase/functions/sitemap/` — genera `sitemap.xml` dinámico (rutas fijas + slugs publicados de contenido, proveedores activos y temas del foro). Vercel proxya `/sitemap.xml` hacia esta función (rewrite en `vercel.json`). Desplegar con `supabase functions deploy sitemap --no-verify-jwt` **antes** del deploy de Vercel que elimina el sitemap estático, para que `/sitemap.xml` no quede sin respuesta.

### Pasos manuales de configuración (no versionados en git)

1. En el dashboard de Supabase, eliminar cualquier Database Webhook antiguo sobre `messages.INSERT` (el aviso inmediato de mensaje nuevo fue reemplazado por el recordatorio de 24h).
2. `supabase secrets set ENGAGEMENT_CRON_SECRET=...` (mismo valor que se guardará en Vault).
3. En el SQL Editor, crear los secrets de Vault que usa la migración `20260702_000029_engagement_cron.sql`:
   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
   select vault.create_secret('<ENGAGEMENT_CRON_SECRET value>', 'engagement_cron_secret');
   ```
4. `supabase functions deploy send-email engagement-emails --no-verify-jwt` y `supabase db push`.

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
    notifications/      # preferencias de notificación por email
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
