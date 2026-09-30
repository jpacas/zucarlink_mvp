# TODOS

Fuente de verdad del plan de crecimiento técnico: `/plan-ceo-review` del 2026-09-30, revisado con `/plan-eng-review` y `/plan-design-review` el mismo día. Documento completo con las 23 tareas priorizadas, diagramas y hallazgos de las 3 revisiones (incluyendo 3 pasadas de Codex como voz externa): `~/.gstack/projects/jpacas-zucarlink_mvp/ceo-plans/2026-09-30-main-tecnico-growth.md`.

## Estado (2026-09-30)

Fase 0, 1, 2 y 3 implementadas y verificadas (`npm run typecheck && npm run lint && npm test -- --run && npm run build`, todo en verde, 148 tests). **Nada de esto está desplegado ni aplicado contra una base de datos real** — este entorno no tiene `supabase`/`docker`/`deno`, así que las migraciones nuevas (`20260930000051` a `20260930000057`) están escritas y revisadas por lectura, pero no corridas contra Postgres. Antes de deploy:
1. Aplicar las 7 migraciones nuevas en orden.
2. Correr manualmente `node scripts/backfill-is-demo.mjs` (T10b, necesita `SUPABASE_SERVICE_ROLE_KEY` de producción).
3. Desplegar las 2 edge functions nuevas (`social-preview`, y redeploy de `sitemap`/`send-email` que cambiaron) con `--no-verify-jwt` donde corresponda.
4. Verificar que la regla de ruteo por user-agent de `vercel.json` (T13) funciona en preview antes de mergear a producción.

**Fase 4 (T16-T19) deliberadamente sin empezar.** El plan mismo dice que Fase 4 no arranca hasta que Fase 0-3 esté en producción *midiendo* — ese gate no se cumple todavía porque nada está desplegado. T16-T19 son features grandes (centro de notificaciones, reputación/gamificación, columna `company_type`, distribución de contenido en Guatemala) que no deberían construirse contra una hipótesis sin datos reales del checkpoint de T3.

## Criterio de éxito de Fase 0 (T3) — checkpoint de decisión

Fase 0 (T1 analytics, T2 instrumentación, T4 redirect de onboarding) no es solo "medir" — define de antemano qué hacer con el número.

- **Métrica:** % de nuevos registros técnicos que completan `onboarding_completed` → al menos una acción significativa (`first_forum_post` OR `first_message_sent` OR click real en una card del directorio, NO la sola carga de página del redirect forzado — ver corrección de Codex en el eng review) dentro de 7 días desde el registro.
- **Cohorte mínima:** ≥30 registros técnicos nuevos antes de evaluar el umbral (corrección de Codex — sin tamaño mínimo, el número no es interpretable).
- **Umbral:** si el resultado es <15% en las primeras 4 semanas calendario después de que T1+T2+T4 estén en producción, el resultado es **inconclusivo — investigar** (calidad de tráfico, fricción de onboarding, densidad de pares activos) antes de concluir que es un problema de demanda. No es un veredicto automático de "reabrir el pivote de agosto" — es la señal para investigar con los datos reales de `analytics_events` cuál de esas causas aplica.
- **Checkpoint:** 4 semanas calendario después de la fecha de deploy a producción de T1+T2+T4. *(Completar la fecha exacta el día del deploy — no se fija hoy porque el deploy todavía no ocurrió en esta sesión.)*
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
