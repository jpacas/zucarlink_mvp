# Auditoría Zucarlink MVP — experiencia, backend/notificaciones y robustez de negocio

**Alcance real de esta auditoría:** no entré autenticado a `/app/*` (dashboard, mensajería,
panel admin) por decisión explícita — no hay un ambiente de staging separado de producción,
así que auditar eso habría significado tocar la única base de datos que existe. Todo lo que
sigue viene de código fuente y de las páginas públicas. Esto importa para las conclusiones de
negocio: la mayor parte de la superficie de notificaciones y automatización real vive detrás
del login, y ahí solo pude leer código, no observar comportamiento real.

---

## 1. Experiencia de llegada — ¿un desconocido entiende qué es esto en 5 segundos?

Recorrido: `/` → `/directory` → clic en "Conectar" de una card → `/register`, y en paralelo
`/proveedores` → "Solicitar activación comercial" → `/register`.

**Lo que funciona bien:**
- El hero de Home (`HomePage.tsx:32-47`) resuelve el test de 5 segundos: nombra la audiencia
  ("técnicos y especialistas"), la propuesta ("directorio curado, foro técnico, contacto con
  proveedores") y da tres salidas claras (crear perfil técnico / registrar empresa / explorar
  directorio).
- El registro soporta preselección de tipo de cuenta vía `?tipo=tecnico|proveedor`
  (`RegisterPage.tsx:23-24`), y el CTA de técnico en Home (`HomePage.tsx:41`) sí la usa
  (`/register?tipo=proveedor` en la línea 41 para proveedor).
- El header distingue visitante de usuario logueado y no mezcla navegación de cuenta con
  navegación de servicios (`AppHeader.tsx:11-16, 45-57`).

**Dónde se filtra el embudo (hallazgos concretos):**

