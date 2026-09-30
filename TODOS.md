# TODOS

Fuente de verdad del plan de crecimiento técnico: `/plan-ceo-review` del 2026-09-30, revisado con `/plan-eng-review` y `/plan-design-review` el mismo día. Documento completo con las 23 tareas priorizadas, diagramas y hallazgos de las 3 revisiones (incluyendo 3 pasadas de Codex como voz externa): `~/.gstack/projects/jpacas-zucarlink_mvp/ceo-plans/2026-09-30-main-tecnico-growth.md`.

## Estado (2026-09-30)

**Fase 0, 1, 2 y 3 desplegadas y verificadas en producción.** Las 8 migraciones (incluyendo el fix de `20260715000050`, que nunca había llegado a producción — bloqueaba todo el resto por un `CREATE OR REPLACE` que intentaba cambiar columnas de retorno) corrieron con `supabase db push`. Verificado directamente contra `https://www.zucarlink.com`:
- `/sitemap.xml` tiene 23 URLs `/directory/:id` reales (T5/T12).
- El endpoint `social-preview` devuelve OG/Twitter reales para un perfil real, con fallback y redirect funcionando (T13).
- La regla de ruteo por user-agent en `vercel.json` funciona: bots reciben la card personalizada, browsers normales reciben la SPA (probado con `curl -A`).
- T10b corrido: 0 de las 10 cuentas demo conocidas existen en esta base — el seed de Semana 5 nunca se corrió contra producción, nada que backfillear.

**No verificado (sin acceso a la base de datos desde este entorno):** que `analytics_events` recibe filas reales de uso (T1, el propósito original de toda la Fase 0), y el comportamiento en producción de T9/T11/T14 (verificación admin, rate limit de leads, referidos). El checkpoint de T3 (umbral 15%/4 semanas, cohorte ≥30 registros) arranca desde la fecha real de este deploy — completar esa fecha en el criterio de éxito de arriba cuando se confirme.

**Fase 4 (T17-T19) implementada 2026-09-30, por instrucción explícita del usuario — anula el gate original que esperaba al checkpoint de T3 (2026-10-28).** `company_type`, centro de notificaciones y reputación/gamificación están en código, verificados localmente (typecheck/lint/test/build), pero **no desplegados a producción todavía** — requieren aplicar 3 migraciones nuevas más (`20260930000058` a `20260930000060`) antes de tener efecto. T16 (distribución de contenido en Guatemala) sigue sin empezar — es trabajo de GTM del founder, no de código; el ~1 día de setup técnico que le corresponde se hace cuando esa conversación esté encaminada, no antes.

## Criterio de éxito de Fase 0 (T3) — checkpoint de decisión

Fase 0 (T1 analytics, T2 instrumentación, T4 redirect de onboarding) no es solo "medir" — define de antemano qué hacer con el número.

- **Métrica:** % de nuevos registros técnicos que completan `onboarding_completed` → al menos una acción significativa (`first_forum_post` OR `first_message_sent` OR click real en una card del directorio, NO la sola carga de página del redirect forzado — ver corrección de Codex en el eng review) dentro de 7 días desde el registro.
- **Cohorte mínima:** ≥30 registros técnicos nuevos antes de evaluar el umbral (corrección de Codex — sin tamaño mínimo, el número no es interpretable).
- **Umbral:** si el resultado es <15% en las primeras 4 semanas calendario después de que T1+T2+T4 estén en producción, el resultado es **inconclusivo — investigar** (calidad de tráfico, fricción de onboarding, densidad de pares activos) antes de concluir que es un problema de demanda. No es un veredicto automático de "reabrir el pivote de agosto" — es la señal para investigar con los datos reales de `analytics_events` cuál de esas causas aplica.
- **Checkpoint:** 2026-10-28 (4 semanas calendario desde el deploy a producción de T1+T2+T4, 2026-09-30).
- **Cómo consultar:** query directa sobre `analytics_events` con `service_role` (RLS bloquea lectura para roles no-admin por diseño, ver migración `20260930000051_analytics_events.sql`).

## Fase 4 — apuestas estratégicas (después de que Fase 0-3 esté en producción y midiendo)

Menor prioridad que Fase 0-3. No arrancar hasta tener datos reales del checkpoint de arriba.

- **T14** — Referidos/invitación entre técnicos (tabla `referrals`, código único no adivinable, guard anti-auto-referido).
- **T16** — Distribución de contenido en el nodo único = **Guatemala** (decidido post-review — ver ATAGUA/CENGICAÑA como riel institucional ya existente en `scripts/seed-week8-content.mjs:305-409`). Único gate restante: T1 en producción.
- **T17** — Columna `company_type` en `companies` existente (selector de tipo de organización).
- **T18** — Centro de notificaciones in-app (bell + feed), sin tinte de rol (usa `.nav-unread-badge` existente, no `--role-tecnico` — corrección del design review), excluye eventos de mensaje (delega al badge de Mensajes ya existente).
- **T19** — Reputación/gamificación en el foro (contador incremental O(1) + badges, con reserva del reviewer — el usuario la incluyó pese a la recomendación de diferir).

## Decisiones abiertas (no bloquean Fase 0-3)

- **Grants reales de `upsert_company` en producción sin verificar** (Codex eng review D1) — confirmar si `PUBLIC` está efectivamente revocado antes de exponer `company_type` (T17) vía ese RPC.
- **Toast de celebración de referido** — retirado del scope de T14/T18 en el design review por contradecir la política de motion de DESIGN.md ("minimal-funcional, sin coreografía"). Requiere aprobación explícita separada antes de sumarse, no se implementa por defecto.
- **`provider_leads` permite insert directo a usuarios autenticados**, saltándose las validaciones del RPC `create_provider_lead` (`20260414000001_initial_schema.sql:448`, policy `auth.uid() = requester_id` — un usuario autenticado puede escribir directo a la tabla sin pasar por el chequeo de "proveedor activo" ni la validación de campos). Hallazgo de Codex (eng review D3), fuera del scope de T11 (rate limit de leads anónimos). Sin dueño ni fecha asignada todavía.
- **Captura de analytics para visitantes anónimos** (T1b) — diferida deliberadamente en T1. Sin esto, eventos de visitantes no registrados (ej. en `/directory` o `/forum` público) son invisibles al funnel. Necesita el patrón RPC `security definer` + rate limiting (mismo patrón que `create_provider_lead`), no una política RLS directa para `anon`.