1. **Los CTAs primarios de la página de proveedores registran a todos como "Técnico".**
   `ProvidersLandingPage.tsx:37` ("Solicitar activación comercial") y `:83` ("Sé el primero en
   aparecer") apuntan a `to="/register"` sin `?tipo=proveedor`. Como `RegisterPage.tsx:24`
   default a `'technician'` cuando no hay query param, una empresa que llega por la página de
   proveedores y hace clic en el botón principal de esa página cae en el formulario con el
   radio "Técnico" ya marcado — tiene que notar el error y cambiarlo ella misma. Es el flujo de
   conversión del lado que paga (proveedores) y tiene un defecto de una línea.

2. **"Conectar →" en las cards del directorio público no conecta con nadie.** En
   `DirectoryPage.tsx:107-111`, cada card de perfil tiene un botón "Conectar →" que en realidad
   redirige a `/register` genérico — no lleva a esa persona ni preserva quién generó el clic.
   Funcionalmente está bien (es el gate de registro), pero la copy promete una acción 1:1 que no
   ocurre; alguien que hace clic en 3 perfiles distintos termina 3 veces en la misma pantalla de
   registro sin explicación.

3. **Mensaje de doble filo en el hero de Home para un visitante proveedor.** El H1
   ("Conecta con técnicos y especialistas del sector azucarero") habla en singular al lado
   técnico, y a dos líneas de distancia el botón "Registrar mi empresa" le pide a un proveedor
   que se registre en un producto cuyo titular parece ser para técnicos. No es un error, pero sí
   una tensión de mensaje que la página de proveedores dedicada (`/proveedores`) sí resuelve
   mejor con su propio hero.

No re-abro tipografía, radios ni espaciado — eso ya se acordó con `DESIGN.md` en esta misma
sesión y no cambió.

---

## 2. Backend y notificaciones por correo

*(Auditoría de código, sin ejecutar nada ni enviar correos reales — hecha por un agente en
background sobre `supabase/functions/`, `supabase/migrations/` y el código de auth.)*

**Inventario de emails** — todo vía **Resend** (`supabase/functions/_shared/resend.ts`), salvo
los emails nativos de Supabase Auth (confirmación de registro, reset de password), que van por
el mailer default de Supabase, no por Resend:

| Email | Disparador | Camino |
|---|---|---|
| Bienvenida | `profiles.UPDATE` (perfil incompleto→completo) | DB Webhook → `send-email` → `on-profile-complete.ts` |
| Lead de proveedor | `provider_leads.INSERT` | DB Webhook → `send-email` → `on-provider-lead.ts` |
| Respuesta de foro (autor + likers) | `forum_replies.INSERT` | DB Webhook → `send-email` → `on-forum-reply.ts` |
| Recordatorio de mensajes no leídos | pg_cron horario | `engagement-emails` |
| Digest de inactividad | pg_cron horario | `engagement-emails` |

**Los 3 hallazgos que más pesan para operar esto sin supervisión constante:**

1. **El email de bienvenida puede duplicarse.** `profile_status` se recalcula en cada guardado
   de perfil (`profile-status.ts`), y el webhook dispara de nuevo cada vez que pasa de
   incompleto→completo. Si alguien edita su perfil, queda momentáneamente incompleto y lo
   vuelve a completar, recibe "bienvenida" otra vez. No hay guard de idempotencia en este
   camino (a diferencia de los emails de engagement, que sí tienen dedupe correcto vía
   `engagement_email_log`).

2. **`create_provider_lead` es invocable por usuarios anónimos, sin rate limit ni validación de
   formato de email**, y cada llamada exitosa dispara un correo real vía Resend. Es la
   superficie más barata de abusar a escala: un script sin cuenta puede generar volumen/costo
   de Resend y espamear la bandeja de un proveedor.

3. **La entrega es "fire-and-forget" sin reintento ni cola.** `send-email/index.ts` devuelve
   HTTP 200 aunque el envío falle (a propósito, para que Supabase no reintente el webhook), y
   solo hace `console.error`. Si Resend tiene una caída de minutos, esos correos se pierden para
   siempre — no hay dead-letter ni forma de reprocesar.

Adicional: la configuración de qué evento dispara `send-email` vive en **Database Webhooks
configurados a mano en el dashboard de Supabase**, documentado como paso manual no versionado
(`README.md:111-120`) — no está en una migración ni en IaC, así que no hay registro auditable de
qué está conectado a qué en cada ambiente. Y no existe ningún test automatizado (ni Deno ni
pgTAP) sobre las funciones edge o la lógica de dedupe/SQL — solo hay tests de UI con Supabase
mockeado.

---

## 3. Robustez de negocio: ¿qué tan lista está esto para operar sin intervención manual?

Estos tres hallazgos salen de evidencia directa de este repo/sesión, no de checklist genérico:

1. **Los perfiles demo siguen siendo indistinguibles de perfiles reales en el directorio
   público.** `scripts/seed-week5-demo-profiles.mjs` crea perfiles con emails
   `@zucarlink.test`, bios completas, empresas ("Ingenio Santa Lucía", etc.) y
   `verificationStatus: 'verified'` — es decir, aparecen con la misma insignia de confianza que
   un perfil real. Existe `scripts/cleanup-demo-data.mjs`, pero es un script manual con flag
   `--execute` explícito: si nadie lo corrió antes de exponer el directorio a prospectos reales,
   un técnico o proveedor que llega hoy ve "prueba social" que no existe. Esto es lo que vi
   renderizado en el directorio público durante esta sesión.

2. **No hay separación entre producción y un ambiente de prueba.** `.env.example` solo define
   una `SUPABASE_URL`/`VITE_SUPABASE_URL`, y no hay mención de staging en `README.md` ni
   `CLAUDE.md`. Esto no es solo un tema de higiene: significa que cualquier trabajo asistido por
   IA (yo, u otra herramienta) que necesite probar un flujo autenticado, correr una migración de
   prueba, o generar datos de seed, no tiene dónde hacerlo sin arriesgar datos reales. Es la
   razón concreta por la que esta auditoría no entró a `/app/*`.

3. **La activación de proveedores es 100% manual, sin cola de automatización.**
   `admin_update_provider_status` (`20260418000010_providers_admin_week9.sql:44-75`) exige
   `is_admin = true` en el JWT; el frontend solo crea un lead, un humano tiene que entrar al
   panel admin y cambiar el estado. Para el volumen actual está bien, pero es un techo de
   escalabilidad conocido: cada proveedor nuevo depende de que alguien lo revise a mano, y no
   hay SLA, cola visible ni notificación al equipo cuando un lead nuevo entra (más allá del
   email a quien esté suscrito al webhook).

Combinado con el punto 2 de la sección de backend (leads anónimos sin rate limit) y el punto 1
de esta sección (datos demo mezclados con reales), el cuadro es: la plataforma puede *recibir*
señal de negocio (leads, registros) sin intervención humana, pero no puede *procesarla*
confiablemente sin un humano revisando activaciones, sin ambiente separado para probar cambios,
y sin garantía de que lo que ve un prospecto en el directorio es 100% real.

---

## Top 5 hallazgos accionables (orden de impacto)

1. Agregar `?tipo=proveedor` a los dos CTAs de `ProvidersLandingPage.tsx` (líneas 37 y 83) —
   arreglo de una línea, afecta directamente la conversión del lado que paga.
2. Correr (o confirmar que se corrió) `cleanup-demo-data.mjs --execute` contra el ambiente que
   está expuesto públicamente, o marcar visualmente los perfiles demo si se necesitan para
   mostrar tracción.
3. Agregar rate limiting / validación de formato a `create_provider_lead` (llamable por `anon`).
4. Agregar un guard de idempotencia al email de bienvenida (mismo patrón que ya existe en
   `engagement_email_log` para los emails de engagement).
5. Decidir y documentar un ambiente de staging separado de producción — condiciona qué tan a
   fondo se puede probar cualquier cambio futuro (incluyendo el resto de esta auditoría, que no
   pudo cubrir `/app/*`).
